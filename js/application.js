window.App = Ember.Application.create({
	apiKey: "dc5ee141168cf58790d6e8dc3f6c0a46",
});

//App.Store
//https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=c72d785e4696909f6a8a042a0d84b35b&tags=cat&format=json&nojsoncallback=1&api_sig=2a8499223de96343d4dbe8acd7b78730
// App.ApplicationAdapter = DS.RESTAdapter.extend({
//   host: "https://api.flickr.com", 
//   namespace: "services/rest"
// });
App.PhotoAdapter = DS.Adapter.extend({
	url: "https://api.flickr.com/services/rest",
	find: function(store, type, id){
		throw Error("Not implemented!");
	},
	createRecord: function(store, type, record){
		throw Error("Not implemented!");
	},
	updateRecord: function(){
		throw Error("Not implemented!");
	},
	deleteRecord: function(){
		throw Error("Not implemented!");
	},
	findAll: function(){
		throw Error("Not implemented!");
	},

	findQuery: function(store, type, query){

		var url = this.get("url");

	    return new Ember.RSVP.Promise(function(resolve, reject) {
	      jQuery.ajax({
	      	url: url,
	      	dataType: "jsonp",
	  	    jsonp: "jsoncallback",
	  	    crossDomain: true,
	  	    data: {
	      		tags: query.tags, // expecting format tags=cat,dog
		      	method: "flickr.photos.search",
		      	api_key: App.get("apiKey"),
		      	format: "json",
		      	tag_mode: "all",
		    },
	      }).then(function(data) {
	        Ember.run(null, resolve, data);
	      }, function(jqXHR) {
	        jqXHR.then = null; // tame jQuery's ill mannered promises
	        Ember.run(null, reject, jqXHR);
	      });
	    });
	},
});

// Cusomized serializer
App.PhotoSerializer = DS.RESTSerializer.extend({
  normalizePayload: function(payload) {
    delete payload.stat;
    return payload;
  },
  extractArray: function(store, type, payload) {
  	// Moves photo into its own array
    var photo = payload.photos.photo;
    payload = {photo: photo};
    return this._super(store, type, payload);
  },
  extractMeta: function(store, type, payload){
  	if(payload && payload.photos && payload.photos.page){
  		var meta = {
	  		//page": 1, "pages": "52892", "perpage": 100, "total": "5289138" 
	  		page: payload.photos.page,
	  		pages: payload.photos.pages,
	  		perpage: payload.photos.perpage,
	  		total: payload.photos.total,
	  	};

	  	store.metaForType(type, meta);
	  	delete payload.photos.page, payload.photos.pages, payload.photos.perpage, payload.photos.total ;
  	}
  },
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

  		}else{
  			
  		}
  	}
  }
});

//Routes
App.Router.map(function(){
	this.route("index", {path:"/"});
	this.route("search", {path:"/photo"});
});

App.SearchRoute = Ember.Route.extend({
	model: function(){
		return this.store.all("photo") ;
	},

	setupController: function (controller, model) {
	    // Call _super for default behavior
	    this._super(controller, model);
	    // intialize newQuery to the current tags
	    controller.set("newQuery", controller.get("tags"));
	},
});

App.SearchController = Ember.ArrayController.extend({
	queryParams: ['tags'],
	tags: null,
	// photos: Ember.ArrayProxy.create(),
	newQuery: null,
	//page": 1, "pages": "52892", "perpage": 100, "total": "5289138" 
	page: null,
	pages: null,
	total: null ,
	actions: {
		/**
		Main entry to start a search with the given tags
		*/
		search: function(tags){
			if(tags){
	  			var queries = tags.split(" ");
	  			var Util = Ember.EnumerableUtils ;
	  			queries = Util.filter(queries, function(elem){
	  				return elem != ""; 
	  			});

  				// this.store.find('photo', {})
  				tags = queries.join(",");
  				var controller = this;
  				// Clear store
  				this.store.unloadAll('photo');
  				this.store.find("photo", {tags: tags}).then(function(photos){
  					// photos.forEach(function(item){
  					// 	controller.push(item);
  					// });
  					//controller.transitionToRoute("search");
  					var newMeta = controller.store.metadataFor("photo");
  					console.log(newMeta);
  					//controller.store.pushMany('photo', photos);
  				});
  				
	  		}else{
	  			
	  		}
		},
	},
});


// Models
var attr = DS.attr;
App.Photo = DS.Model.extend({
	//id: attr(),
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

App.Photos = DS.Model.extend({
	page: attr("number"),
	pages: attr("number"),
	perpage: attr("number"),
	total: attr("number"),
	photo: DS.hasMany("photo"),
});








