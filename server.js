var fs = require('fs');
var ejs = require('ejs');
var mysql = require('mysql');
var express = require('express');
var socketio = require('socket.io');
var bodyParser = require('body-parser');

// DB접근
var client = mysql.createConnection({
  user: 'root',   password: '1234',  database: 'bulletin_board'
});

// 서버 생성
var app = express();
var io = socketio();
var server = require('http').createServer(app);

io.attach(server);

// app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({  extended: false   }));

// 서버 실행
server.listen(52273, function () {
  console.log('server running at http://127.0.0.1:52273');
  // client.query('truncate customer')
});


app.get('/', function (request, response) {
    console.log('root In');

    response.redirect('/board');
});

// 게시판 화면
app.get('/board', function(request, response){
  console.log('board In')

  fs.readFile('bulletin_board.html', 'utf8', function(err, data){
    client.query('SELECT num, title, name, DATE_FORMAT(writedate, "%y-%m-%d") AS wd, readcount FROM board ORDER BY num DESC', function(err, result){
      if (err){
        console.log(err);
      }
      else{
        response.send(ejs.render(data, {
          data: result
        }));
      }
    });
  });
})

// 게시글 선택
app.get('/board/:id', function(request, response){
  console.log('board id In : ' + request.params.id);

  // 조회수 증가
  var rc = 0;
  client.query('SELECT readcount FROM board WHERE num = ?', [
    request.params.id
  ], function(err, data){
    if(err){
      console.log(err);
    }else{
      // console.log(data[0].readcount)
      rc = data[0].readcount + 1;

      client.query('UPDATE board SET readcount=? WHERE num=?', [
        rc, request.params.id
      ]);
    }
  });

  // 게시글 표시
  fs.readFile('post.html', 'utf-8', function(error, data){
    client.query('SELECT * FROM board WHERE num = ?', [
      request.params.id
    ], function(error, result){
      if (result[0] == undefined){
        response.writeHead(404);
        response.end('Not found');
      }else{
        response.send(ejs.render(data,{
          data: result[0]
        }));
      }
    });
  });
});

// 게시글 작성
app.get('/creating_post', function(request, response){
  console.log('creating_post');

  fs.readFile('posting.html', 'utf8', function(err, data){
    response.send(data);
  })
});

// 게시글 작성 완료
app.post('/creating_post', function(request, response){
  console.log('creat_post');

  var body = request.body;
  client.query('INSERT INTO board (name, title, content) VALUES ("undefiend", ?, ?)',[
    body.title, body.content
  ], function(err){
    if(err){
      console.log(err)
    }
    response.redirect('/board');
  });
});

// 게시글 수정
app.get('/edit/:id', function(request, response){
  console.log('edit id In : ' + request.params.id);

  fs.readFile('edit_post.html', 'utf8', function(err, data){
    client.query('SELECT * FROM board WHERE num = ?', [
      request.params.id
    ], function(err, result){
      response.send(ejs.render(data, {
        data: result[0]
      }));
    });
  });
});

// 게시글 수정 완료
app.post('/edit/:id', function(request, response){
  console.log('update id: ' + request.params.id)

  var body = request.body
  client.query('UPDATE board SET title=?, content=? WHERE num=?', [
    body.title, body.content, request.params.id
  ], function(err, result){
    response.redirect('/board/' + request.params.id);
  });
});


// 아이템 삭제
app.get('/delete/:id', function (request, response) {
  console.log('In GET delete :' + request.params.id);

  client.query('DELETE FROM products WHERE id=?', [request.params.id], function () {
    response.redirect('/admin');
 });
});


// db에 초기 아이템 생성
app.get('/__!create_item__', function(request, response) {
  console.log('In !create_item');

  // // 아이템이 없다면 생성
  // client.query('SELECT COUNT(*) AS cnt FROM products', function(err, result){
  //   if (result[0].cnt == 0){
  //     // csv 파일 읽어서 쿼리로 입력
  //     fs.readFile('MOCK_DATA.csv', 'utf-8', function(error, data){
  //         let dataArray = data.split(/\r?\n/);
  //         dataArray.forEach(element => {
  //           let test = element.split(',');
  //           client.query('INSERT INTO products (name, modelnumber, series) VALUES (?, ?, ?)', [
  //             test[0], test[1], test[2]
  //           ]);
  //         });
  //     });
  //     console.log('Create Item');
  //   }
  // });

  response.redirect('/admin');
});

// board 테이블 초기화
app.get('/__!truncate_board__', function(request, response){
  console.log('In !ctruncate_products');

  client.query('truncate board', function(error, result){
    if(!error){
      console.log(result);
    }

    response.redirect('/admin');
  });
});

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

