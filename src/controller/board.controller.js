const boardCtrl = {};

const { convertToTrees } = require('../lib/util');
const pool = require('../database');

// list
boardCtrl.renderIndex = async function(req, res){
    console.log('boardCtrl.renderIndex');

    let page = Math.max(1, parseInt(req.query.page));
    let limit = Math.max(1, parseInt(req.query.limit));
    page = !isNaN(page)?page:1;
    limit = !isNaN(limit)?limit:5;
    
    let searchQuery = createSearchQuery(req.query);
    searchQuery = searchQuery?searchQuery:'';

    let skip = (page-1) * limit;

    const countSql = 'SELECT COUNT(*) AS count FROM board ' + searchQuery;
    // const countSqlm = pool.format(countSql, searchQuery);
    
    let result = await pool.query(countSql);
    let count = result[0][0].count;
    let maxPage = Math.ceil(count/limit);

    const searchSql = 'SELECT * FROM board ' + searchQuery + ' order by num DESC LIMIT ? OFFSET ?;';
    result = await pool.query(searchSql, [limit, skip]);
    let board = result[0];

    res.render('board/index', {
        board: board,
        currentPage: page,
        maxPage: maxPage,
        limit: limit,
        searchType: req.query.searchType,
        searchText: req.query.searchText
    });
};

// Write
boardCtrl.renderWritingBoard = function(req, res){
    console.log('boardCtrl.renderWritingBoard');
    console.log(req.user);

    res.render('board/write');
};
boardCtrl.writingBoard = async function(req, res){
    console.log('boardCtrl.writingBoard');
    

    const body = req.body;

    const info = {
        title: body.title,
        content: body.content,
        username: req.user.name,
        author: req.user.id
    };

    await pool.query('INSERT INTO board SET ?', info);

    res.redirect('/board' + res.locals.getPostQueryString(false, {page:1, searchText: ''}));
};

// Edit
boardCtrl.renderEditBoard = async function(req, res){
    console.log('boardCtrl.renderEditBoard');

    const num = req.params.id;

    const result = await pool.query('SELECT * FROM board WHERE num = ?', num);

    res.render('board/edit', {board: result[0][0]});
};
boardCtrl.editBoard = async function(req, res){
    console.log('boardCtrl.editBoard');

    const num = req.params.id;
    const body = req.body;

    const info = {
        title: body.title,
        content: body.content
    }

    await pool.query('UPDATE board SET ? WHERE num = ?', [info, num]);

    res.redirect('/board/' + num + res.locals.getPostQueryString());
};

// Delete
boardCtrl.deleteBoard = async function(req, res){
    console.log('boardCtrl.deleteBoard');

    const num = req.params.id;
    await pool.query('DELETE FROM comment WHERE boardnum = ?', num);
    await pool.query('DELETE FROM board WHERE num = ?', num);

    res.redirect('/board' + res.locals.getPostQueryString());
};

// Show
boardCtrl.renderBoard = async function(req, res){
    console.log('boardCtrl.renderBoard');

    const num = req.params.id;

    const commentForm = req.flash('coomentForm')[0] || {id: null, form: {}};
    const commentError = req.flash('commentError')[0] || {id: null, parentComment: null, errors: {}};

    let board = await pool.query('SELECT * FROM board WHERE num = ?', num);
    

    const comment = await pool.query('SELECT * FROM comment WHERE boardnum = ?', num);

    const commentTrees = convertToTrees(comment[0], 'id', 'parentComment', 'childComments');

    res.render('board/show', {
        board: board[0][0],
        commentTrees: commentTrees,
        commentForm: commentForm,
        commentError: commentError
    });

    board[0][0].readcount = board[0][0].readcount + 1;
    await pool.query('UPDATE board SET ? WHERE num = ?', [board[0][0], num]);
};


module.exports = boardCtrl;

function createSearchQuery(queries) {
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
        searchQuery = ('WHERE ' + postQueries.pop()) + (postQueries.length > 0?' or ' + postQueries.pop():'');
        }
        console.log('searchQuery: '+ searchQuery);

        return searchQuery;
    }
}