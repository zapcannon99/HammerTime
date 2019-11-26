var createError = require('http-errors');
var express = require('express');
var path = require('path');
var methodOverride = require('method-override')
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

// db connection
// var monk = require('monk');
// var db = monk('localhost:27017/HammerTime');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var imageRouter = require('./routes/api/images');
var apiUsersRouter = require('./routes/api/users');

var app = express();

// view engine setup
app.set('views', [
	path.join(__dirname, 'views'),
	path.join(__dirname, 'views/listing'),
	path.join(__dirname, 'views/partials'),
	path.join(__dirname, 'views/user')
	]);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'this-is-a-secret-token' }));
app.use(passport.initialize());
app.use(passport.session());

var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

app.use(express.static(path.join(__dirname, 'public')));

// allow db access to all routes
// app.use(function(req, res, next){
// 	req.db = db;
// 	next();
// });

app.use(methodOverride("_method"));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/images', imageRouter);
app.use('/api/users', apiUsersRouter);

// mongoose db connection
mongoose.connect('mongodb://localhost:27017/HammerTime');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
