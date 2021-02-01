const { json } = require('body-parser');
var express = require('express');
const { post } = require('request');
var router = express.Router();
var client = require('../models/DBConnection');
const util = require('../util');

// create
router.post('/', util.isLoggedin, checkPostId, function(request, response){
    console.log('comment create');

    var info = response.locals;
    console.log('info: ' + JSON.stringify(info));

    request.body.author = request.user.numid;
    request.body.post = info.post;
    request.body.username = info.username;

    console.log('request.body: ' + JSON.stringify(request.body));
    client.query('INSERT INTO comment SET ?', [request.body], function(err, result){
        if(err){
            console.log(err);
            // id항목의 값이 없으면 댓글 생성 과정에서 생긴 error
            request.flash('commnetForm', {id: null, form:request.body});
            request.flash('commnetError', {id: null, parentComment: request.body.parentComment, errors: err});
        }

        return response.redirect('/board/'+ info.post + response.locals.getPostQueryString());
    });
});

// update
router.put('/:id', util.isLoggedin, checkPermission, checkPostId, function(req, res){
    console.log('comment Update: ' + req.params.id);

    var board = res.locals.post;

    req.body.update = new Date();
    console.log('comment: ' + JSON.stringify(req.body));
    client.query('UPDATE comment set ? WHERE id=?', [
        req.body, req.params.id
    ], function(err, result){
        if(err){
            console.log(err);
            // id항목에 값이 있으면 댓글 수정과정에서 생긴 error
            req.flash('commentForm', {id: req.params.id, form: req.body});
            req.flash('commnetError', {id:req.params.id, parentComment: request.body.parentComment,errors: err});
        }

        return res.redirect('/board/' + board + res.locals.getPostQueryString());
    });
});

router.delete('/:id', util.isLoggedin, checkPermission, checkPostId, function(req, res){
    console.log('comment Delete: ' + req.params.id);

    var board = res.locals.post;

    client.query('SELECT * FROM comment WHERE id = ?', req.params.id, function(err, result){
        if(err) return res.json(err);

        result[0].isDeleted = true;
        console.log('comment: ' + JSON.stringify(result[0]));

        client.query('UPDATE comment set ? WHERE id=?', [
            result[0], req.params.id
        ], function(err, result){
            if(err) return res.json(err);

            return res.redirect('/board/' + board + res.locals.getPostQueryString());
        });
    });
});

module.exports = router;

function checkPermission(req, res, next){
    console.log('checkPermission');

    client.query('SELECT * FROM comment WHERE id=?', [
        req.params.id
    ], function(err, result){
        if(err) return res.json(err);
        if(result[0].author != req.user.numid) return util.noPermission(req, res);

        next();
    });
}


function checkPostId(request, response, next){
    console.log('checkPostId');

    var sql1 = 'SELECT num FROM board WHERE num=?;';
    var sql1m = client.format(sql1, parseInt(request.query.boardId));

    var sql2 = 'SELECT name FROM users WHERE numid=?;';
    var sql2m = client.format(sql2, parseInt(request.user.numid));

    client.query(sql1m + sql2m, function(err, result, fields){
        if(err) return response.json(err);

        response.locals.post = result[0][0].num;
        response.locals.username = result[1][0].name;
        next();
    });
}