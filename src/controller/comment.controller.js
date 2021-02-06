const commentCtrl = {};

const pool = require('../database');

// Write
commentCtrl.writingComment = async function(req, res){
    console.log('commentCtrl.writingComment');

    const info = res.locals;
    const user = req.user;

    req.body.author = user.id;
    req.body.boardNum = info.board.num;
    req.body.userName = user.name;

    try{
        await pool.query('INSERT INTO comment SET ?', req.body);
    }catch(err){
        // id항목의 값이 없으면 댓글 생성 과정에서 생긴 error
        req.flash('commentForm', {id: null, form: req.body});
        req.flash('commentError', {id: null, parentComment: req.body.parentComment, errros: err});
    }finally{
        return res.redirect('/board/' + info.board.num + res.locals.getPostQueryString());
    }
};

// Edit
commentCtrl.editComment = async function(req, res){
    console.log('commentCtrl.editComment');

    const board = res.locals.board;

    req.body.update = new Date();

    try{
        await pool.query('UPDATE comment set ? WHERE id = ?', [req.body, req.params.id]);
    }catch(err){
        // id항목에 값이 있으면 댓글 수정과정에서 생긴 error
        req.flash('commentForm', {id: req.params.id, form: req.body});
        req.flash('commentError', {id: req.params.id, parentComment: req.body.parentComment, errros: err});
    }finally{
        return res.redirect('/board/' + board.num + res.locals.getPostQueryString());
    }
};

// Delete
commentCtrl.deleteComment = async function(req, res){
    console.log('commentCtrl.deleteComment');

    const board = res.locals.board;
    const id = req.params.id;
    try{
        const result = await pool.query('SELECT * FROM comment WHERE id = ?', id);

        let comment = result[0][0];
        comment.isDeleted = true;

        await pool.query('UPDATE comment set ? WHERE id = ?', [comment, id]);
    }finally{
        return res.redirect('/board/' + board.num + res.locals.getPostQueryString());
    }
};


module.exports = commentCtrl;
