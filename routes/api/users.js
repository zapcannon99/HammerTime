var express = require('express');
var router = express.Router();
var express = require("express");
var passport = require('passport');
var Account = require('../../models/account');
var monk = require('monk');
var router = express.Router();

var db_path = "localhost:27017/HammerTime";
var db = monk(db_path);

router.post('/checkUsernameAvailability', function (req, res) {
	var accounts = db.get('accounts');
	accounts.findOne({username: req.body.username})
	.then((doc) => {
		doc == null ? res.json({available: 1}) : res.json({available: 0});
	}).then(() => db.close());
});

router.get('/notifications/:id', function (req, res) {
	var userId=req.params.id;
	var notifications = db.get("notifications");
	notifications.find({account: monk.id(userId)})
	.then((doc) => {
		res.json(doc);
	}).catch((err) => {console.log(err)});
});

router.post('/notifications/:id', function (req, res) {

	var notification = {
		account: req.body.account,
		message: req.body.message,
		dismissed: req.body.dismissed
	};

	var collection = db.get("notifications");
	collection.findOneAndUpdate({_id: monk.id(req.params.id)}, {$set: {dismissed: 1}})
	.then((doc) => {
		req.listing = doc;
		return res.json("success");
	}).catch((err) => {
		console.log(err);
	});

});

router.post('/notifications', function (req, res) {

	var notification = {
		account: monk.id(req.body.account),
		message: req.body.message,
		dismissed: parseInt(req.body.dismissed+"")
	};

	var collection = db.get("notifications");
	collection.insert(notification)
	.then((doc) => {
		console.log(doc);
		console.log("success");
		return res.json({success:true});
	}).catch((err) => {
		console.log(err);
	});

});

module.exports = router;
