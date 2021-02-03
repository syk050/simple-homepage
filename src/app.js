const path = require('path');
const express = require('express');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('./lib/passport');
const methodOverride = require('method-override');
const MySQLStore = require('express-mysql-session')(session);

// const util = require('./util');
const { database, port } = require('./config');


// express를 실행하여 app object를 초기화 합니다
const app = express();

// Settings
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// Middlewares
// request가 올때마다 route에 상관없이 실행
// app.use들 중에 위에 있는 것 부터 순서대로 실행
app.use(bodyParser.urlencoded({  extended: false   }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

// secret은session을 hash화
app.use(session({
    secret:'MySecret', 
    resave:true, 
    saveUninitialized:true,
    store: new MySQLStore(database)
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(function(request, response, next){
  // req.isAuthenticated()는 passport에서 제공하는 함수
  // 현재 로그인이 되어있는지 아닌지를 true,false로 return
  response.locals.isAuthenticated = request.isAuthenticated();

  // 로그인이 되면 session으로 부터 user를 deserialize하여 생성
  response.locals.currentUser = request.user;
  
  // util의 모든 함수들을 ejs에서 사용가능
  response.locals.util = util;

  console.log('currentUser: ' + JSON.stringify(request.user));
  next();
});

// Routes
app.use('/', util.getPostQueryString, require('./routes/home.route'));
// request되기 전에 배치하여 모든 post routes에서 util.getPostQueryString 사용하도록
// app.use('/board', util.getPostQueryString, require('./routes/board'));
// app.use('/user', require('./routes/user'));
// app.use('/comment', util.getPostQueryString, require('./routes/comment'));


// Public
app.use(express.static(path.join(__dirname + '/public')));

module.exports = app;