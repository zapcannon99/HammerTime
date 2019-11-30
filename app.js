const cron = require("node-cron");
const fs = require("fs");
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
var monk = require('monk');
var db = monk('localhost:27017/HammerTime');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var imageRouter = require('./routes/api/images');
var apiUsersRouter = require('./routes/api/users');
var apiBidsRouter = require('./routes/api/bids')


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
app.use('/api/bids', apiBidsRouter);

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

cron.schedule("* * * * *", function() {
	console.log("---------------------");
	console.log("Running Cron Job For Ended Listings");
	var cutoff = (new Date(Date.now())).toISOString();

	var listings = db.get('listings');
	var bids = db.get('bids');
	var accounts = db.get('accounts');
	(async function() {
		var endedListings = await listings.find({ended: false, endTime: {$lte: cutoff}}).then((docs) => {return docs;})
		console.log(endedListings);
		var promises = await endedListings.map(listing => 
			listings.findOneAndUpdate({_id: monk.id(listing._id)}, {$set: {ended: true}})
			.then((listing) => {
				if(listing.bids.length > 0) {
					return (async function() {
						var winningBid = await bids.findOne({_id: monk.id(listing.bids[listing.bids.length - 1])}).then((doc) => {return doc;});
						var winningUsername = winningBid.username;
						listing.winner = winningUsername;
						listing.finalBid = winningBid.amount;
						console.log("tolo" + winningBid);
						return listing;
					})()
				} else {
					listing.winner = undefined;
					return listing;
				}
			})
		)
		var endedListings = await Promise.all(promises);
		console.log(endedListings);
		promises = [];
		endedListings.forEach(endedListing => {
			if(endedListing.winner == undefined) {
				ownerMessage = {listing: endedListing, message: "Sorry! Nobody your item didn't sell!" };
				promises.push(accounts.findOneAndUpdate({username: endedListing.owner}, {$push: {notifications: ownerMessage}}).then(() => {return 1;}));
			} else {
				ownerMessage = {listing: endedListing, message: "Congratulations! Your items sold auctioned to " + endedListing.winner + " for " + endedListing.finalBid };
				promises.push(accounts.findOneAndUpdate({username: endedListing.owner}, {$push: {notifications: ownerMessage}}).then(() => {return 1;}));
				winnerMessage = {listing: endedListing, message: "Congratulations! Your bid won the HammerTime!"};
				promises.push(accounts.findOneAndUpdate({username: endedListing.winner}, {$push: {notifications: winnerMessage}}).then(() => {return 1;}));
			}
		});

		var done = await Promise.all(promises);
		console.log("done!");
	})()
});

module.exports = app;
