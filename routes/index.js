var express 	= require("express"),
	router 		= express.Router({mergeParams: true}),
	passport 	= require("passport"),
	User 		= require("../models/user"),
	Blog 		= require("../models/blog"),
	async		= require("async"),
	nodemailer	= require("nodemailer"),
	crypto		= require("crypto");


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
	var newUser = new User({	
			username: req.body.username,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			avatar: req.body.avatar,
			email: req.body.email
		});

	if (req.body.adminCode === "1207owner") {
		newUser.isAdmin = true;
	}
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
      	req.flash("success", "Welcome back to 1207, " + user.username);
      	if (req.session.urlTest) {
			return res.redirect(req.session.urlTest);
		}
      	return res.redirect('/blogs');
    });
  })(req, res, next);
});

//log route route, redirects to blogs page
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "You have successfully logged out.")
	res.redirect("/blogs");
});



//USER PROFILE
router.get("/users/:id", function(req, res){
	console.log(req.params.id);
	User.findById(req.params.id, function(err, foundUser) {
		console.log(foundUser);
		if(err){
			req.flash("error", "Could not access user profile.");
			res.redirect("/blogs");
		}
		if (foundUser) {
			Blog.find().where("author.id").equals(foundUser._id).exec(function(err, foundBlogs){
				if(err){
					req.flash("error", "Could not acces user profile.");
					res.redirect("/blogs");
				}	
			res.render("users/show", {user: foundUser, blogs: foundBlogs});
			});
		}
		req.flash("error", "Could not access user profile.");
		res.redirect("/blogs");
	});
});



//FORGOT AND RESET FUNCTIONALITY
//forgot pw route
router.get("/forgot", function(req, res){
	res.render("forgot");
});

router.post("/forgot", function (req, res, next) {
	async.waterfall([
		function(done) {
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done) {
			User.findOne({ email: req.body.email }, function(err, user){
				if(!user) {
					req.flash("error", "Sorry, no account with that email exists.");
					return res.redirect("forgot");
				}

				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1hour

				user.save(function(err){
					done(err, token, user);
				});
			});
		},
		function(token, user, done) {
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
				    type: "OAuth2",
				    user: 'anfusiondevelopment@gmail.com',
				    clientId: process.env.CLIENT_ID,
				    clientSecret: process.env.CLIENT_SECRET,
				    refreshToken: process.env.REFRESH_TOKEN,                            
				  }
			});
			var mailOptions = {
				to: user.email,
				from: 'anfusiondevelopment@gmail.com',
				subject: '1207cafe password reset',
				text: 'You are receiving this because you (or someone else) have requested the reset of the password for your 1207cafe account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			smtpTransport.sendMail(mailOptions, function(err) {
				req.flash("success", "An e-mail has been sent to " + user.email + " with further instructions.");
				done(err, "done");
				console.log("mail sent");
			});
		}
	], function(err) {
		if (err) return next(err);
		res.redirect("/blogs");
	});
})

router.get("/reset/:token", function(req, res) {
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
		if(!user) {
			req.flash("error", "Password reset token is invalid or has expired.");
			return res.redirect("/forgot");
		}
		res.render("reset", {token: req.params.token});
	});
});

router.post("/reset/:token", function (req, res){
	async.waterfall([
		function(done) {
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
				if(!user) {
					req.flash("error", "Password reset token is invalid or has expired.");
					return res.redirect("/forgot");
				}
				if(req.body.password === req.body.confirm) {
					user.setPassword(req.body.password, function(err){
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;

						user.save(function(err){
							req.logIn(user, function(err){
								done(err, user);
							});
						});
					})
				} else {
					req.flash("error", "Passwords do not match.");
					return res.redirect("back");
				}
			});
		},
		function (user, done) {
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: 'anfusiondevelopment@gmail.com',
					pass: process.env.GMAILPW
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'anfusiondevelopment@gmail.com',
				subject: 'Your 1207cafe password has been changed',
				text: 'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
			};
			smtpTransport.sendMail(mailOptions, function(err) {
				req.flash("success", "Success! Your password has ben changed.");
				done(err);
			});
		}
	], function(err) {
		res.redirect("/blogs")
	})
});

//route that hits when nothing else does
router.get("*", function(req, res) {
	res.send("someting go bad mon.");
});







//export these routes to app.js
module.exports = router;

