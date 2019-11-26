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
	accounts.findOne({username: req.username})
	.then((doc) => {
		doc != null ? res.json({available: 1}) : res.json({available: 0});
	}).then(() => db.close());
});

module.exports = router;