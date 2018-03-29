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

router.get("/", (req, res) => res.render("landing"));


//==================
//AUTHENTICATION ROUTES
//==================

//shows new user registration page
router.get("/register", (req, res) => res.render("register"));

//route that takes form info and registers new user
router.post("/register", (req, res) => {
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
	User.register(newUser, req.body.password, (err, user) => {
		if(err){
			console.log(err);
			req.flash("error", err.message);
			return res.render("register", {error: err.message});
		}
		//authenticate user using local strategy, redirect to blogs
		passport.authenticate("local")(req, res, () => {
			req.flash("success", "Welcome to 1207 " + user.username);
			res.redirect("/blogs");
		});
	});
});

//show login page
router.get("/login", (req, res) => res.render("login"));

//route that takes form info and logs in registered user
// router.post("/login", passport.authenticate("local", 
// 	{
// 		successRedirect: "/blogs",
// 		failureRedirect: "/login",
// 		failureFlash: true,
// 		successFlash: "success"
// 	}), function(req, res){
// });

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { 
    	req.flash("error", err.message);
    	return next(err);
    }
    if (!user) {
    	req.flash("error", "Could not log you in. Please check your username and password.");
    	return res.redirect('/login'); 
    }
    req.logIn(user, err => {
      	if (err) { 
      		return next(err);
      	}
      	req.flash("success", "Welcome back to 1207, " + user.username);

      	if (req.session.previousUrl) {
      		return res.redirect(req.session.previousUrl);
      	}
      	return res.redirect('/blogs');
    });
  })(req, res, next);
});

//log route route, redirects to blogs page
router.get("/logout", (req, res) => {
	req.session.previousUrl = "/blogs";
	req.logout();
	req.flash("success", "You have successfully logged out.")
	res.redirect("/blogs");
});



//USER PROFILE
router.get("/users/:id", (req, res) => {
	User.findById(req.params.id, (err, foundUser) => {
		if(err){
			req.flash("error", "Could not access user profile.");
			res.redirect("/blogs");
		}
		if (foundUser) {
			Blog.find().where("author.id").equals(foundUser._id).exec((err, foundBlogs) => {
				if(err){
					req.flash("error", "Could not acces user profile.");
					res.redirect("/blogs");
				}	
			res.render("users/show", {user: foundUser, blogs: foundBlogs});
			});
		} else {
			req.flash("error", "Could not access user profile.");
			res.redirect("/blogs");
		}
	});
});



//FORGOT AND RESET FUNCTIONALITY
//forgot pw route
router.get("/forgot", (req, res) => res.render("forgot"));

router.post("/forgot", (req, res, next) => {
	async.waterfall([
		(done) => {
			crypto.randomBytes(20, (err, buf) => {
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		(token, done) => {
			User.findOne({ email: req.body.email }, (err, user) => {
				if(!user) {
					req.flash("error", "Sorry, no account with that email exists.");
					return res.redirect("forgot");
				}

				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1hour

				user.save((err) => {
					done(err, token, user);
				});
			});
		},
		(token, user, done) => {
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
				text: `You are receiving this because you (or someone else) have requested the reset of the password for your 1207cafe account.

Please click on the following link, or paste this into your browser to complete the process:

http:\/\/${req.headers.host}/reset/${token}

If you did not request this, please ignore this email and your password will remain unchanged.
`
			};
			smtpTransport.sendMail(mailOptions, err => {
				req.flash("success", "An e-mail has been sent to " + user.email + " with further instructions.");
				done(err, "done");
				console.log("mail sent");
			});
		}
	], (err) => {
		if (err) return next(err);
		res.redirect("/blogs");
	});
})

router.get("/reset/:token", (req, res) => {
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
		if(!user) {
			req.flash("error", "Password reset token is invalid or has expired.");
			return res.redirect("/forgot");
		}
		res.render("reset", {token: req.params.token});
	});
});

router.post("/reset/:token", (req, res) => {
	async.waterfall([
		(done) => {
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
				if(!user) {
					req.flash("error", "Password reset token is invalid or has expired.");
					return res.redirect("/forgot");
				}
				if(req.body.password === req.body.confirm) {
					user.setPassword(req.body.password, err => {
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;

						user.save(err => {
							req.logIn(user, err => {
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
		(user, done) => {

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
				subject: 'Your 1207cafe password has been changed',
				text: `This is a confirmation that the password for your account ${user.email} has just been changed.`
			};

			smtpTransport.sendMail(mailOptions, err => {
				req.flash("success", "Success! Your password has been changed.");
				done(err);
				console.log("mail sent");
			});
		}
	], err => {
		res.redirect("/blogs")
	})
});

//route that hits when nothing else does
router.get("*", (req, res) => {
	res.send("someting go bad mon.");
});







//export these routes to app.js
module.exports = router;

