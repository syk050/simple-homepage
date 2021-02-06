const accountCtrl = {};

const passport = require('passport');

// Login
accountCtrl.renderLogin = function(req, res){
    console.log('accountCtrl.renderLogin');

    const id = req.flash('id')[0];
    const errors = req.flash('errors')[0] || {};

    return res.render('account/login', {
        id: id,
        errors: errors
    });
};
accountCtrl.login = passport.authenticate('local-login', {
    successRedirect: '/board',
    failureRedirect: '/login',
    failureFlash: true
});

// Register
accountCtrl.renderRegister = function(req, res){
    console.log('accountCtrl.renderRegister');

    const inputData = req.flash('inputData')[0] || {};
    const errors = req.flash('errors')[0] || {};

    return res.render('account/register', {
        inputData: inputData,
        errors: errors
    });
};
accountCtrl.register = passport.authenticate('local-register', {
    successRedirect: '/',
    failureRedirect: '/register',
    failureFlash: true
});

// Logout
accountCtrl.logout = function(req, res){
    console.log('accountCtrl.logout');

    req.logout();
    return res.redirect('/');
};

module.exports = accountCtrl;