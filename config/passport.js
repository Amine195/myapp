var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var secret = require('../secret/secret');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

passport.use('local.login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => {

    User.findOne({'email':email}, (err, user) => {
        if(err){
            return done(err);
        }
        
        var messages = [];
        
        if(!user){
            messages.push('Email Does Not Exist');
            return done(null, false, req.flash('error', messages));
        }

        if(!user.active){
            messages.push('Email Does Not Valide');
            return done(null, false, req.flash('error', messages));
        }

        if(!user.validPassword(password)){
            messages.push('Password is not Invalid');
            return done(null, false, req.flash('error', messages));
        }
        
        return done(null, user); 
    });
}));

passport.use(new FacebookStrategy(secret.facebook, (req, token, refreshToken, profile, done) => {
    User.findOne({facebook:profile.id}, (err, user) => {
        if(err){
            return done(err);
        }

        if(user){
            done(null, user);
        }else{
            var newUser = new User();
            newUser.facebook = profile.id;
            newUser.username = profile.displayName;
            newUser.password = newUser.encryptPassword();
            newUser.email = profile._json.email;
            user.active = true;
            newUser.tokens.push({token:token});

            newUser.save(function(err) {
                if(err){
                    console.log(err);
                }
                done(null, newUser);
            });
        }
    })
}));

