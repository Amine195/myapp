// Module Require
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var async = require('async');
var crypto = require('crypto');

// Import Require
var User = require('../models/user');
var secret = require('../secret/secret');

module.exports = (app, passport) => {



// Home Page
app.get('/', function (req, res, next) {
    if(req.session.cookie.originalMaxAge !== null) {
        res.redirect('/profile');
    } else {
        res.render('home', {title: 'Home'});
    }
});



// Register Page
app.get('/register', notLoggedIn, function (req, res, next) {
    var errors = req.flash('error');
    res.render('users/register', {title: 'Register', messages: errors, hasErrors: errors.length > 0});
});



// Register POST
app.post('/register', registervalidate, function (req, res, next) {

    async.waterfall([

        // Generate Token
        function(callback){
            crypto.randomBytes(20, (err, buf) => {
                var rand = buf.toString('hex');
                callback(err, rand);
            });
        },

        // User find and save
        function(rand, callback) {
            User.findOne({'email':req.body.email}, (err, user) => {

                if(user){
                    req.flash('error', 'User With Email Already Exist.');
                    return res.redirect('/register');
                }

                var newUser = new User();
                newUser.username = req.body.username;
                newUser.email = req.body.email;
                newUser.password = newUser.encryptPassword(req.body.password);
                newUser.secretToken = rand;
                newUser.secretTokenExpires = Date.now() + 60*60*1000;
                newUser.active = false;

                newUser.save((err) => {
                    callback(err, rand, newUser);
                });
            });
        },

        // Send Token in Email
        function(rand, newUser, callback){
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: secret.auth.user,
                    pass: secret.auth.pass
                }
            });
            
            var mailOptions = {
                to: newUser.email,
                from: 'FENNEC '+'<'+secret.auth.user+'>',
                subject: 'FENNEC CONFIRMATION EMAIL',
                text: 'Secret Token: \n\n'+
                    '---->   '+rand+'  <----- \n\n'+
                    'Please click on the link to complete the process: \n\n'+
                    'http://localhost:3000/verify'
            };
            
            smtpTransport.sendMail(mailOptions, (err, response) => {
               req.flash('info', 'A New token has been sent to '+newUser.email);
                return callback(err, newUser);
            });
        }
    ], (err) => {
        if(err){
            return next(err);
        }
        
        // Redirect Verify
        res.redirect('/verify');
    });
});



// Verify Page
app.get('/verify', notLoggedIn, function (req, res, next) {
    var info = req.flash('info');
    var errors = req.flash('error');
    res.render('users/verify', {title: 'Verify', messages: errors, hasErrors: errors.length > 0, info: info, noErrors: info.length > 0});
});



// Verify POST
app.post('/verify', verifyValidation, function(req, res, next) {
    User.findOne({secretToken:req.body.secretToken, secretTokenExpires: {$gt: Date.now()}}, (err, user) => {
        if(!user){
            req.flash('error', 'Password reset token has expired or is invalid. Enter your email to get a new token.');
            return res.redirect('/verify');
        }
        
        user.active = true;
        user.secretToken = undefined;
        user.secretTokenExpires = undefined;

        user.save(function(err, user){
            if (err){
                console.log(err);
            } else {
                req.flash('success', 'Your password has been successfully updated.');
                res.redirect('/login');
            }
        });
    });
});



// Forgot Page
app.get('/forgot', notLoggedIn, function (req, res, next) {
    var errors = req.flash('error');
    var info = req.flash('info');
    res.render('users/forgot', {title: 'Password Reset', messages: errors, hasErrors: errors.length > 0, info: info, noErrors: info.length > 0});
});



// Forgot POST
app.post('/forgot', forgotValidation, function (req, res, next) {
    async.waterfall([

        // Generate Token
        function(callback){
            crypto.randomBytes(20, (err, buf) => {
                var rand = buf.toString('hex');
                callback(err, rand);
            });
        },
        
        // User find
        function(rand, callback){
            User.findOne({'email':req.body.email}, (err, user) => {
                if(!user){
                    req.flash('error', 'No Account With That Email Exist Or Email is Invalid');
                    return res.redirect('/forgot');
                }
                
                user.passwordResetToken = rand;
                user.passwordResetExpires = Date.now() + 60*60*1000;
                
                user.save((err) => {
                    callback(err, rand, user);
                });
            })
        },
        
        // Send Email
        function(rand, user, callback){
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: secret.auth.user,
                    pass: secret.auth.pass
                }
            });
            
            var mailOptions = {
                to: user.email,
                from: 'RateMe '+'<'+secret.auth.user+'>',
                subject: 'RateMe Application Password Reset Token',
                text: 'You have requested for password reset token. \n\n'+
                    'Please click on the link to complete the process: \n\n'+
                    'http://localhost:3000/reset/'+rand+'\n\n'
            };
            
            smtpTransport.sendMail(mailOptions, (err, response) => {
               req.flash('info', 'A password reset token has been sent to '+user.email);
                return callback(err, user);
            });
        }
    ], (err) => {
        if(err){
            return next(err);
        }
        
        res.redirect('/forgot');
    })
});



