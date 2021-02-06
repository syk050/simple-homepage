const auth = {};

const pool = require("../database");

auth.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated())  return next();
    
    req.flash('errors', {login: '로그인을 먼저 하세요.'});
    res.redirect('/login');
};

// 어떠한 route에 접근권한이 없다고 판단된 경우에 호출
auth.noPermission = function(request, response){
    console.log('noPermission: ');

    request.flash('errors', {login: '권한이 없습니다.'});
    request.logout();
    response.redirect('/user/login');
};

auth.checkCommentPermission = async function(req, res, next){
    const id = req.params.id;
    const result = await pool.query('SELECT author FROM comment WHERE id = ?', id);

    if(result[0][0].author != req.user.id) return noPermission(req, res);

    next();
}

auth.checkBoardPermission = async function(req, res, next){
    const num = req.params.id;;
    const result = await pool.query('SELECT author FROM board WHERE num = ?', num);

    if(result[0][0].author != req.user.id) return noPermission(req, res);

    next();
}

auth.checkPostId = async function(req, res, next){
    try{
        const result = await pool.query('SELECT num FROM board WHERE num = ?', req.query.boardId);
        res.locals.board = result[0][0];

        next();
    }catch(err){
        return res.send(err);
    }
}

module.exports = auth;