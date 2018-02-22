var express 		= require("express"),
	app 			= express(),
	bodyParser 		= require("body-parser"),
	mongoose 		= require("mongoose"),
	methodOverride	= require("method-override"),
	passport 		= require("passport"),
	flash			= require("connect-flash"),
	localStrategy	= require("passport-local"),
	expressSanitizer= require("express-sanitizer");

var	Blog 			= require("./models/blog"),
	Comment 		= require("./models/comment"),
	User 			= require("./models/user");
//	seedDB			= require("./seeds");


var	blogRoutes 		= require("./routes/blogs"),
	commentRoutes 	= require("./routes/comments"),
	indexRoutes 	= require("./routes/index");

//connecting to database
var url = process.env.DATABASEURL || "mongodb://localhost/1207cafe";
mongoose.connect(url);

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(flash());
// seedDB(); // seed the database

//PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Coolest cafe in Hiroshima",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//PROVIDE CURRENT USER VARIABLE TO ALL PAGES 
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

//REQUIRING ROUTES
app.use("/blogs", blogRoutes);
app.use("/blogs/:id/comments", commentRoutes);
app.use(indexRoutes);

//handle signup logic
app.listen(process.env.PORT || 3000, function(){
	console.log("1207 NOW RUNNING");
});



