var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

//USER SCHEMA
var userSchema = new mongoose.Schema ({
	username: {type: String, unique: true, required: true},
	password: String,
	avatar: String,
	firstName: String,
	lastName: String,
	email: {type: String, required: true},
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	isAdmin: {type: Boolean, default: false}
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);