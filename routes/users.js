var express = require("express");
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

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

router.get('/ping', function(req, res){
	res.send("pong!", 200);
});

module.exports = router;
