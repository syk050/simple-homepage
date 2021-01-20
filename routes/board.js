var express = require('express');
var router = express.Router();
var pool = require('../models/DBConnection');
const util = require('../util');

// await 키워드를 사용하기 위해 async 키워드를 function 키워드 앞에 붙임
// await는 해당 Promise가 완료될 때까지 다음 코드로 진행하지 않고 기다림
router.get('/', async function(request, response){
    console.log('board In')

    var page = Math.max(1, parseInt(request.query.page));
    var limit = Math.max(1, parseInt(request.query.limit));
    page = !isNaN(page)?page:1;
    limit = !isNaN(limit)?limit:5;

    var skip = (page-1) * limit;
    var [row, field] = await pool.query('SELECT COUNT(*) AS count FROM board');
    var count = row[0].count;
    var maxPage = Math.ceil(count/limit);
    // console.log('maxPage: ' + maxPage);
    // console.log('limit: ' + limit);
    // console.log('skip: ' + skip);

    var [row, field] = await pool.query('SELECT num, title, name, DATE_FORMAT(writedate, "%y-%m-%d") AS wd, readcount, author FROM board order by num DESC LIMIT ? OFFSET ?', [
      limit, skip
    ]);
    var boards = row;

    response.render('pages/board', {
      board: boards,
      currentPage: page,
      maxPage: maxPage,
      limit: limit
    });
});

// 게시글 작성
router.get('/creating_post', util.isLoggedin, function(request, response){
    console.log('creating_post');
  
    response.render('pages/posting');
});
  
// 게시글 작성 완료
router.post('/creating_post', util.isLoggedin, function(request, response){
    console.log('creat_post');
    console.log('creating_post: ' + request.user.id);

    var user= {};
    pool.query('SELECT numid, name FROM users WHERE id = ?', [request.user.id], 
    function(err, result){
        if (err){
          console.log('err: ' + err);
        }else{
          // console.log('result: ' + JSON.stringify(result[0]));
          user['name'] = result[0].name;
          user['numid'] = result[0].numid;

          var body = request.body;
          pool.query('INSERT INTO board (name, title, content, author) VALUES (?, ?, ?, ?)',[
              user.name, body.title, body.content, user.numid
          ], function(err){
              if(err){
                  console.log(err)
              }
              // 새글을 작성 완료하면 무조건 1페이지로 가게하기 위해서
              response.redirect('/board' + response.locals.getPostQueryString(false, {page:1}));
          });
        }
    });
});
  
// 게시글 수정
router.get('/edit/:id', util.isLoggedin, checkPermission, function(request, response){
    console.log('edit id In : ' + request.params.id);
  
    pool.query('SELECT * FROM board WHERE num = ?', [
      request.params.id
    ], function(err, result){
      response.render('pages/edit_post', {data: result[0]});
    });
  
});
  
// 게시글 수정 완료
router.post('/edit/:id', util.isLoggedin, checkPermission, function(request, response){
    console.log('update id: ' + request.params.id)
  
    var body = request.body
    pool.query('UPDATE board SET title=?, content=? WHERE num=?', [
      body.title, body.content, request.params.id
    ], function(err, result){
      response.redirect('/board/' + request.params.id + response.locals.getPostQueryString());
    });
});
  
// 게시글 삭제
router.get('/delete/:id', util.isLoggedin, checkPermission, function(request, response){
    console.log('delete id: ' + request.params.id)

    pool.query('DELETE FROM board WHERE num=?', [request.params.id], function () {
      response.redirect('/board' + response.locals.getPostQueryString());
   });
});

router.get('/__test__', function(request, response){
  console.log('__test__ : ');  

  var i = 0;
  for(i=0; i<10; i++){
    pool.query('INSERT INTO board (name, title, content, author) VALUES (?, ?, ?, ?)',[
      'test', 'Test Post' + i, 'Test Post' + i, 1
    ]);
  }
  response.redirect('/board');

});

// 게시글 선택
router.get('/:id', async function(request, response){
    console.log('board id In : ' + request.params.id);  

    var rc = 0
    var [rows, fields] = await pool.query('SELECT readcount as rc FROM board WHERE num = ?', [
      request.params.id
    ]);
    console.log('readcount: ' + JSON.stringify(rows[0].rc));
    rc = readcount[0].rc
    if(rc < 10){
      rc = readcount[0].rc + 1
    }

    await pool.query('UPDATE board SET readcount=? WHERE num=?', [
      rc, request.params.id
    ]);

    var [rows, fields] = await pool.query('SELECT * FROM board WHERE num = ?', [
      request.params.id
    ]);
    console.log('board: ' + JSON.stringify(rows[0]));
    var board = rows[0]

    response.render('pages/post', {data: board});
});

module.exports = router;

// 기록된 author와 로그인된 user.id를 비교해
function checkPermission(request, response, next){
  // 게시판 숫자
  // console.log('boderNum: ' + JSON.stringify(request.params.id));
  // console.log('checkPermission: ' + JSON.stringify(request.user.numid));

  pool.query('SELECT author FROM board WHERE num = ?', [request.params.id
  ], function(err, rows, fields){
    console.log(rows);
    console.log(fields);
    if(err) return JSON.stringify(err);
    if(board[0].author != request.user.numid) return util.noPermission(request, response);

    next();
  });
}