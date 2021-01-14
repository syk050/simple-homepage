var express = require('express');
var router = express.Router();
var client = require('../models/DBConnection');


router.get('/', function(request, response){
    console.log('board In')
  
    client.query('SELECT num, title, name, DATE_FORMAT(writedate, "%y-%m-%d") AS wd, readcount FROM board ORDER BY num DESC', function(err, result){
      if (err){
        console.log(err);
      }
      else{
        response.render('pages/board', {data: result});
      }
    });
    
});

// 게시글 작성
router.get('/creating_post', function(request, response){
    console.log('creating_post');
  
    response.render('pages/posting');
});
  
// 게시글 작성 완료
router.post('/creating_post', function(request, response){
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
router.get('/edit/:id', function(request, response){
    console.log('edit id In : ' + request.params.id);
  
    client.query('SELECT * FROM board WHERE num = ?', [
      request.params.id
    ], function(err, result){
      response.render('pages/edit_post', {data: result[0]});
    });
  
});
  
// 게시글 수정 완료
router.post('/edit/:id', function(request, response){
    console.log('update id: ' + request.params.id)
  
    var body = request.body
    client.query('UPDATE board SET title=?, content=? WHERE num=?', [
      body.title, body.content, request.params.id
    ], function(err, result){
      response.redirect('/board/' + request.params.id);
    });
});
  
// 게시글 삭제
router.get('/delete/:id', function(request, response){
    console.log('delete id: ' + request.params.id)

    client.query('DELETE FROM board WHERE num=?', [request.params.id], function () {
      response.redirect('/board');
   });
});

// 게시글 선택
router.get('/:id', function(request, response){
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
        if (data[0].readcount < 10){
          rc = data[0].readcount + 1;
  
          client.query('UPDATE board SET readcount=? WHERE num=?', [
            rc, request.params.id
          ]);
        }
      }
    });
  
    // 게시글 표시
    client.query('SELECT * FROM board WHERE num = ?', [
      request.params.id
    ], function(error, result){
      if (result[0] == undefined){
        response.writeHead(404);
        response.end('Not found');
      }else{
        response.render('pages/post', {data: result[0]});
      }
    });
  
});

module.exports = router;