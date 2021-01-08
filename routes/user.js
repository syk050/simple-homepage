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
    var inputData = request.flash('inputData')[0] || {};
    var errors = request.flash('errors')[0] || {};


    response.render('account/join', {inputData: inputData, errors: errors});
});

// 회원가입 요청
router.post('/join', function(request, response){
    console.log('join post');

    var body = request.body; 

    var data = {
        id: body.id,
        name: body.name,
        password: body.password,
        passwordComfirm: body.passwordConfirmation
    }
    

    check_regex(data, function(err){
        if(err){
            console.log('check_regex erro')
            console.log(err);
            request.flash('inputData', body);
            request.flash('errors', err);

            return response.redirect('/user/join');
        }else{
            var today = new Date()
            var user = {
                id: data.id,
                name: data.name,
                password: bcrypt.hashSync(data.password),
                created: today
            }

            addUser(user, function(err, result){
                if(err){
                    console.log(err);
                    request.flash('inputData', body);
                    request.flash('errors', err);

                    return response.redirect('/user/join');
                }else{
                    return response.redirect('/user/login');
                } 
            });
        }
    })
    
});

// 사용자 수정 페이지
router.get('/edit/:id', function(request, response){
    console.log('edit user id: ' + request.params.id);

    var inputData = request.flash('inputData')[0] || {};
    var errors = request.flash('errors')[0] || {};

    client.query('SELECT id, name FROM users WHERE id = ?', [
        request.params.id
    ], function(err, result){
        if(err){
            console.log(err)
            response.redirect('/user/' + request.params.id);
        }else{
            response.render('account/edit_user', {data: result[0], inputData: inputData, errors: errors});
        }
    });

});

// 사용자 수정 요청
router.put('/edit/:id', function(request, response){
    console.log('edit put user id: ' + request.params.id);

    
    var body = request.body;
    var data = {
        name: body.name,
        password: body.newPassword,
        passwordComfirm: body.passwordConfirmation
    }

    check_regex(data, function(err){
        if (err){
            console.log(err);
            request.flash('inputData', body);
            request.flash('errors', err);

            return response.redirect('/user/edit/' + request.params.id);
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
                        var err = {currentPw: '비밀번호가 다릅니다.'}

                        request.flash('inputData', body);
                        request.flash('errors', err);

                        return response.redirect('/user/edit/' + request.params.id);
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
    })
    // 새로운 비밀번호와 비밀번호 확인이 다른 경우
    // if (body.newPassword != body.passwordConfirmation){

    //     response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    //     response.write('<h1>패스워드 불일치</h1>');
    //     response.write('<br><a href="/user/edit/' + request.params.id + '"> re edit </a>');
    //     response.end();
    // }else{
    //     client.query('SELECT * FROM users WHERE id = ?', [
    //         request.params.id
    //     ], function(err, result){
    //         if(err){
    //             console.log(err)
    //         }else{
    //             var originalPw = result[0].password;

    //             // 원래 패스워드와 입력한 패스워드가 다른 경우
    //             if(!bcrypt.compareSync(body.currentPassword, originalPw)){
    //                 response.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });
    //                 response.write('<h1>틀린 패스워드</h1>');
    //                 response.write('<br><a href="/user/edit/' + request.params.id + '"> re edit </a>');
    //                 response.end();
    //             }else{
    //                 var data = {
    //                     name: body.name,
    //                     password: bcrypt.hashSync(body.newPassword)
    //                 }

    //                 updateUser(request.params.id, data, function(err, result){
    //                     if(err){
    //                         console.log(err)
    //                     }
    //                 });
    //             }
    
    //         }
    
    //         response.redirect('/user/' + request.params.id);
    //     });
    // }

    
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
var addUser = function(user, callback){
    console.log('addUser 호출');

    var error = {}

    //users 테이블에 데이터 추가
    var exec = client.query('INSERT INTO users SET ?', user,
        function (err, result)
        {
            console.log('실행된 SQL : ' + exec.sql);

            if (err) {
                error['id'] = '동일한 ID가 있습니다.'
                callback(error, null);
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
    console.log('check_regex 호출');

    var error = {}

    // regex는 / /안에 작성합니다
    // ^는 문자열의 시작 위치
    // .는 어떠한 문자열
    // {숫자1,숫자2}는 숫자1 이상, 숫자2 이하의 길이
    // $는 문자열의 끝 위치
    var idNameMatch = /^.{4,12}$/;
    if (data.id && !idNameMatch.exec(data.id)){
        error['id'] = 'ID는 4-12자여야 합니다.';
    }
    if (data.name && !idNameMatch.exec(data.name)){
        error['name'] = '닉네임은 4-12자여야 합니다.';
    }
    
    // 8-16자리 문자열 중에 숫자랑 영문자가 반드시 하나 이상 존재
    var pwMatch = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,12}$/
    if (data.password && !pwMatch.exec(data.password)){
        error['pw'] = '비밀번호는 숫자와 영문자가 포함되고 4-12자여야 합니다';
    }
    if (data.password != data.passwordComfirm){
        console.log('pw_not_matched');

        error['pwComfirm'] = '비밀번호가 일치하지 않습니다.';
    }

    
    // console.log(Object.keys(error).length);
    if(Object.keys(error).length == 0){
        callback(null);
    }else{
        callback(error);
    }
}

module.exports = router;