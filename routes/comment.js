var express = require('express');
var router = express.Router();
var client = require('../models/DBConnection');
const util = require('../util');

// create
router.post('/', util.isLoggedin, checkPostId, function(request, response){
    var info = response.locals;
    console.log('board: ' + board);

    request.body.author = request.user.numid;
    request.body.post = info.post;
    request.body.username = info.username;

    console.log('request.body: ' + JSON.stringify(request.body));
    client.query('INSERT INTO comment SET ?', [request.body], function(err, result){
        if(err){
            console.log(err);
            request.flash('commnetForm', {id: null, form:request.body});
            request.flash('commnetError', {id: null, errors: err});
        }

        return response.redirect('/board/'+ board.num + response.locals.getPostQueryString());
    });
});

module.exports = router;

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