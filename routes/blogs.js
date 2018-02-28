var express 		= require("express"),
	router 			= express.Router({mergeParams: true}),
	Blog 			= require("../models/blog"),
	expressSanitizer = require("express-sanitizer"),
	middlewareObj	= require("../middleware"),
	multer 			= require('multer'),
	cloudinary 		= require('cloudinary');

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

cloudinary.config({ 
  cloud_name: 'anfusion', 
  api_key: "247953263581273", 
  api_secret: "OMFMwbFcOXT6APToDJSPP8MSwnA"
});


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
router.post("/", middlewareObj.isLoggedIn, upload.single('image'), function(req, res) {
	cloudinary.v2.uploader.upload(req.file.path, function(error, result) {
	 	// add cloudinary url for the image to the campground object under image property
	  	req.body.blog.image = result.secure_url;
 		//remove harmful script
		req.body.blog.content = req.sanitize(req.body.blog.content);
	 	console.log(req.body.blog);
		//create new blog post
		Blog.create(req.body.blog, function(err, newlyCreated){
			if (err){
				req.flash('error', err.message);
	      		return res.redirect('/blogs');
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
			eval(require("locus"));
			req.flash("success", "Edited blog.");
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
