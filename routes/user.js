var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var socketio = require('socket.io');
var bcrypt = require('bcryptjs');

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

// 로그인 페이지
router.get('/login', function(request, response){
    console.log('login page');

    response.render('account/login');
});

// 회원가입 페이지
router.get('/join', function(request, response){
    console.log('join page');

    response.render('account/join');
});

// 회원가입 요청
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
            password: bcrypt.hashSync(body.password),
            created: today
        }
        // console.log(user);
        // console.log(user.password.length);
        
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

// 사용자 수정 페이지
router.get('/edit/:id', function(request, response){
    console.log('edit user id: ' + request.params.id);

    client.query('SELECT id, name FROM users WHERE id = ?', [
        request.params.id
    ], function(err, result){
        if(err){
            console.log(err)
            response.redirect('/user/' + request.params.id);
        }else{
            response.render('account/edit_user', {data: result[0]});
        }
    });

});

// 사용자 수정 요청
router.put('/edit/:id', function(request, response){
    console.log('edit put user id: ' + request.params.id);

    
    var body = request.body;
    // 새로운 비밀번호와 비밀번호 확인이 다른 경우
    if (body.newPassword != body.passwordConfirmation){

        response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
        response.write('<h1>패스워드 불일치</h1>');
        response.write('<br><a href="/user/edit/' + request.params.id + '"> re edit </a>');
        response.end();
    }else{
        client.query('SELECT * FROM users WHERE id = ?', [
            request.params.id
        ], function(err, result){
            if(err){
                console.log(err)
            }else{
                var originalPw = result[0].password;

                // 원래 패스워드와 입력한 패스워드가 다른 경우
                if(!bcrypt.compareSync(body.currentPassword, originalPw)){
                    response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
                    response.write('<h1>틀린 패스워드</h1>');
                    response.write('<br><a href="/user/edit/' + request.params.id + '"> re edit </a>');
                    response.end();
                }else{
                    var data = {
                        name: body.name,
                        password: bcrypt.hashSync(body.newPassword)
                    }

                    updateUser(request.params.id, data, function(err, result){
                        if(err){
                            console.log(err)
                        }
                    });
                }
    
            }
    
            response.redirect('/user/' + request.params.id);
        });
    }

    
});

// 사용자 삭제 요청
router.delete('/delete/:id', function(request, response){
    console.log('delete user id: ' + request.params.id)

    client.query('DELETE FROM users WHERE id=?', [
        request.params.id
    ], function () {
        response.redirect('/user');
     });
});

// 사용자 보기
router.get('/:id', function(request, response){
    console.log('show user id: ' + request.params.id);

    client.query('SELECT id, name FROM users WHERE id = ?', [
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
var addUser = function(data, callback){
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

var updateUser = function(id, data, callback){
    console.log('updateUser 호출');

    var exec = client.query('UPDATE users SET ? WHERE id=?', [
        data, id
    ], function(err, result){
        console.log('실행된 SQL : ' + exec.sql);

        if(err){
            console.log(err);
            callback(err, null);
        }else{
            callback(null, result);
        }
    });
}

module.exports = router;