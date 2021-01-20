var fs = require('fs');
var ejs = require('ejs');
var express = require('express');
var socketio = require('socket.io');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('./config/passport');
var methodOverride = require('method-override');

var util = require('./util');


// 서버 생성
var app = express();
var io = socketio();
var server = require('http').createServer(app);

io.attach(server);

// app.use(express.static(__dirname + '/public'));

// Express v4.16.0을 기준으로 express도 빌트인 body-parser를 넣었
// app.use(express.json()); // json으로 받아들인 정보를 분석함
// app.use(express.urlencoded({ extended: true }));
// // 이 옵션이 false면 노드의 querystring 모듈을 사용하여 쿼리스트링을 해석하고, 
// // true면 qs 모듈을 사용하여 쿼리스트링을 해석한다
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({  extended: false   }));
app.use(methodOverride('_method'));

// flash를 초기화, req.flash 사용가능
// req.flash(문자열, 저장할_값).
// flash는 배열로 저장, 순서대로 배열로 저장
// req.flash(문자열) 문자열에 저장된 값들을 배열로 불러옵니다. 
// 저장된 값이 없다면 빈 배열([])을 return합니다.
app.use(flash());

// secret은session을 hash화하는데
app.use(session({secret:'MySecret', resave:true, saveUninitialized:true}));

app.use(passport.initialize());
app.use(passport.session());

// app.use에 함수를 넣은 것을 middleware
// request가 올때마다 route에 상관없이 실행
// app.use들 중에 위에 있는 것 부터 순서대로 실행
app.use(function(request, response, next){
  // req.isAuthenticated()는 passport에서 제공하는 함수
  // 현재 로그인이 되어있는지 아닌지를 true,false로 return
  // 로그인이 되면 session으로 부터 user를 deserialize하여 생성
  response.locals.isAuthenticated = request.isAuthenticated();

  // 로그인된 user의 정보를 불러오는데 사용됩니다.
  response.locals.currentUser = request.user;
  console.log('currentUser: ' + JSON.stringify(request.user));
  next();
});


// 서버 실행
server.listen(52273, function () {
  console.log('server running at http://127.0.0.1:52273');
  // client.query('truncate customer')
});

// Routes
app.use('/', require('./routes/home'));
// request되기 전에 배치하여 모든 post routes에서 util.getPostQueryString 사용하도록
app.use('/board', util.getPostQueryString, require('./routes/board'));
app.use('/user', require('./routes/user'));


// 통신
io.sockets.on('connection', function(socket){
  console.log('io connection');


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

  socket.on('test', function(){
    console.log('test');
  });

});

