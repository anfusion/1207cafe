var express 	= require("express"),
	router 		= express.Router({mergeParams: true}),
	passport 	= require("passport"),
	User 		= require("../models/user");


//==================
//ROOT ROUTE
//==================

router.get("/", function(req, res){
	res.render("landing");
});


//==================
//AUTHENTICATION ROUTES
//==================

//shows new user registration page
router.get("/register", function(req, res){
	res.render("register");
});

//route that takes form info and registers new user
router.post("/register", function(req, res){
	//take and store username, do not store pw (hashed by passport)
	var newUser = new User({username: req.body.username});
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			req.flash("error", err.message);
			return res.render("register", {error: err.message});
		}
		//authenticate user using local strategy, redirect to blogs
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Welcome to 1207 " + user.username);
			res.redirect("/blogs");
		});
	});
});

//show login page
router.get("/login", function(req, res){
	res.render("login");
});

//route that takes form info and logs in registered user
// router.post("/login", passport.authenticate("local", 
// 	{
// 		successRedirect: "/blogs",
// 		failureRedirect: "/login",
// 		failureFlash: true,
// 		successFlash: "success"
// 	}), function(req, res){
// });

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
    	req.flash("error", err.message);
    	return next(err);
    }
    if (!user) {
    	req.flash("error", "Could not log you in. Please check your username and password.");
    	return res.redirect('/login'); 
    }
    req.logIn(user, function(err) {
      if (err) { 
      	return next(err);
      	 }
      req.flash("success", "Welcome back to 1207, " + user.username)
      return res.redirect('/blogs');
    });
  })(req, res, next);
});

//route that logs out user, redirects to blogs page
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "You have successfully logged out.")
	res.redirect("/blogs");
});

//route that hits when nothing else does
router.get("*", function(req, res) {
	res.send("someting go bad mon.");
});

//export these routes to app.js
module.exports = router;