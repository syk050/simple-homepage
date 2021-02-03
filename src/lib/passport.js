var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

const pool = require("../database");
const helpers = require("./helpers");


passport.use('local-login',
    new LocalStrategy({
        usernameField: 'id',
        passwordField: 'password',
        passReqToCallback: true
    }, async function(req, id, password, done){
        const rows = await pool.query('SELECT * FROM users WHERE id = ?' [id]);

        if (rows.length > 0){
            const user = rows[0];
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

passport.use('local-join',
    new LocalStrategy({
        usernameField: "aa",
        passwordField: "aa",
        passReqToCallback: true
    }, async function(req, username, password, done){
        const {fullname} = req.body;

        let user = {
            fullname,
            usernamem,
            password
        };

        user.password = await helpers.encryptPassword(password);
        const result = await pool.query('INSERT INTO users SET ?', user);
        
        return done(null, user.id);
    })
);


// login시에 user를 어떻게 session에 저장할지
passport.serializeUser(function(user, done){
    // console.log('serializeUser: ' + JSON.stringify(user))

    done(null, user.id);
});

// request시에 session에서 어떻게 user object를 만들지
passport.deserializeUser(async function(id, done){
    const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
});


module.exports = passport;
