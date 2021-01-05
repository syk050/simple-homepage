var fs = require('fs');
var ejs = require('ejs');
var express = require('express');
var socketio = require('socket.io');
var bodyParser = require('body-parser');
var methodOverride = require('method-override')

// 서버 생성
var app = express();
var io = socketio();
var server = require('http').createServer(app);

io.attach(server);

// app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({  extended: false   }));
app.use(methodOverride('_method'));


// 서버 실행
server.listen(52273, function () {
  console.log('server running at http://127.0.0.1:52273');
  // client.query('truncate customer')
});

// Routes
app.use('/', require('./routes/home'));
app.use('/board', require('./routes/board'));


// 통신
io.sockets.on('connection', function(socket){
  console.log('io connection');

  // 소비자가 상품 구매
  socket.on('itemBuy', function(data){
    console.log('itemBuy : ' + data);

    client.query('INSERT INTO customer (id, name, modelnumber, series) SELECT * FROM products WHERE id = ?', [
      data
    ], function(error, result){
      if (error){
        console.log(error);
      }
      else{
        io.sockets.emit('itemBuySignal');
      }
    });
  });

  // 관리자가 상품 구매 취소
  socket.on('itemCancel', function(data){
    console.log('itemCancel' + data);

    client.query('UPDATE customer SET status = -1 WHERE id = ?', [
      data
    ], function(error, result){
      if(error){
        console.log(error);
      }else{
        client.query('SELECT * FROM customer WHERE id = ?', [
          data
        ], function(error, result){
          io.sockets.emit('itemCancelSignal', result[0]);
        });
      }
    });
  });

  // 관리자가 상품 구매 수락
  socket.on('itemPermit', function(data){
    console.log('itemPermit : ' + data);

    client.query('UPDATE customer SET status = 1 WHERE id = ?', [
      data
    ], function(error, result){
      if(error){
        console.log(error);
      }else{
        client.query('SELECT * FROM customer WHERE id = ?', [
          data
        ], function(error, result){
          io.sockets.emit('itemPermitSignal', result[0]);
        });
      }
    })
  });

});

