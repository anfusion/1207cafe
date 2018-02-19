var express 		= require("express"),
	router 			= express.Router({mergeParams: true}),
	Blog 			= require("../models/blog"),
	expressSanitizer = require("express-sanitizer"),
	middlewareObj	= require("../middleware");


//==================
//BLOG ROUTES
//==================

//INDEX ROUTE - showing all blogs
router.get("/", function(req, res){
	//Get all the blogs from database
	Blog.find({}, function(err, allBlogs){
		if(err) {
			console.log(err);
		} else {
			res.render("blogs/index", {blogs: allBlogs});
		}
	});
});


//NEW ROUTE - show form to create new blog
router.get("/new", middlewareObj.isLoggedIn, function(req, res) {
	res.render("blogs/new");
});


//CREATE ROUTE - add new blog to database
router.post("/", middlewareObj.isLoggedIn, function(req, res) {
	//remove harmful script
	req.body.blog.content = req.sanitize(req.body.blog.content);
	//create new blog post
	Blog.create(req.body.blog, function(err, newlyCreated){
		if (err){
			console.log(err);
		} else {
			//adduser info to created blog
			var author = {
				id: req.user._id,
				username: req.user.username
			};
			newlyCreated.author = author;
			newlyCreated.save();
			//redirect back to blogs page
			req.flash("success", "Successfully created blog.")
			res.redirect("/blogs");
		}
	});
});


//SHOW ROUTE - shows the full content of a particular blog
router.get("/:id", function(req, res){
	// find blog with the provided Id
	Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog){
		if(err) {
			console.log(err);
		} else {
			//render show template with that blog
			res.render("blogs/show", {blog: foundBlog});
		}
	})
});


//EDIT ROUTE
router.get("/:id/edit", middlewareObj.checkBlogOwnership, function(req, res) {
	//find blog to be edited
	Blog.findById(req.params.id, function(err, foundBlog){
		//open up edit page with preexisting fields filled in
		res.render("blogs/edit", {blog: foundBlog});					
	});
});


//UPDATE ROUTE
router.put("/:id", middlewareObj.checkBlogOwnership, function(req, res){
	//remove harmful script
	req.body.blog.content = req.sanitize(req.body.blog.content);
	//find blog and update with new data
	Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
		if(err) {
			res.redirect("/blogs");
		} else {
			//redirect to show page for edited blog
			res.redirect("/blogs/" + req.params.id);
		}
	});
});


//DESTROY ROUTE
router.delete("/:id", middlewareObj.checkBlogOwnership, function(req, res){
	//delete blog and return user to main blog page
	Blog.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/blogs");
		} else {
			req.flash("success", "Removed blog.");
			res.redirect("/blogs");
		}
	});
});


//export these routes to app.js
module.exports = router;
