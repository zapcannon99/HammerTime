var express = require("express");
var passport = require('passport');
var Account = require('../models/account');
var globals = require('../globals/globals');
var monk = require('monk');
var router = express.Router();

var db_path = "localhost:27017/HammerTime";
var db = monk(db_path);

router.get('/', function (req, res) {
	res.render('index', { user : req.user });
});

router.get('/register', function(req, res) {
	res.render('user/register', {user: req.user});
});

router.post('/register', function(req, res) {
	Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
		if (err) {
			return res.render("user/register", {user: req.user, info: "Sorry. That username already exists. Try again."});
		}

		passport.authenticate('local')(req, res, function () {
			// db.get('accounts').findOneAndUpdate({username: req.body.username}, {$set: {notifications: []}}).then((updatedDoc) => {resolve();});
			res.redirect('/');
		});
	});
});

router.get('/login', function(req, res) {
	if(req.session.warning != undefined){
		res.locals.warning = req.session.warning;
		req.session.warning = null;
	}
	if(req.session.referer == null) {
		req.session.referer = req.headers.referer;
	}
	res.render('user/login', { user : req.user });
});

router.get('/login/addwarning', function(req, res) {
	req.session.warning = "Username or password incorrect.";
	res.redirect('/users/login');
});

router.post('/login', passport.authenticate('local', {failureRedirect: '/users/login/addwarning'}), function(req, res) {
	if(req.isAuthenticated()) {
		var lastVisitedPage = req.session.referer;
		req.session.referer = null;
		res.redirect(lastVisitedPage);
	}
});

router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/listings');
});

router.get('/account', globals.checkAuthentication, function(req, res) {
	var pastBids;
	var pastListings;
	var pastNotifications;
	var wins;
	(async function() {
		var bids = await db.get('bids');
		var listings = await db.get('listings');
		pastBids = await bids.find({user: req.user._id});
		pastBids.reverse();

		pastListings = await listings.find({owner: req.user._id});
		pastListings.reverse();

		var notifications = await db.get('notifications');
		pastNotifications = await notifications.find({account: monk.id(req.user._id)}).then((docs) => {return docs;});
		pastNotifications.reverse();

		wins = await listings.find({winner: monk.id(req.user._id)});
		wins.reverse();

		var listingIDs = await pastBids.map(bid => bid.listingID);
		var listings = await listings.find({_id: {$in: listingIDs.map(id => monk.id(id))}}).then((docs) => {return docs;});
		//pastListings.reverse();

		//var past = await listings.find({}).then((docs) => {return docs;}).catch(function(err){console.log(err);});
		//pastListings.reverse();

		//var notifications = await db.get('notifications');
		//pastNotifications = await notifications.find({account: monk.id(req.user._id)}).then((docs) => {return docs;});
		//pastNotifications.reverse();

		return res.render('user/account', {user: req.user, pastBids: pastBids, pastListings: pastListings, pastNotifications:pastNotifications, listings: listings, wins: wins});
	})()
});

router.get('/ping', function(req, res){
	res.send("pong!", 200);
});

module.exports = router;
