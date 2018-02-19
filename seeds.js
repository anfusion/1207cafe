var mongoose    = require("mongoose");
var Blog        = require("./models/blog");
var Comment     = require("./models/comment");

var data = [

     {
        title: "Walk in the park",
        image: "/images/nzatnight.jpg",
        description: "This is a doozy",
        content: "11111 lah blah blah Oh i love content so much Oh i love content so much Oh i love content so much",
        // created: { type: Date, default: Date.now}
    },
    {
        title: "Poo in the sea",
        image: "/images/20140317_175127.jpg",
        description: "Floating by a beach neary you",
        content: "2222 Oh i love content so much Oh i love content so much Oh i love content so much Oh i love content so much",
        // created: { type: Date, default: Date.now}
    },
    {
        title: "I met the dude",
        image: "/images/dude.png",
        description: "The guy with the hairest cool in town",
        content: "33333 Do odo bblah Oh i love content so much Oh i love content so much blah blah",
        // created: { type: Date, default: Date.now}
    }

]

function seedDB(){
   //Remove all blogs
   Blog.remove({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed blogs!");
        Comment.remove({}, function(err) {
            if(err){
                console.log(err);
            }
            console.log("removed comments!");
             //add a few blogs
            data.forEach(function(seed){
                Blog.create(seed, function(err, blog){
                    if(err){
                        console.log(err)
                    } else {
                        console.log("added a blog");
                        //create a comment
                        Comment.create(
                            {
                                text: "This blog is great, but I wish there was pictures",
                                author: "Homer"
                            }, function(err, comment){
                                if(err){
                                    console.log(err);
                                } else {
                                    blog.comments.push(comment._id);
                                    blog.save();
                                    console.log("Created new comment");
                                }
                            });
                    }
                });
            });
        });
    }); 
    //add a few comments
}

module.exports = seedDB;