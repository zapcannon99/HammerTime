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
	var notifications = db.get('notifications');
	(async function() {
		var endedListings = await listings.find({ended: false}).then((docs) =>
		{
			var ret = [];
			for(var i = 0;i<docs.length;i++)
			{
				var end = Date.parse(docs[i].endTime);
				var now = Date.now();
				if(now > end)
				{
					ret.push(docs[i]);
				}
			}
			return ret;
		});
		console.log(endedListings);
		console.log(cutoff);
		var promises = await endedListings.map(listing =>
			listings.findOneAndUpdate({_id: monk.id(listing._id)}, {$set: {ended: true}})
			.then((listing) => {
				if(listing.bids.length > 0) {
					return (async function() {
						var winningBid = await bids.findOne({_id: monk.id(listing.bids[listing.bids.length - 1])}).then((doc) => {return doc;});
						var winningUser = winningBid.user;
						listing.winner = winningUser;
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
			console.log("ended listing is "+endedListing);
			if(endedListing.winner == undefined) {
				var notification = {
					account: endedListing.owner,
					message: "Sorry! Your item ("+endedListing.title+") didn't sell!",
					dismissed: 0
				}
				promises.push(notifications.insert(notification).then(() => {return 1;}));
			} else {
				var ownerNotification = {
					account: endedListing.owner,
					message: "Congratulations! Your item ("+endedListing.title+") sold for " + endedListing.finalBid,
					dismissed: 0
				}
				var winnerNotification = {
					account: endedListing.winner,
					message:  "Congratulations! Your bid on ("+ endedListing.title+") won the HammerTime!",
					dismissed: 0
				}
				console.log(ownerNotification);
				console.log(winnerNotification);
				promises.push(notifications.insert(ownerNotification).then(() => {return 1;}));
				promises.push(notifications.insert(winnerNotification).then(() => {return 1;}));
				promises.push(listings.findOneAndUpdate({_id: monk.id(endedListing._id)}, {$set: {winner: endedListing.winner, finalBid: endedListing.finalBid}}).then(() => {return 1;}));
			}
		});

		var done = await Promise.all(promises);
		console.log("done!");
	})()
});

module.exports = app;
