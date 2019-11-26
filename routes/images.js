var express = require('express');
var multer = require("multer");
var monk = require("monk");
var mv = require('mv');
var globals = require("../globals/globals")
var router = express.Router();

const __image_db_path = -__dirname + '/../public/images/db/'

var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, __image_db_path);
  },
  filename: function (req, file, callback) {
  	var nameparts = file.originalname.split('.');
  	var filetype = nameparts[nameparts.length - 1];
  	callback(null, file.fieldname + '-' + Date.now() + '.' + filetype);
  }
});
var upload = multer({ storage : storage});

var db_path = "localhost:27017/HammerTime";
var db = monk(db_path);

// Helper Functions for Authentication

function checkAuthentication(req,res,next){
	if(req.user) {
		return next();
	} else {
		return res.status(401).json({
			error: 'User not authenticated'
		});
	}
}

// routes for listings ---------------------------------------
router.get('/:id', checkOwnership, checkAuthentication, function(req, res, next){
	// grab the listing with id id
	if(typeof(req.listing) == "undefined"){
		console.log(req.params.id);
		var collection = db.get("listings");

		collection.findOne({_id: monk.id(req.params.id)})
		.then((doc) => res.render('listing/show', {listing: doc}));
	} else {
		res.locals.listing = req.listing
		res.render('listing/show');
	}	
});

router.post('/', checkAuthentication, upload.single('image'), function(req, res, next){
	var pictures = req.files.map(f => f.filename);

	var listing = {
		title: req.body.title,
		condition: req.body.condition,
		description: req.body.description,
		bid: req.body.bidtart,
		duration_days: req.body.duration_days,
		pictures: pictures
	}

	var collection = db.get("listings");
	collection.insert(listing)
	.then((doc) => {
		console.log(doc._id + "inserted");
		req.listing = doc;
		res.redirect('/listings/' + doc._id);
	}).catch((err) => {
		console.log(err);
	}).then(() => db.close());
});

router.delete('/:id', checkAuthentication, function(req, res, next){
	var pictures = req.files.map(f => f.filename);
	
	updates = {
		title: req.body.title,
		condition: req.body.condition,
		description: req.body.description,
		bid: req.body.bidtart,
		duration_days: req.body.duration_days,
		pictures: pictures
	}

	console.log("PUT");
	console.log(updates);

});

module.exports = router;
