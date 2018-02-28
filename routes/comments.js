var express 		= require("express"),
	router 			= express.Router({mergeParams: true}),
	Blog 			= require("../models/blog"),
	Comment 		= require("../models/comment"),
	expressSanitizer = require("express-sanitizer"),
	middlewareObj	= require("../middleware");


//==================
//COMMENT ROUTES
//==================

//NEW COMMENT ROUTE
router.get("/new", middlewareObj.isLoggedIn, function(req, res){
	//find blog by id and take user to comment creation page for that blog
	Blog.findById(req.params.id, function(err, foundBlog){
		if(err){
			console.log(err);
		} else {
			//show new comment page
			res.render("comments/new", {blog: foundBlog})
		}
	});
});


//CREATE COMMENT ROUTE
router.post("/", middlewareObj.isLoggedIn, function(req, res){
	//find blog for which comment is being written
	Blog.findById(req.params.id, function(err, foundBlog){
		if(err){
			console.log(err);
			res.redirect("/blogs");
		} else {
			//remove harmful script
			req.body.comment.text = req.sanitize(req.body.comment.text);
			//create new comment
			Comment.create(req.body.comment, function(err, newComment){
				if(err){
					console.log(err);
					req.flash("error", "Something went wrong.");
					res.redirect("/blogs");
				} else {
					//add username and id to comment
					newComment.author.id = req.user._id;
					newComment.author.username = req.user.username;
					//save new comment
					newComment.save();
					//connect created coment to blog
					foundBlog.comments.push(newComment._id);
					foundBlog.save();
					req.flash("success", "Successfully added comment.");
					res.redirect("/blogs/" + req.params.id);
				}
			});
		}
	});
});

//EDIT COMMENT ROUTE
router.get("/:comment_id/edit", middlewareObj.checkCommentOwnership, function(req, res){
	Blog.findById(req.params.id, function(err, foundBlog){
		if (err) {
			console.log(err);
			res.redirect("back");			
		} else {
			Comment.findById(req.params.comment_id, function(err, foundComment){
				if(err){
					console.log(err);
					res.redirect("back");
				} else {
					res.render("comments/edit", {comment: foundComment, blog: foundBlog});
				}
			});
		}
	});
});


//UPDATE COMMENT ROUTE

router.put("/:comment_id", middlewareObj.checkCommentOwnership, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, foundComment){
		if(err){
			console.log(err);
			res.redirect("/blogs");
		} else {
			// redirect to show page
			req.flash("success", "Edited comment.");
			res.redirect("/blogs/" + req.params.id);
		}
	});
});

//UPDATE COMMENT ROUTE
//with extra blog info but is not need at current point

// router.put("/:comment_id", function(req, res){
// 	Blog.findById(req.params.id, function(err, foundBlog){
// 		if (err) {
// 			console.log(err);
// 			res.redirect("/blogs");			
// 		} else {
// 			Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, foundComment){
// 				if(err){
// 					console.log(err);
// 					res.redirect("/blogs");
// 				} else {
// 					console.log(req.body.comment);
// 					// redirect to show page
// 					res.redirect("/blogs/" + req.params.id);
// 				}
// 			});
// 		}
// 	});
// });

//DESTROY COMMENT ROUTE
router.delete("/:comment_id", middlewareObj.checkCommentOwnership, function(req, res){
	//delete comment and return to show particular blog page
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			res.redirect("back");
		} else {
			req.flash("success", "Removed comment.");
			res.redirect("/blogs/" + req.params.id);
		}
	});
});


//export these routes to app.js
module.exports = router;
