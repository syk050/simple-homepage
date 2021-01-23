var express = require('express');
var router = express.Router();
var client = require('../models/DBConnection');
const util = require('../util');

// create
router.post('/', util.isLoggedin, checkPostId, function(request, response){
    var board = response.locals.post;

    request.body.author = request.user.id;
    request.body.post = board.id;

    console.log('request.body: ' + JSON.stringify(request.body));
    client.query('INSERT INTO comment SET ?', [request.body], function(err, result){
        if(err){
            console.log(err);
            request.flash('commnetForm', {id: null, form:request.body});
            request.flash('commnetError', {id: null, errors: err});
        }

        return response.redirect('/board/'+ board.id + response.locals.getPostQueryString());
    });
});

module.exports = router;

function checkPostId(request, response, next){
    client.query('SELECT num FORM board WHERE id=?', [request.query.boardId], function(err, result){
        if(err) return response.json(err);

        response.locals.post = result;
        next();
    });
}