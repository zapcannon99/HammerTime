var express = require('express');
var multer = require("multer");
var monk = require("monk");
var mv = require('mv');
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
	res.render('index', {title: 'HammerTime!'});
});

router.get('/listings/new', function(req, res, next){
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

router.post('/listings/', upload.array('pictures', 12), function(req, res, next){
	var pictures = req.files.map(f => f.filename);

	listing = {
		title: req.body.title,
		condition: req.body.condition,
		description: req.body.description,
		bid: req.body.bidStart,
		duration_days: req.body.duration_days,
		pictures: pictures
	}

	var collection = db.get("listings");
	collection.insert(listing)
	.then((doc) => {
		console.log(doc._id);
		req.listing = doc;
		res.redirect('/listings/' + doc._id);
	}).catch((err) => {
		console.log(err);
	}).then(() => db.close());
});

router.get('/listings/:id/edit', function(req, res, next){

});

// Need to implement method override
router.put('/listings/:id', function(req, res, next){

});

// Need to implement method override
router.delete('/listings/:id', function(req, res, next){
	// Remember to do soft delete, not hard delete
});


//routes for users/admins ----------------------------------------
router.get('/user', function(req, res, next){

})

router.get('/user/form', function(req, res, next){

})

module.exports = router;
