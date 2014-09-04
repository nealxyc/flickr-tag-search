var express = require('express');
var session = require('express-session');
var app = express();
var passport = require('passport'),
    FlickrStrategy = require('passport-flickr').Strategy;
var key = require("./api_key.js");

// Init in-memory db
var db = new (require('nedb'))();

// Configurable port number passed in from shell arg
var port = 8080;
var host = "localhost" ;
if(process.argv.length > 2){
	var host_port = process.argv[2].split(":") ;
  if(host_port.length > 1){
    host = host_port[0];
    port = host_port[1];
  }else{
    port = host_port[0];
  }
}

app.use(session({secret: 'S3SS1ON-S3CR3T'})); //session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// Static content under app folder
app.use(express.static("app"));

// Oauth login
passport.use('flickr', new FlickrStrategy({
    // requestTokenURL: 'https://www.flickr.com/services/oauth/request_token',
    // accessTokenURL: 'https://www.flickr.com/services/oauth/access_token',
    // userAuthorizationURL: 'https://www.flickr.com/services/oauth/authorize?perms=read',
    consumerKey: key.apiKey,
    consumerSecret: key.secret,
    callbackURL: 'http://' + host + ':' + port + '/oauth/flickr/callback',
  },
  function(token, tokenSecret, profile, done) {
    var user = profile ;
    user.token = token ;
    user.tokenSecret = tokenSecret ;
    if(!user.id){
      console.error(new Error("No user id return from flickr server."));
      done(null, false);
    }
    done(null, user);
  }
));

passport.serializeUser(function(user, done) {
    // console.log("user=" + JSON.stringify(user)) ;
    db.find({id: user.id}, function(err, users){
      
      if(users && users[0]){
        //Update existing doc
        var currentUser = users[0];
        db.update(currentUser, user);
      }else{
        db.insert(user);
      }

      done(err, user.id);
    });
    
});

passport.deserializeUser(function(id, done) {
  // console.log("id=" + id) ;
  db.find({id:id}, function(err, users){
    var user = users[0]
    done(err, user);
  });
    
});

// Initial auth
app.get('/oauth/flickr', passport.authenticate('flickr'));

//Oauth callback
app.get('/oauth/flickr/callback', passport.authenticate('flickr', { 
  	successRedirect: '/',
    failureRedirect: '/' 
}));

//Login user info
app.get('/users', function(req, res){
    if(req.user){
      res.send(JSON.stringify({"users":[req.user]}));
    }else{
      res.send(JSON.stringify({"users":[]}));
    }
});

// For log out
app.delete('/users/:id', function(req, res){
    var id = req.params.id ;
    req.logout();
    res.send(JSON.stringify({}));
});


// Start the server
var server = app.listen(port, function() {
    console.log(new Date());
    console.log('Listening on port %d', server.address().port);
    console.log('Server is accessible at http://%s:%s/', host, port);
});