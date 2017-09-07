// Module Import
var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
/* var fileUpload = require('express-fileupload');
var path = require('path'); */
var validator = require('express-validator');
var ejs = require('ejs');
var engine = require('ejs-mate');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var flash = require('connect-flash');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var moment = require('moment');

// import var
var User = require('./models/user');
var Product = require('./models/product');
var secret = require('./secret/secret');

// Init App
var app = express();

// DB Connect
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/myapp');

// Import require
require('./config/passport');
require('./secret/secret');

// Static Folder
app.use(express.static('public'));

// Middleware
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// app.use(fileUpload());
app.use(validator());
app.use(session({
    secret: 'sqlplus8041999',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Middleware user
app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});

// Middleware moment
app.locals.moment = moment;

// Routes
require('./routes/user')(app, passport);
require('./routes/ecommerce')(app);

// Delete Email nn Valid
function remove(){
    User.remove({active:false , usernewExpires: {$lt: Date.now()}}, function (err) {
        if (err) return handleError(err);
        console.log('user deleted')
    });
}
setInterval(remove,24*60*60*1000);

// Server Runninig
app.listen(3000, function(){
    console.log('Listening on port 3000');
});