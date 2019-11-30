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
	res.render('user/register', { });
});

router.post('/register', function(req, res) {
	Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
		if (err) {
			return res.render("user/register", {info: "Sorry. That username already exists. Try again."});
		}

		passport.authenticate('local')(req, res, function () {
			res.redirect('/');
		});
	});
});

router.get('/login', function(req, res) {
	if(req.session.warning != undefined){
		res.locals.warning = req.session.warning;
		req.session.warning = null;
	}
	console.log(req.headers.referer);
	console.log(res.locals.warning);
	req.session.referer = req.headers.referer;
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
	res.redirect('/');
});

router.get('/account', globals.checkAuthentication, function(req, res) {
	var pastBids;
	(async function() {
		var bids = await db.get('bids');
		var listings = await db.get('listings');
		pastBids = await bids.find({username: req.user.username});
		pastBids.reverse();
		var listingIDs = await pastBids.map(bid => bid.listingID);
		var listings = await listings.find({_id: {$in: listingIDs.map(id => monk.id(id))}}).then((docs) => {return docs;})
		return res.render('user/account', {user: req.user, pastBids: pastBids, listings: listings});
	})()
});

router.get('/ping', function(req, res){
	res.send("pong!", 200);
});

module.exports = router;
