var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

const pool = require("../database");
const helpers = require("./helpers");
const { checkRegex } = require('../lib/util');


passport.use('local-login',
    new LocalStrategy({
        usernameField: 'id',
        passwordField: 'password',
        passReqToCallback: true
    }, async function(req, id, password, done){
        console.log('login');

        const rows = await pool.query('SELECT * FROM users WHERE id = ?', id);
        
        if (rows.length > 0){
            const user = rows[0][0];
            const validPassword = await helpers.matchPassword(password, user.password);

            if(validPassword){
                return done(null, user);
            }else{
                req.flash('username', id);
                req.flash('errors', {login: '사용자 이름 또는 암호가 잘못되었습니다.'})
                
                return done(null, false); 
            }
        }else{
            req.flash('username', id);
            req.flash('errors', {login: '사용자 이름 또는 암호가 잘못되었습니다.'})

            return done(null, false); 
        }
    })
);

passport.use('local-register',
    new LocalStrategy({
        usernameField: "id",
        passwordField: "password",
        passReqToCallback: true
    }, async function(req, id, password, done){
        console.log('register');

        const body = req.body;
        const data = {
            id: body.id,
            name: body.name,
            password: body.password,
            passwordConfirm: body.passwordConfirm
        };


        const err = await checkRegex(data);
        if(err){
            req.flash('inputData', body);
            req.flash('errors', err);

            return done(false);
        }else{
            const today = new Date();
            let user = {
                id: data.id,
                name: data.name,
                password: await helpers.encryptPassword(data.password),
                created: today
            }
            // user.password = await helpers.encryptPassword(data.password);

            try{
                const result = await pool.query('INSERT INTO users SET ?', user);

                return done(null, user);
            }catch(err){
                console.log('err: ' + err.code);

                if(err.code == 'ER_DUP_ENTRY'){
                    req.flash('errors', {id: '이미 존재하는 ID입니다.'});
                }
                return done(false);
            }
        }
    })
);


// login시에 user를 어떻게 session에 저장할지
passport.serializeUser(function(user, done){
    done(null, user.id);
});

// request시에 session에서 어떻게 user object를 만들지
passport.deserializeUser(async function(id, done){
    const rows = await pool.query('SELECT id, name FROM users WHERE id = ?', [id]);
    done(null, rows[0][0]);
});


module.exports = passport;
