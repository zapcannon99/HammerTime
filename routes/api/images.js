var express = require('express');
var multer = require("multer");
var monk = require("monk");
var mv = require('mv');
var globals = require("../../globals/globals")
var router = express.Router();

const __image_db_path = __dirname + '/../../public/images/db/'

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
router.get('/:id', globals.checkOwnership, globals.checkAuthentication, function(req, res, next){
	// grab the listing with id id
	if(typeof(req.listing) == "undefined"){
		var collection = db.get("listings");

		collection.findOne({_id: monk.id(req.params.id)})
		.then((doc) => res.render('listing/show', {listing: doc}));
	} else {
		res.locals.listing = req.listing
		res.render('listing/show');
	}
});

router.post('/:id', globals.checkOwnership, globals.checkAuthentication, upload.array('added-photos'), function(req, res, next){
	console.log(req.files);
	var newPictures = req.files.map(f => f.filename);

	var collection = db.get("listings");
	collection.findOne({_id: monk.id(req.params.id)})
	.then((listing) => {
		var pictures = listing.pictures;
		pictures = pictures.concat(newPictures);
		collection.findOneAndUpdate({_id: monk.id(req.params.id)}, {$set: {pictures: pictures}})
		.then((updatedDoc) => {
			res.json({added: true, pictures: updatedDoc.pictures});
		});
	}).catch((err) => {
		res.json({added: false, info: "Sorry! There was an error on the server!"});
	}).then(() => db.close());
});

router.delete('/:id', globals.checkOwnership, globals.checkAuthentication, function(req, res, next){
	var listings = db.get('listings');
	var index = req.body.index;
	var picture = req.body.picture;
	listings.findOne({_id: monk.id(req.params.id)})
	.then((listing) => {
		var pictures = listing.pictures;
		var candidatePicture = pictures[index];
		if(candidatePicture == picture) {
			pictures.splice(index, 1);
			(async function(){
				var updatedDoc = await listings.findOneAndUpdate({_id: monk.id(req.params.id)}, {$set: {pictures: pictures}}).then((updatedDoc) => {return updatedDoc;})
				return res.json({deleted: true, pictures: updatedDoc.pictures});
			})()
		} else {
			return res.json({deleted: false, info: "Sorry! There was an error in the server!"});
		}
	});

	// var pictures = req.files.map(f => f.filename);

	// updates = {
	// 	title: req.body.title,
	// 	condition: req.body.condition,
	// 	description: req.body.description,
	// 	bid: req.body.bidtart,
	// 	duration_days: req.body.duration_days,
	// 	pictures: pictures
	// }

});

module.exports = router;
