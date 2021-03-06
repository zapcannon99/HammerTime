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
	(async function() {
		var collection = db.get("listings");
		var bids = db.get('bids');
		var listings = await collection.find()
		.then((docs) => {
			return docs;
		})

		var lastBidIDs = listings.map(listing => {
			if(listing.bids.length > 0) {
				return monk.id(listing.bids[listing.bids.length - 1]);
			} else {
				return null;
			}
		});
		var possibleBids = await bids.find({_id: {$in: lastBidIDs}}).then((docs) => {return docs;});

		lastBidIDs.forEach((id, index) => {
			var currentBid = 0;
			if(id != null) {
				var bid = possibleBids.find(({_id}) => {return _id.toString() == id.toString();});
				currentBid = bid.amount;
			} else {
				currentBid = listings[index].bidStart;
			}
			listings[index].currentBid = currentBid;
		});

		res.render('index', {listings: listings, user: req.user, page: 1});
	})()

});

router.get('/listings/new', globals.checkAuthentication, function(req, res, next){
	res.render('listing/form', {user: req.user});
});

router.get('/listings/:id', function(req, res, next){
	// grab the listing with id id
	if(typeof(req.listing) == "undefined"){
		var collection = db.get("listings");

		collection.findOne({_id: monk.id(req.params.id)})
		.then((listing) => {
			var owned = false;
			var won = false;
			if(req.user){
				if(req.user._id.equals(listing.owner)) {
					owned = true;
				}
				if(listing.winner)
				{
					if(req.user._id.equals(listing.winner))
						won = true;
				}
			}
			if(listing.bids.length > 0) {
				var lastBidID = listing.bids[listing.bids.length - 1];
				db.get('bids').findOne({_id: monk.id(lastBidID)})
				.then((bid) => {
					res.render('listing/show', {listing: listing, user: req.user, owned: owned, won:won, currentBid: bid.amount});
				})
			} else {
				res.render('listing/show', {listing: listing, user: req.user, owned: owned, won: won, currentBid: listing.bidStart})
			}
		});
	} else {
		res.locals.listing = req.listing
		res.render('listing/show', {user: req.user});
	}
});

router.post('/listings', globals.checkAuthentication, upload.array('pictures', 12), function(req, res, next){
	var pictures = req.files.map(f => f.filename);

	var listing = {
		title: req.body.title,
		category: req.body.category,
		condition: req.body.condition,
		description: req.body.description,
		bidStart: req.body.bidStart,
		endTime: req.body.endTime,
		pictures: pictures,
		owner: req.user._id,
		bids: [],
		deleted: false,
		ended: false, // ended is the flag used by cron scheduler to help flag ones that have already been checked
		paid: false,
		shipped: false
	}

	var collection = db.get("listings");
	collection.insert(listing)
	.then((doc) => {
		req.listing = doc;
		res.redirect('/listings/' + doc._id);
	}).catch((err) => {
		console.log(err);
	}).then(() => db.close());
});

router.get('/listings/:id/edit', globals.checkOwnership, globals.checkAuthentication, function(req, res, next){

	if(typeof(req.listing) == "undefined"){
		var collection = db.get("listings");

		collection.findOne({_id: monk.id(req.params.id)})
		.then((listing) => {
			var owned = false;
			if(req.user){
				if(req.user._id == listing.owner) {
					owned = true;
				}
			}
			if(listing.bids.length > 0) {
				var lastBidID = listing.bids[listing.bids.length - 1];
				db.get('bids').findOne({_id: monk.id(lastBidID)})
				.then((bid) => {
					res.render('listing/edit', {listing: listing, user: req.user, owned: owned, currentBid: bid.amount});
				})
			} else {
				res.render('listing/edit', {listing: listing, user: req.user, owned: owned, currentBid: listing.bidStart})
			}
		});
	} else {
		// I feel like this else will never be accessed, so I don't know why I have it -JY
		res.locals.listing = req.listing
		res.render('listing/edit', {user: req.user});
	}
});

router.put('/listings/:id', globals.checkOwnership, globals.checkAuthentication, function(req, res, next){
	updates = {
		title: req.body.title,
		category: req.body.category,
		condition: req.body.condition,
		description: req.body.description,
		shipped: req.body.shipped,
	}

	var collection = db.get('listings');
	collection.findOneAndUpdate({_id: monk.id(req.params.id)}, {$set: updates})
	.then((updatedDoc) => {
		req.listing = updatedDoc;
		res.redirect("/listings/" + updatedDoc._id);
	})
	.then(() => db.close());

});


router.delete('/listings/:id', globals.checkOwnership, globals.checkAuthentication, function(req, res, next){
	// Remember to do soft delete, not hard delete
	var collection = db.get('listings');
	collection.findOneAndUpdate({_id: monk.id(req.params.id)}, {$set: {deleted: true}})
	.then((updatedDoc) => {
		res.locals.info = "Item removed from available listings.";
		res.redirect('/listings');
	}).then(() => db.close());
});

router.get('/listings/:id/checkout', globals.checkAuthentication, function(req, res) {
	var listings = db.get('listings');
	(async function() {
		var listing = await listings.findOne({_id: monk.id(req.params.id)}).then((doc) => {return doc;});
		if(typeof(listing.winner) == "undefined") {
			res.locals.info = "This doesn't belong to you!";
			res.locals.type = "warning";
			console.log("somebody doesn't belong here");
			return res.redirect('/Listings');
		} else {
			if(listing.winner.equals(req.user._id)) {
				return res.render('listing/checkout', {user: req.user, listing: listing});
			} else {
				res.locals.info = "This doesn't belong to you!";
				res.locals.type = "warning";
				return res.redirect('/listings');
			}
		}
	})()
});

router.post('/listings/:id/checkout', globals.checkAuthentication, function(req, res) {
	var listings = db.get('listings');
	(async function() {
		var listing = await listings.findOne({_id: monk.id(req.params.id)}).then((doc) => {return doc;});
		if(typeof(listing.winner) == "undefined") {
			res.locals.info = "This doesn't belong to you!";
			res.locals.type = "warning";
			return res.redirect('/');
		} else {
			if(listing.winner.equals(req.user._id)) {
				listings.findOneAndUpdate({_id: monk.id(listing._id)}, {$set: {paid: true}}).then((updatedDoc) => {return updatedDoc;});
				res.locals.info = "Item Paid!";
				res.locals.type = "success";
				return res.json({success:true});
			} else {
				res.locals.info = "This doesn't belong to you!";
				res.locals.type = "warning";
				return res.redirect('/');
			}
		}
	})()
});


module.exports = router;
