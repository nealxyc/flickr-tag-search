var express = require('express');
//var session = require('express-session');
var app = express();
var passport = require('passport'),
    OAuthStrategy = require('passport-oauth').OAuthStrategy;
var key = require("./api_key.js");

// Configurable port number passed in from shell arg
var port = 8080;
if(process.argv.length > 2){
	port = process.argv[2] ;
}

//app.use(session({secret: 'session-key'})); //session secret
app.use(passport.initialize());
//app.use(passport.session()); // persistent login sessions

// Static content under app folder
app.use(express.static("app"));

// Oauth login
passport.use('flickr', new OAuthStrategy({
    requestTokenURL: 'https://www.flickr.com/services/oauth/request_token',
    accessTokenURL: 'https://www.flickr.com/services/oauth/access_token',
    userAuthorizationURL: 'https://www.flickr.com/services/oauth/authorize?perms=read',
    consumerKey: key.apiKey,
    consumerSecret: key.secret,
    callbackURL: 'http://localhost:' + port + '/oauth/flickr/callback',
  },
  function(token, tokenSecret, profile, done) {
    //
  }
));

// Initial auth
app.get('/oauth/flickr', passport.authenticate('flickr', { session: false }));

//Callback
app.get('/oauth/flickr/callback', passport.authenticate('flickr', { 
  	successRedirect: '/',
    failureRedirect: '/' 
}));


// Start the server
var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});