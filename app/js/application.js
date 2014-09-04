window.App = Ember.Application.create({
	apiKey: "dc5ee141168cf58790d6e8dc3f6c0a46",
});

//App.Store
//https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=c72d785e4696909f6a8a042a0d84b35b&tags=cat&format=json&nojsoncallback=1&api_sig=2a8499223de96343d4dbe8acd7b78730
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
		// Transform "cat dog" to "cat,dog" for API request payload
		var queries = query.tags.split(" ");
	  	var Util = Ember.EnumerableUtils ;
  		queries = Util.filter(queries, function(elem){
  				return elem != ""; 
  		});
		// this.store.find('photo', {})
		var tags = queries.join(",");

	    return new Ember.RSVP.Promise(function(resolve, reject) {
	    	
	    	jQuery.ajax({
		      	url: url,
		      	dataType: "jsonp",
		  	    jsonp: "jsoncallback",
		  	    crossDomain: true,
		  	    data: {
		      		tags: tags, // expecting format tags=cat,dog
		      		page: query.page,
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

//Routes
App.Router.map(function(){
	this.route("search", {path:"/photo"});
});

App.SearchRoute = Ember.Route.extend({
	// renderTemplate: function() {
 //    	this.render({ outlet: 'search' });
 //  	},
	model: function(){
		return this.store.all("photo") ;
	},
	setupController: function(controller, model){
		this._super(controller, model);

		controller.set("newQuery", controller.get("tags"));
		controller.set("newPage", controller.get("page"));
	}
});

// Controllers
App.IndexController = Ember.Controller.extend({
	query: "",
	user: null,
	actions:{
	  	search: function(query){
	  		var query = this.get("query");
	  		if(query){
	  			this.transitionToRoute("search", {
	  				queryParams: {
	  					tags: query,
	  				}
	  			});
	  		}else{
	  			
	  		}
	  	}
	},
	init: function(){
		this._super();
		var controller = this ;
		this.store.find("user").then(function(users){
			if(users && users.objectAt(0)){
				var user =  users.objectAt(0);
				if(user && user.id){
					controller.set("user", user);
				}
				
			}
		});
	},
});

App.UserController = Ember.ObjectController.extend({
	userId: function(){
		var user = this.get("model");
		if(user){
			return user.id;
		}
		return null ;
		
	}.property("model"),

	profile: function(){
		var user = this.get("model");
		if(user){
			return "https://www.flickr.com/photos/" + this.get("model").id ;
		}else{
			return "https://www.flickr.com/images/buddyicon.gif" ;
		}
		
	}.property("model"),
	actions: {
		login: function(){
			var user = this.get("model");
			if(!user || !user.id){
				window.location = "/oauth/flickr";
			}
			
		},
		goProfile:function(){
			window.location = this.get("profile");
		},
		logout: function(){
			var user = this.get("model");
			if(user && user.id){
				user.deleteRecord();
				user.save();
				this.set("model", null);
			}
		},
	},
});

App.SearchController = Ember.ArrayController.extend({
	queryParams: ["tags", "page"],
	tags: "",
	// photos: Ember.ArrayProxy.create(),
	newQuery: "",
	//page": 1, "pages": "52892", "perpage": 100, "total": "5289138" 
	page: 1,
	newPage: 1,
	pages: 0,
	total: 0 ,
	showPagination: false,

	user: null, //logined user

	watchParams: function(){
		Ember.run.once(this, 'reload');
	}.observes("tags", "page"),
	// Trigger a reload when params changes
	reload: function(){
		var tags = this.get("tags");
		var page = this.get("page");
		if(tags){
			var controller = this;
			var user = this.get("user");
			var payload = {tags: tags, page: page} ;

			if(user && user.token){
				payload.auth_token = token ;
			}
			// Clear store
			this.set("showPagination", false);
			this.store.unloadAll('photo');
			this.store.find("photo", payload).then(function(photos){
				var newMeta = controller.store.metadataFor("photo");
				// console.log(newMeta);
				controller.set("page", newMeta.page);
				controller.set("pages", newMeta.pages);
				controller.set("total", newMeta.total);
				controller.set("showPagination", newMeta.pages > 0);
			});
		}else{
			//
			this.set("showPagination", false);
			this.store.unloadAll('photo');
		}
	},
	//returns an array of possible pages
	paginations: function(){
		var page = this.get("page");
		var pages = this.get("pages");
		var ret = []
		var start = null, end = null;
		if(page <= 5){
			start = 1 ;
			end = Math.min(pages, start + 10);
		}else if(page >= pages - 5){
			end = pages ;
			start = Math.max(1, end - 10);
		}

		if(!start) start = page - 5;
		if(!end) end = page + 5 ;

		return this.getRange(start, end, page);

	}.property("page", "pages"),

	prevPage: function(){
		var page = this.get("page");
		return {
			index: Math.max(1, page - 1),
			class: page == 1 ? "disabled": "",
		};

	}.property("page"),

	nextPage: function(){
		var page = this.get("page");
		var pages = this.get("pages") ;
		return {
			index: Math.min(pages, page + 1),
			class: page == pages ? "disabled": "",
		};

	}.property("page"),

	getRange: function(start, end, current){
		var ret = [];
		for(var i = start; i <= end; i ++){
			var obj = {
				index: i,
				class: ""
			};
			
			if(i == current){
				obj.class = "active" ;
			}
			ret.push(obj);
		}
		return ret ;
	},
	init: function(){
		this._super();
		var controller = this ;
		this.store.find("user").then(function(users){
			if(users && users.objectAt(0)){
				controller.set("user", users.objectAt(0));
			}
		});
	},

	actions: {
		search: function(){
			this.set("tags", this.get("newQuery"));
			this.set("newPage", 1);
			this.set("page", 1);
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
		return "https://farm" + this.get("farm") + ".staticflickr.com/" + this.get("server") + "/" + this.get("id")+ "_" + this.get("secret") + "_z.jpg" ;
	}.property("id", "secret", "server", "farm"),

	srcUrlThumbnail: function(){
		return "https://farm" + this.get("farm") + ".staticflickr.com/" + this.get("server") + "/" + this.get("id")+ "_" + this.get("secret") + "_q.jpg" ;
	}.property("id", "secret", "server", "farm"),

//https://www.flickr.com/photos/{user-id}/{photo-id} - individual photo
	profileUrl: function(){
		return "https://www.flickr.com/photos/" + this.get("owner") + "/" + this.get("id") + "/";
	}.property("id", "owner"),

	shortenTitle: function(){
		var title = this.get("title");
		if(title){
			title = title.replace("\n", "");
			return this.cutoff(title, 45);
		}else{
			return "" ;
		}
	}.property("title"),

	cutoff: function(str, count){
		if(str && str.length > count){
			var nextSpace = str.indexOf(" ", count - 15);
			if(nextSpace > 1 && nextSpace < count){
				return str.substring(0, nextSpace) + "...";
			}else{
				return str.substring(0, count) + "...";
			}
		}
		return str;
	},
});

App.Photos = DS.Model.extend({
	page: attr("number"),
	pages: attr("number"),
	perpage: attr("number"),
	total: attr("number"),
	photo: DS.hasMany("photo"),
});

App.User = DS.Model.extend({
	displayName: attr(),
	fullName: attr(),
	token: attr(),
});








