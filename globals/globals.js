var monk = require('monk');
var db_path = "localhost:27017/HammerTime";
var db = monk(db_path);

exports.checkAuthentication = function(req,res,next) {
	if(req.user) {
		return next();
	} else {
		return res.redirect("/users/login");
	}
}

exports.checkOwnership = function(req, res, next) {
	var collection = db.get('listings');
	collection.findOne({ _id: req.params.id })
	.then((doc) => {
		var listingUsername = doc.owner;
		if(req.user && req.user._id.equals(listingUsername)){
			next();
		} else {
			res.locals.warning = "No touching. Just look. (in other words, stop trying to be bad and just be content with looking.";
			res.redirect(req.header.referer);
		}
	}).then(() => db.close());
}
