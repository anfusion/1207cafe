var express 		= require("express"),
	router 			= express.Router({mergeParams: true}),
	Blog 			= require("../models/blog"),
	expressSanitizer = require("express-sanitizer"),
	middlewareObj	= require("../middleware"),
	multer 			= require('multer'),
	cloudinary 		= require('cloudinary');

var storage = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = (req, file, cb) => {
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
router.get("/", (req, res) => {
	var noMatch;
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		// //Get matching blogs from database
		Blog.find({ "title": regex}, (err, allBlogs) => {
			if(err) {
				console.log(err);
			} else {
				if(allBlogs.length < 1) {
					noMatch = "No blogs match that name. Please try again.";
				}
				res.render("blogs/index", {blogs: allBlogs, noMatch: noMatch});
			}
		});
	} else {
		//Get all the blogs from database
		Blog.find({}, (err, allBlogs) => {
			if(err) {
				console.log(err);
			} else {
				res.render("blogs/index", {blogs: allBlogs, noMatch: noMatch});
			}
		});
	}
});


//NEW ROUTE - show form to create new blog
router.get("/new", middlewareObj.isLoggedIn, (req, res) => {
	res.render("blogs/new");
});


//CREATE ROUTE - add new blog to database
router.post("/", middlewareObj.isLoggedIn, upload.single('image'), (req, res) => {
	cloudinary.v2.uploader.upload(req.file.path, (error, result) => {
	 	// add cloudinary url for the image to the campground object under image property
	  	req.body.blog.image = result.secure_url;
 		//remove harmful script
		req.body.blog.content = req.sanitize(req.body.blog.content);
	 	console.log(req.body.blog);
		//create new blog post
		Blog.create(req.body.blog, (err, newlyCreated) => {
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
router.get("/:id", (req, res) => {
	// find blog with the provided Id
	Blog.findById(req.params.id).populate("comments").exec((err, foundBlog) => {
		if(err || !foundBlog) {
			req.flash("error", "Blog not found.");
			res.redirect("/blogs");
		} else {
			//render show template with that blog
			res.render("blogs/show", {blog: foundBlog});
		}
	})
});


//EDIT ROUTE
router.get("/:id/edit", middlewareObj.checkBlogOwnership, (req, res) => {
	//find blog to be edited
	Blog.findById(req.params.id, (err, foundBlog) => {
		if(err || !foundBlog) {
		req.flash("error", "Blog not found.");
		res.redirect("/blogs");
	} else {
		//open up edit page with preexisting fields filled in
		res.render("blogs/edit", {blog: foundBlog});
		}				
	});
});


//UPDATE ROUTE
router.put("/:id", middlewareObj.checkBlogOwnership, (req, res) => {
	//remove harmful script
	req.body.blog.content = req.sanitize(req.body.blog.content);
	//find blog and update with new data
	Blog.findByIdAndUpdate(req.params.id, req.body.blog, (err, updatedBlog) => {
		if(err) {
			res.redirect("/blogs");
		} else {
			//redirect to show page for edited blog
			req.flash("success", "Edited blog.");
			res.redirect("/blogs/" + req.params.id);
		}
	});
});


//DESTROY ROUTE
router.delete("/:id", middlewareObj.checkBlogOwnership, (req, res) => {
	//delete blog and return user to main blog page
	Blog.findByIdAndRemove(req.params.id, err => {
		if(err){
			res.redirect("/blogs");
		} else {
			req.flash("success", "Removed blog.");
			res.redirect("/blogs");
		}
	});
});

const escapeRegex = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");


//export these routes to app.js
module.exports = router;
