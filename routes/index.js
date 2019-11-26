var express = require('express');
var multer = require("multer");
var monk = require("monk");
var mv = require('mv');
var globals = require("../globals/globals");
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

// routes for listings ---------------------------------------
router.get('/', function(req, res, next) {
	res.redirect('/listings');
});

router.get('/listings', function(req, res, next){
  db.get('listings').find({}).then(
    function(result){
    res.render('index', {title: 'HammerTime?', listings: result});//this is how things get passed
    });
	});

router.get('/listings/new', globals.checkAuthentication, function(req, res, next){
	res.render('listing/form');
});

router.get('/listings/:id', function(req, res, next){
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

router.post('/listings', globals.checkAuthentication, upload.array('pictures', 12), function(req, res, next){
	var pictures = req.files.map(f => f.filename);

	var listing = {
		title: req.body.title,
		condition: req.body.condition,
		description: req.body.description,
		bid: req.body.bidtart,
		duration_days: req.body.duration_days,
		pictures: pictures,
		user: req.user.username,
		available: 1
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

router.get('/listings/:id/edit', globals.checkOwnership, globals.checkAuthentication, function(req, res, next){
	var collection = db.get("listings");

	collection.findOne({_id: monk.id(req.params.id)})
	.then((doc) => {
		res.render('listing/edit', {listing: doc, test: "hi"});
	});
	
	
});

router.put('/listings/:id', globals.checkOwnership, globals.checkAuthentication, function(req, res, next){
	var pictures = req.files.map(f => f.filename);
	
	updates = {
		title: req.body.title,
		condition: req.body.condition,
		description: req.body.description,
		bid: req.body.bidtart,
		duration_days: req.body.duration_days,
	}

	var collection = db.get('listings');
	collection.findOneAndUpdate({_id: monk.id(req.params.id)}, {$set: updates})
	.then((updatedDoc) => { res.render("/listings/" + updatedDoc._id, {listing: updatedDoc, user: req.user }); })
	.then(() => db.close());

});


router.delete('/listings/:id', globals.checkOwnership, globals.checkAuthentication, function(req, res, next){
	// Remember to do soft delete, not hard delete
	var collection = db.get('listings');
	collection.findOneAndUpdate({_id: monk.id(req.params.id)}, {$set: {available: 0}})
	.then((updatedDoc) => { 
		res.locals.info = "Item removed from available listings.";
		res.redirect('/'); 
	}).then(() => db.close());
});


module.exports = router;
