var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var socketio = require('socket.io');

var client = mysql.createConnection({
    user: 'root',   password: '1234',  database: 'bulletin_board'
});
var io = socketio();


router.get('/', function (request, response) {
    console.log('user page in');

    client.query('SELECT id, name FROM users', function(err, result){
        if (err){
            console.log(err);
            response.redirect('/');
        }else{
            response.render('account/users', {data: result});
        }
    })
});

// 로그인
router.get('/login', function(request, response){
    console.log('login page');

    response.render('account/login');
});

// 회원가입
router.get('/join', function(request, response){
    console.log('join page');

    response.render('account/join');
});

// 회원가입 신청
router.post('/join', function(request, response){
    console.log('join post');

    var body = request.body; 

    if (body.password != body.passwordConfirmation){
        console.log('pw_not_matched');

        response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        response.write('<h1>패스워드 불일치</h1>');
        response.write('<br><a href="/user/join"> re join </a>');
        response.end();

    }else{
        var today = new Date()
        var user = {
            id: body.id,
            name: body.name,
            password: body.password,
            created: today
        }

        addUser(user, function(err, result){
            if(err){
                // console.log(err.code)
                if (err.code == "ER_DUP_ENTRY"){
                    response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                    response.write('<h1>중복된 아이디</h1>');
                    response.write('<br><a href="/user/join"> re join </a>');
                    response.end();
                }
                
            }else{
                response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                response.write('<h1>회원가입 성공</h1>');
                response.write('<br><a href="/user/login"> go login</a>');
                response.end();
            } 
        });
    }
    
});

router.get('/:id', function(request, response){
    console.log('show user id: ' + request.params.id);

    client.query('SELECT * FROM users WHERE id = ?', [
        request.params.id
    ], function(err, result){
        if(err){
            console.log(err)
            response.redirect('/user');
        }else{
            response.render('account/show', {data: result[0]});
        }
    });
});

// 사용자 추가
var addUser = function(data, callback)
{
    console.log('addUser 호출');

    //users 테이블에 데이터 추가
    var exec = client.query('INSERT INTO users SET ?', data,
        function (err, result)
        {
            console.log('실행된 SQL : ' + exec.sql);

            if (err) {
                console.log('sql 실행 시 에러 발생');
                callback(err, null);
                return;
            }

            callback(null, result);
        }
    );
  
}

module.exports = router;