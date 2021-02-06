const userCtrl = {};

const { checkRegex } = require('../lib/util');
const pool = require('../database');
const helpers = require("../lib/helpers");

// list
userCtrl.renderIndex = async function(req, res){
    console.log('userCtrl.renderIndex');

    res.redirect('/user/' + req.user.id);
};

// Edit
userCtrl.renderEditUser = async function(req, res){
    console.log('userCtrl.renderEditUser');

    const inputData = req.flash('inputData')[0] || {};
    const errors = req.flash('erroes')[0] || {};

    const id = req.params.id;
    const result = await pool.query('SELECT id, name FROM users WHERE id = ?', id);

    res.render('user/edit', {
        user: result[0][0],
        inputData: inputData,
        errors: errors
    });
};
userCtrl.editUser = async function(req, res){
    console.log('userCtrl.editUser');

    const id = req.params.id;
    const body = req.body;

    const info = {
        name: body.name,
        password: body.newPassword,
        passwordConfirm: body.passwordConfirm
    }

    const err = await checkRegex(info);
    if(err){
        req.flash('inputData', body);
        req.flash('errors', err);

        return res.redirect('/user/edit/' + id);
    }

    const result = await pool.query('SELECT * FROM users WHERE id = ?', id);

    const validPassword = await helpers.matchPassword(body.currentPassword, result[0][0].password);
    if(validPassword){
        const user = {
            name: body.name,
            password: await helpers.encryptPassword(body.newPassword)
        };

        await pool.query('UPDATE users SET ? WHERE id = ?', [user, id]);

        return res.redirect('/user/' + id);
    }else{
        const err = {currnetPw: '비밀번호가 틀립니다.'};

        req.flash('inputData', body);
        req.flash('errors', err);

        return res.redirect('/user/' + id);
    }
};

// Delete
userCtrl.deleteUser = async function(req, res){
    console.log('userCtrl.deleteUser');

    const id = req.params.id;

    await pool.query('DELETE FROM users WHERE id = ?', id);

    req.logout();
    return res.redirect('/');
};

// Show
userCtrl.renderUser = async function(req, res){
    console.log('userCtrl.renderUser');

    const id = req.params.id;
    const user = await pool.query('SELECT * FROM users WHERE id = ?', id);

    res.render('user/show', {user: user[0][0]});
};


module.exports = userCtrl;
