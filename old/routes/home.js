var express = require('express');
var router = express.Router();


// home
router.get('/', function (request, response) {
    console.log('home In');

    // response.redirect('/board');
    response.render('pages/home');
});

module.exports = router;