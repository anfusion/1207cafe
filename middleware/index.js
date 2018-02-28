//all middleware contained here

var middlewareObj = {},
	Blog = require("../models/blog"),
	Comment = require("../models/comment");

//checks if user owns blog or not
middlewareObj.checkBlogOwnership = function(req, res, next){
		//is user logged in?
	if(req.isAuthenticated()){
		//find blog to be edited
		Blog.findById(req.params.id, function(err, foundBlog){
			if(err){
				console.log(err);
				req.flash("error", "Blog not found.");
				res.redirect("back");
			} else {
				//does user own campground?
				if (foundBlog.author.id.equals(req.user._id) || req.user.isAdmin) {
					//move onto next code
					next();					
				} else {
					req.flash("error", "Sorry, you can only edit your own blogs.");
					res.redirect("/blogs");
				}
			}
		});
	} else {
		//otherwise redirect
		req.flash("error", "Sorry, you need to be logged in to do that.")
		res.redirect("/blogs");
	}
}

//checks if user is th owner of a comment or not
middlewareObj.checkCommentOwnership = function(req, res, next){
	//is user logged in?
	if(req.isAuthenticated()){
		//find comments to edited
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err){
				req.flash("error", "Blog not found.");
				res.redirect("back");
			} else {
				//does user own comment?
				if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
					//move on to the remainder of the route function
					next();
				} else {
					req.flash("error", "Sorry you can only edit your own comments.")
					res.redirect("/blogs/" + req.params.id);
				}
			}
		});
	} else {
		req.flash("error", "Sorry, you need to be logged in to do that.")
		res.redirect("/blogs/" + req.params.id);
	}
}

//checks if user is logged in or not
middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that.");
	res.redirect("/login");
}

middlewareObj.isAdmin = function(req, res, next) {
	if (req.user.isAdmin) {

	};
}



module.exports = middlewareObj;