// Init Password Page
app.get('/reset/:token', function (req, res, next) {
    User.findOne({passwordResetToken:req.params.token, passwordResetExpires: {$gt: Date.now()}}, (err, user) => {
        if(!user){
            req.flash('error', 'Password reset token has expired or is invalid. Enter your email to get a new token.');
            return res.redirect('/forgot');
        }
        var errors = req.flash('error');        
        res.render('users/reset', {title: 'New Password', messages: errors, hasErrors: errors.length > 0});
    });
});



// Init Password POST
app.post('/reset/:token', resetValidation, function (req, res, next) {
    User.findOne({passwordResetToken:req.params.token, passwordResetExpires: {$gt: Date.now()}}, (err, user) => {
        if(!user){
            req.flash('error', 'Password reset token has expired or is invalid. Enter your email to get a new token.');
            return res.redirect('/forgot');
        }
        
        user.password = user.encryptPassword(req.body.password);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
                
        user.save(function(err, user){
            if (err){
                console.log(err);
            } else {
                req.flash('success', 'Your password has been successfully updated.');
                res.redirect('/login');
            }
        });
    });
});



// Login Page
app.get('/login', notLoggedIn, function (req, res, next) {
    var errors = req.flash('error');
    var success = req.flash('success');
    res.render('users/login', {title: 'login', messages: errors, hasErrors: errors.length > 0, success: success, noErrors: success.length > 0});
});



// Login POST
app.post('/login', loginValidation, passport.authenticate('local.login', {
    // successRedirect: '/',
    failureRedirect: '/login',
    failureFlash : true
}), function (req, res, next) {
    if(req.body.rememberme) {
        req.session.cookie.maxAge = 30*24*60*60*1000; // 30 days
    } else {
        req.session.cookie.expires = null;
    }
    res.redirect('/profile');
});



// Profile Page
app.get('/profile', isLoggedIn, function (req, res, next) {
    res.render('users/profile', {title: 'Profile'});
});



// Logout
app.get('/logout', function (req, res, next) {
    req.logout();
    req.session.destroy((err) => {
        res.redirect('/');
    });
});

}



// Register Validate
function registervalidate(req, res, next){
    req.checkBody('username', 'username is Required').notEmpty();
    req.checkBody('username', 'username Must Not Be Less Than 6').isLength({min:6});
    req.checkBody('email', 'Email is Required').notEmpty();
    req.checkBody('email', 'Email is Invalid').isEmail();
    req.checkBody('password', 'Password is Required').notEmpty();
    req.checkBody('password', 'Password Must Not Be Less Than 9').isLength({min:9});
    req.checkBody("confirmationPassword", "confirmationPassword is not match.").equals(req.body.password);
 
    var errors = req.validationErrors();
 
    if(errors){
        var messages = [];
        errors.forEach((error) => {
            messages.push(error.msg);
        });
 
        req.flash('error', messages);
        res.redirect('/register');
    }else{
        return next();
    }
}



// Login Validate 
function loginValidation(req, res, next){
    req.checkBody('email', 'Email is Required').notEmpty();

    var loginErrors = req.validationErrors();

    if(loginErrors){
        var messages = [];
        loginErrors.forEach((error) => {
            messages.push(error.msg);
        });

        req.flash('error', messages);
        res.redirect('/login');
    }else{
        return next();
    }
}

// Forgot Validate 
function forgotValidation(req, res, next){
    req.checkBody('email', 'Email is Required').notEmpty();

    var forgotValidationErrors = req.validationErrors();

    if(forgotValidationErrors){
        var messages = [];
        forgotValidationErrors.forEach((error) => {
            messages.push(error.msg);
        });

        req.flash('error', messages);
        res.redirect('/forgot');
    }else{
        return next();
    }
}

// Verify Validation
function verifyValidation(req, res, next){
    req.checkBody('secretToken', 'Password Must Not Be Less Than 40 Characters').isLength({min:40, max:40});

    var verifyErrors = req.validationErrors();

    if(verifyErrors){
        var messages = [];
        verifyErrors.forEach((error) => {
            messages.push(error.msg);
        });

        req.flash('error', messages);
        res.redirect('/verify');
    }else{
        return next();
    }
}



// Reset Validation
function resetValidation(req, res, next){
    req.checkBody('password', 'Password is Required').notEmpty();
    req.checkBody('password', 'Password Must Not Be Less Than 9').isLength({min:9});
    req.checkBody("confirmationPassword", "confirmationPassword is not match.").equals(req.body.password);

    var resetErrors = req.validationErrors();

    if(resetErrors){
        var messages = [];
        resetErrors.forEach((error) => {
            messages.push(error.msg);
        });

        req.flash('error', messages);
        res.redirect('/reset/'+req.params.token);
    }else{
        return next();
    }
}



// Is LoggedIn
function  isLoggedIn(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}


// Not LoggedIn
function  notLoggedIn(req, res, next) {
    if(!req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}