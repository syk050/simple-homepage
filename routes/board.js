var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({data: 'uploadFiels/'});

var pool = require('../models/DBPool');
var client = require('../models/DBConnection');
const util = require('../util');

// await 키워드를 사용하기 위해 async 키워드를 function 키워드 앞에 붙임
// await는 해당 Promise가 완료될 때까지 다음 코드로 진행하지 않고 기다림
router.get('/', async function(request, response){
    console.log('board In')

    var page = Math.max(1, parseInt(request.query.page));
    var limit = Math.max(1, parseInt(request.query.limit));
    page = !isNaN(page)?page:1;
    limit = !isNaN(limit)?limit:5;

    var searchQuery = createSearchQuery(request.query);

    var skip = (page-1) * limit;
    var [row, field] = await pool.query('SELECT COUNT(*) AS count FROM board ' + searchQuery);
    var count = row[0].count;
    var maxPage = Math.ceil(count/limit);

    var [row, field] = await pool.query('SELECT num, title, name, DATE_FORMAT(writedate, "%y-%m-%d") AS wd, readcount, author FROM board ' + searchQuery + ' order by num DESC LIMIT ? OFFSET ?', [
      limit, skip
    ]);
    var boards = row;

    response.render('pages/board', {
      board: boards,
      currentPage: page,
      maxPage: maxPage,
      limit: limit,
      searchType: request.query.searchType,
      searchText: request.query.searchText
    });
});

// 게시글 작성
router.get('/creating_post', util.isLoggedin, function(request, response){
    console.log('creating_post');
  
    response.render('pages/posting');
});
  
// 게시글 작성 완료
// upload.single(폼_Input_이름)는 파일 하나(single)를 form으로 부터 읽음
router.post('/creating_post', util.isLoggedin, upload.single('attachment'), async function(request, response){
    console.log('creating_post: ' + request.user.id);

    // var attachment = requset.file?await client.query
    console.log(JSON.stringify(request.file));

    var user= {};
    client.query('SELECT numid, name FROM users WHERE id = ?', [request.user.id], 
    function(err, result){
        if (err){
          console.log('err: ' + err);
        }else{
          // console.log('result: ' + JSON.stringify(result[0]));
          user['name'] = result[0].name;
          user['numid'] = result[0].numid;

          var body = request.body;
          client.query('INSERT INTO board (name, title, content, author) VALUES (?, ?, ?, ?)',[
              user.name, body.title, body.content, user.numid
          ], function(err){
              if(err){
                  console.log(err)
              }
              // 새글을 작성 완료하면 무조건 1페이지로 가게하기 위해서
              response.redirect('/board' + response.locals.getPostQueryString(false, {page:1, searchText: ''}));
          });
        }
    });
});

// 게시글 수정
router.get('/edit/:id', util.isLoggedin, checkPermission, function(request, response){
    console.log('edit id In : ' + request.params.id);
  
    client.query('SELECT * FROM board WHERE num = ?', [
      request.params.id
    ], function(err, result){
      response.render('pages/edit_post', {data: result[0]});
    });
  
});
  
// 게시글 수정 완료
router.put('/edit/:id', util.isLoggedin, checkPermission, function(request, response){
    console.log('update id: ' + request.params.id)
  
    var body = request.body
    client.query('UPDATE board SET title=?, content=? WHERE num=?', [
      body.title, body.content, request.params.id
    ], function(err, result){
      response.redirect('/board/' + request.params.id + response.locals.getPostQueryString());
    });
});
  
// 게시글 삭제
router.get('/delete/:id', util.isLoggedin, checkPermission, function(request, response){
    console.log('delete id: ' + request.params.id)

    client.query('DELETE FROM board WHERE num=?', [request.params.id], function () {
      response.redirect('/board' + response.locals.getPostQueryString());
   });
});

router.get('/__test__', function(request, response){
  console.log('__test__ : ');  

  var i = 0;
  for(i=0; i<10; i++){
    client.query('INSERT INTO board (name, title, content, author) VALUES (?, ?, ?, ?)',[
      'test', 'Test Post' + i, 'Test Post' + i, 1
    ]);
  }
  response.redirect('/board');

});

// 게시글 선택
router.get('/:id', function(request, response){
    console.log('board id In : ' + request.params.id);  

    // 조회수
    var rc = 0
    client.query('SELECT readcount as rc FROM board WHERE num = ?', [
      request.params.id
    ], function(err, result){
      if(err) console.log(err);
      else{
        rc = result[0].rc
        if(rc < 10) rc = rc + 1

        client.query('UPDATE board SET readcount=? WHERE num=?', [
          rc, request.params.id
        ]);
      }
    });

    var commentForm = request.flash('commentForm')[0] || {id: null, form: {}};
    var commentError = request.flash('commentError')[0] || {id: null, parentComment: null, errors: {}};

    var boardSql = 'SELECT num, name, title, content, author FROM board WHERE num = ?;';
    var boardSqlm = client.format(boardSql, request.params.id);

    var commentSql = 'SELECT * FROM comment WHERE post = ? order by created DESC;';
    var commentSqlm = client.format(commentSql, request.params.id);

    try{
      client.query(boardSqlm + commentSqlm, function(err, result, fields){
        console.log('result1: ' + JSON.stringify(result[0][0]));
        console.log('result2: ' + JSON.stringify(result[1]));
        if(err) {
          console.log(err);
          response.redirect('/board');
        }
        var commentTrees = util.convertToTrees(result[1], 'id', 'parentComment', 'childComments');
        console.log('commentTrees: ' + JSON.stringify(commentTrees));
        
        response.render('pages/post', {
          data: {
            post: result[0][0],
            attachment: {}
          }, 
          commentTrees: commentTrees,
          commentForm: commentForm, 
          commentError: commentError});
      });
    }catch(error){
      console.log(error);
      response.json(error);
    }
});

module.exports = router;

// 기록된 author와 로그인된 user.id를 비교해
function checkPermission(request, response, next){
  // 게시판 숫자
  // console.log('boderNum: ' + JSON.stringify(request.params.id));
  // console.log('checkPermission: ' + JSON.stringify(request.user.numid));
  console.log('checkPermission');

  client.query('SELECT author FROM board WHERE num = ?', [request.params.id
  ], function(err, board){
    if(err) return JSON.stringify(err);
    if(board[0].author != request.user.numid) return util.noPermission(request, response);

    next();
  });
}

// 조건문 쿼리 제작
function createSearchQuery(queries){
  var searchQuery = '';
  if(queries.searchType && queries.searchText && queries.searchText.length >= 3){
    var searchTypes = queries.searchType.toLowerCase().split(',');
    var postQueries = [];

    if(searchTypes.indexOf('title') >= 0){
      postQueries.push('title LIKE "%' + queries.searchText + '%"');
    }
    if(searchTypes.indexOf('body') >= 0){
      postQueries.push('content LIKE "%' + queries.searchText + '%"');
    }
    // console.log('postQueries: ' + postQueries);

    if(postQueries.length > 0){
      // 연산자 우선수위 때문에 각각 괄호로 묶음
      searchQuery = ('WHERE ' + postQueries.pop()) + (postQueries?' or ' + postQueries.pop():'');
    }
    // console.log('searchQuery: '+ searchQuery);

    return searchQuery;
  }
}