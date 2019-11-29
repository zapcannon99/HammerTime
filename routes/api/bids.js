var express = require('express');
var monk = require("monk");
var globals = require("../../globals/globals")
var router = express.Router();

var db_path = "localhost:27017/HammerTime";
var db = monk(db_path);

async function getCurrentBid(listingID) {
	listings = db.get('listings');
	bidsCollection = db.get('bids');
	var listing = await listings.findOne({_id: monk.id(listingID)})
	.then((listing) => {
		return listing;
	});

	var currentBid = listing.bidStart;
	if(listing.bids.length > 0) {
		var lastBid = await bidsCollection.findOne({_id: monk.id(listing.bids[listing.bids.length - 1])}).then((bid) => {return bid;});
		currentBid = lastBid.amount;
		//console.log("nolo" + currentBid);
		return currentBid;
	} else {
		//console.log("yolo" + currentBid)
		return currentBid;
	}
}


// routes for bids ---------------------------------------

router.get('/getCurrentBid/:id', function(req, res, next) {
	// console.log(req.params.id);
	// console.log("what what?" + req.user);
	(async function(){
		return res.json({currentBid: await getCurrentBid(req.params.id)});
	})()
});

router.post('/submitBid', globals.checkAuthentication, function(req, res, next){
	console.log("username" + req.user);
	var listings = db.get('listings');
	var bids = db.get('bids');
	var submittedBid = req.body.bid;
	console.log(req.body.listID);
	
	(async function() {
		var currentBid = await getCurrentBid(req.body.listID);
		console.log(currentBid);
		if(submittedBid > currentBid) {
			var insertedBid = await bids.insert({listingID: req.body.listID, username: req.user.username, amount: req.body.bid, timestamp: Date.now()}).then((bid) => {return bid;});
			console.log(insertedBid);
			var bidID = insertedBid._id;
			var listing = await listings.findOne({_id: monk.id(req.body.listID)}).then((listing) => {return listing;})
			console.log(listing);
			var pastBids = listing.bids;
			pastBids.push(bidID);
			listing = await listings.findOneAndUpdate({_id: monk.id(req.body.listID)}, {$set: {bids: pastBids}}).then((updatedDoc) => {console.log(updatedDoc)});
			return res.json({success: true, info: "Successful HammerTime!"});
		} else {
			return res.json({sucess: false, info: "Sorry! Someone has bet more before you did!", currentBid: currentBid	});
		}
	})()
		
});

module.exports = router;
