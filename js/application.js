window.App = Ember.Application.create();

//App.Store
App.ApplicationAdapter = DS.RESTAdapter.extend({
  // Application specific overrides go here
});

// Controllers
App.IndexController = Ember.Controller.extend({
  actions:{
  	search: function(query){
  		if(query){
  			var queries = query.split(" ");
  			var Util = Ember.EnumerableUtils ;
  			queries = Util.filter(queries, function(elem){
  				return elem != ""; 
  			});

  			this.store.find('photo', {})
  			
  		}else{
  			
  		}
  	}
  }
});

//Routes
App.Router.map(function(){
	this.route("index", {path:"/"})
});


// Models
var attr = DS.attr;
App.Photo = DS.Model.extend({
	id: attr(),
	owner: attr(),
	secret: attr(),
	server: attr(),
	farm: attr(),
	title: attr(),
// https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg
// 	or
// https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}_[mstzb].jpg
// 	or
// https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{o-secret}_o.(jpg|gif|png)
	srcUrl: function(){
		var get = this.get ;
		return "https://farm" + get("farm") + ".staticflickr.com/" + get("server") + "/" + get("id")+ "_" + get("secret") + "_z.jpg" ;
	}.property("id", "secret", "server", "farm"),

	srcUrlThumbnail: function(){
		var get = this.get ;
		return "https://farm" + get("farm") + ".staticflickr.com/" + get("server") + "/" + get("id")+ "_" + get("secret") + "_t.jpg" ;
	}.property("id", "secret", "server", "farm"),

//https://www.flickr.com/photos/{user-id}/{photo-id} - individual photo
	profileUrl: function(){
		var get = this.get ;
		return "https://www.flickr.com/photos/" + get("owner") + "/" + get("id") + "/";
	}.property("id", "owner")
});
