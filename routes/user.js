var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');

var client = mysql.createConnection({
    user: 'root',   password: '1234',  database: 'bulletin_board'
});


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

    // user 생성시에 에러가 있는 경우 redirect로 돌아옴
    // join 페이지에 에러와 기존에 입력했던 값들을 보여주기 위해
    // flash는 배열
    var user = request.flash('user')[0] || {};
    var errors = request.flash('errors')[0] || {};


    response.render('account/join', {user: user, errors: errors});
});

// 회원가입 요청
router.post('/join', function(request, response){
    console.log('join post');

    var body = request.body; 

    var today = new Date()
    var data = {
        id: body.id,
        name: body.name,
        password: body.password,
        passwordComfirm: body.passwordConfirmation
    }
    

    check_regex(data, function(err){
        if(err){
            request.flash('user', body);
            request.flash('errors', err);

            return response.redirect('/user/join');
        }else{

        }
    })
    
    // response.redirect('/user/join');
    // 

    // }else{
    //     var today = new Date()
    //     var user = {
    //         id: body.id,
    //         name: body.name,
    //         password: bcrypt.hashSync(body.password),
    //         created: today
    //     }
    //     // console.log(user);
    //     // console.log(user.password.length);
        
    //     addUser(user, function(err, result){
    //         if(err){
    //             // console.log(err.code)
    //             if (err.code == "ER_DUP_ENTRY"){
    //                 response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    //                 response.write('<h1>중복된 아이디</h1>');
    //                 response.write('<br><a href="/user/join"> re join </a>');
    //                 response.end();
    //             }
                
    //         }else{
    //             response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    //             response.write('<h1>회원가입 성공</h1>');
    //             response.write('<br><a href="/user/login"> go login</a>');
    //             response.end();
    //         } 
    //     });
    // }
    
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

// 사용자 수정
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

// 정규식 확인
var check_regex = function(data, callback){
    var error = {}

    // regex는 / /안에 작성합니다
    // ^는 문자열의 시작 위치
    // .는 어떠한 문자열
    // {숫자1,숫자2}는 숫자1 이상, 숫자2 이하의 길이
    // $는 문자열의 끝 위치
    var idNameMatch = /^.{4,12}$/;
    if (!idNameMatch.exec(data.id)){
        error['id'] = 'ID는 4-12자여야 합니다.';
    }
    if (!idNameMatch.exec(data.name)){
        error['name'] = '닉네임은 4-12자여야 합니다.';
    }
    
    // 8-16자리 문자열 중에 숫자랑 영문자가 반드시 하나 이상 존재
    var pwMatch = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/
    if (!pwMatch.exec(data.password)){
        console.log('pw_not_matched');

        error['pw'] = '비밀번호는 숫자와 영문자가 포함되어야 합니다';
    }
    if (!bcrypt.compareSync(data.password, data.passwordComfirm)){
        console.log('pw_not_matched');

        error['pwComfirm'] = '비밀번호가 일치하지 않습니다.';
    }

    callback(error)
}

module.exports = router;