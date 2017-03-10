(function(){

// -----------------------------------
// FORMAT DATES
// -----------------------------------
function formatDate(date){
	return date.getDate()+'/'+date.getMonth()+'/'+date.getFullYear()+' '+date.getHours()+':'+date.getMinutes();
}

// -----------------------------------
// USER
// -----------------------------------
var User = Backbone.Model.extend({
	defaults: {
		username: ''
	}
});

// -----------------------------------
// USER COLLECTION
// -----------------------------------
var UserCollection = Backbone.Collection.extend({
	model: User,
	idAttribute: 'username',
	url: '/api/users'
});

// -----------------------------------
// USER SESSION
// -----------------------------------
var Session = Backbone.Model.extend({
	
	defaults: {
		loggedIn: false
	},
	
	url: '/api',
	
	initialize: function(){
		this.user = new User({});
	},
	
	authenticate: function(method, username, password, fn){
		var self = this;
		$.ajax({
			url: this.url + '/' + method,
			method: 'POST',
			data: {
				username: username,
				password: password
			}
		}).done(function(data){
			console.log(data);
			if(typeof data === 'string'){
				return fn(data);
			} else {
				self.set('loggedIn', true);
				self.user.set('username', username);
				App.trigger('loggedIn');
				return fn();
			}
		}).fail(function(error){
			console.log(error);
			return fn(error);
		});
	},
	
	login: function(username, password, fn){
		return this.authenticate('login', username, password, fn);
	},
	
	signup: function(username, password, fn){
		return this.authenticate('signup', username, password, fn);
	},
	
	logout: function(fn){
		var self = this;
		$.ajax({
			url: '/api/logout'
		}).done(function(){
			self.set('loggedIn', false);
			self.user.set({ username: '' });
			App.trigger('loggedOut');
			return fn();
		});
	}
	
});

// -----------------------------------
// POST
// -----------------------------------
var Post = Backbone.Model.extend({
	defaults: {
		id: '',
		text: '',
		author: '',
		date: '',
		replies: []
	},
	url: '/api/posts',
	
	initialize: function(){
		this.date = new Date(this.get('date'));
		this.replies = new PostCollection(this.get('replies'));
	},
	
	parse: function(response){
	}
});

// -----------------------------------
// POST COLLECTION
// -----------------------------------
var PostCollection = Backbone.Collection.extend({
	model: Post,
	
	initialize: function(){
	}
});

// -----------------------------------
// POST VIEW
// -----------------------------------
var PostView = Backbone.View.extend({
	tagName: 'div',
	className: 'post',
	
	events: {
		'click .author': 'noop',
		'click .delete': 'noop',
		'click .hide': 'noop',
		'click .flag': 'noop',
		'click .edit': 'noop',
		'click .reply': 'onClickReply',
	},
	
	initialize: function(){
		this.isReplyShow = false;
		this.replies = new PostsView({ collection: this.model.replies });
		this.listenTo(this.model, 'change', this.update);
	},
	
	render: function(){
		this.$el.html(
		"<p class='text'>" + this.model.get('text') + "</p>" +
		"<ul class='buttons'>" +
			"<li class='author'><a href='#'>" + this.model.get('author') + "</a></li>" +
			"<li class='time'><time datetime='" + this.model.get('date') + "'>" + formatDate(this.model.date) + "</a></li>" +
			"<li class='permalink'><a href='" + '#' + "'>permalink</a></li>" +
			"<li class='edit'><a href='#'>edit</a></li>" +
			"<li class='delete'><a href='#'>delete</a></li>" +
			"<li class='hide'><a href='#'>hide</a></li>" +
			"<li class='flag'><a href='#'>flag</a></li>" +
			"<li class='reply'><a href='#'>reply</a></li>" +
		"</ul>" +
		"<div class='replyArea' style='display:none'>" +
			"<textarea></textarea>" +
			"<button>Submit</button>" +
		"</div>" +
		"<div class='replies'></div>"
		);
		this.replies.setElement(this.$('.replies'));
		this.replies.render();
		return this;
	},
	
	update: function(){
		this.$el.find('.text').text(this.model.get('text'));
		return this;
	},
	
	noop: function(){},
	
	onClickReply: function(e){
		e.stopPropagation();
		this.$el.children('.replyArea').slideToggle();
	}
});

// -----------------------------------
// POSTS VIEW
// -----------------------------------
var PostsView = Backbone.View.extend({
	tagName: 'div',
	
	initialize: function(){
	},
	
	// events
	addEvents: function(){
		this.collection.on('add', this.add, this);
	},
	
	removeEvents: function(){
		this.collection.off('add', this.add, this);
	},
	
	// rendering
	render: function(){
		this.$el.empty();
		this.collection.each(function(post){
			this.$el.append(new PostView({ model: post }).render().el);
		}, this);
		return this;
	},
	
	add: function(post){
		this.$el.append(new PostView({ model: post }).render().el);
		this.$el.scrollTop(this.$el.prop('scrollHeight'));
	}
});

// -----------------------------------
// CHANNEL
// -----------------------------------
var Channel = Backbone.Model.extend({
	defaults: {
		name: '',
		posts: []
	},
	idAttribute: 'name',
	urlRoot: '/api/channels',
	
	initialize: function(){
		//console.log('IN')
		this.posts = new PostCollection();
	},
	
	parse: function(response, options){
		this.set('name', response.name);
		this.set('posts', response.posts);
		//console.log(this.posts)
		this.posts.set(response.posts);
	}
});

// -----------------------------------
// CHANNEL COLLECTION
// -----------------------------------
var ChannelCollection = Backbone.Collection.extend({
	model: Channel,
	url: '/api/channels',
	
	initialize: function(){
	},
	
	parse: function(response, options){
		return _.map(response, function(channel){
			return new Channel(channel);
		});
	}
});

// -----------------------------------
// CHANNEL VIEW
// -----------------------------------'
var ChannelView = Backbone.View.extend({
	el: '#channelTab',
	
	initialize: function(){
		var self = this;
		
		this.model = null;
		this.postsView = new PostsView({ el: '#posts' });
		
		this.collection.fetch({
			success: function(){
				//console.log(self.collection)
				self.collection.get(App.currentChannel).fetch({
					success: function(model){
						self.postsView.collection = model.posts;
						self.postsView.addEvents();
						self.render();
					}
				});
			}
		});
	},
	
	changeChannel: function(channel){
		var self = this;
		this.postsView.removeEvents();
		App.currentChannel = channel;
		this.collection.get(channel).fetch({
			success: function(model){
				self.postsView.collection = model.posts;
				self.postsView.addEvents();
				self.render();
				sel.addEvents();
			}
		});
	},
	
	render: function(){
		this.model = this.collection.get(App.currentChannel);
		
		this.$('#title').text(this.model.get('name'));
		this.postsView.render();
		
		//this.collection.get(this.currentChannel).off('reset', this.render, this); // fire only once
		
		return this;
	},
	
	update: function(){
		
	}
});

// -----------------------------------
// APP VIEW
// -----------------------------------
var AppView = Backbone.View.extend({
	el: '#wrapper',
	
	events: {
		'submit #loginForm': 'onSubmitLogin',
		'submit #signupForm': 'onSubmitSignup',
		'click #postAreaBtn': 'onClickSave',
		'click #newPostBtn': 'onClickNewPost',
	},
	
	initialize: function(){
		this.channelView = new ChannelView({ collection: App.channels });
		this.channelsView = null; // TODO implement
		
		this.tab = 'channel';
		$('#loginTab, #signupTab').hide();
		
		$(window).on('resize', _.bind(this.onResize, this));
		App.on('loggedIn', this.onLoggedIn, this);
		App.on('loggedOut', this.onLoggedOut, this);
		App.on('saveSuccess', this.onSaveSuccess, this);
		App.on('saveError', this.onSaveError, this);
		
		this.isPostAreaShow = false;
		this.willPostAreaShow = false;
		$('#postAreaContainer').css('left','-9999px');
		
		this.onResize();
		this.onLoggedOut();
	},
	
	// change stuff
	changeTab: function(tab){
		if(tab === this.tab) return;
		$('#'+this.tab+'Tab').slideUp(function(){
			$('#'+tab+'Tab').slideDown();
		});
		this.tab = tab;
	},
	
	changeTopBar: function(){
		if(App.session.get('loggedIn')){
			$('#topbar').html(
				"<li><a href='#channel' id='front'>FRONT</a></li>" +
				"<li><a href='#mail' id='login'>MAIL</a></li>" +
				"<li><a href='#logout' id='signup'>LOG OUT</a></li>"
			);
		} else {
			$('#topbar').html(
				"<li><a href='#channel'>FRONT</a></li>" +
				"<li><a href='#login'>LOGIN</a></li>" +
				"<li><a href='#signup'>SIGN UP</a></li>"
			);
		}
	},
	
	addBeforeText:function(text){
		if(!$('#postArea').prop('disabled')) $('#postArea').text(text + $('#postArea').text());
	},
	
	// authenticate
	onSubmitLogin: function(e){
		e.preventDefault();
		
		var self = this;
		var username = $('#loginForm input[name=username]').val();
		var password = $('#loginForm input[name=password]').val();
		App.session.login(username, password, function(error){
			if(error){
				$('#loginError').html(error);
			}
		});
	},
	
	onSubmitSignup: function(e){
		e.preventDefault();
		
		var self = this;
		var username = $('#signupForm input[name=username]').val();
		var password = $('#signupForm input[name=password]').val();
		App.session.signup(username, password, function(error){
			if(error){
				$('#signupError').html(error);
			}
		});
	},
	
	// posts height
	getPostsHeight: function(){
		if(this.isPostAreaShow) return $(window).height()-170;
		else return $(window).height()-65;
	},
	
	// resize window
	onResize: function(e){
		$('#posts').css('max-height', this.getPostsHeight());
	},
	
	// authentication
	onLoggedOut: function(){
		this.changeTopBar();
		$('#postArea').text('').prop('disabled', true);
	},
	
	onLoggedIn: function(){
		App.router.navigate('channel', {trigger: true});
		this.changeTopBar();
		$('#postArea').prop('disabled', false);
		if(this.willPostAreaShow){
			this.willPostAreaShow = false;
			this.togglePostArea();
		}
	},
	
	// save posts
	onClickSave: function(){
		App.addPost($('#postArea').val());
	},
	
	onSaveSuccess: function(){
		$('#postArea').text('');
	},
	
	onSaveError: function(e){
		console.log('ERROR!',e);
	},
	
	// post area
	togglePostArea: function(){
		if(this.isPostAreaShow){
			$('#postAreaContainer').animate({'left':'-9999px'}, 350);
			this.isPostAreaShow = false;
		} else {
			$('#postAreaContainer').animate({'left':0}, 350);
			this.isPostAreaShow = true;
		}
		$('#posts').animate({'height':this.getPostsHeight()}, 350);
	},
	
	onClickNewPost: function(){
		if(!App.session.get('loggedIn')){
			App.router.navigate('login', {trigger:true});
			this.willPostAreaShow = true;
		} else {
			this.togglePostArea();
		}
	}
});

// -----------------------------------
// APP ROUTER
// -----------------------------------
var AppRouter = Backbone.Router.extend({
	
	routes: {
		'channel': 'channel',
		'login': 'login',
		'signup': 'signup',
		'logout': 'logout'
	},

	channel: function(){ App.view.changeTab('channel'); },
	login: function(){ App.view.changeTab('login'); },
	signup: function(){ App.view.changeTab('signup'); },
	logout: function(){
		App.session.logout(function(){
			App.view.changeTab('channel');
		});
	}
	
});

// -----------------------------------
// APP
// -----------------------------------
var App = _.extend({
	
	initialize: function(){
		this.currentChannel = 'general';
		
		this.session = new Session();
		this.users = new UserCollection();
		this.channels = new ChannelCollection();
		
		this.listenToOnce(this.channels, 'sync', this.update);
		
		this.view = new AppView();
		
		this.router = new AppRouter();
		Backbone.history.start();
	},
	
	// post from textarea
	addPost: function(text){
		new Post({
			text: text,
			author: this.session.user.get('username'),
			channel: this.currentChannel
		}).save({
			success: function(data){
				if(typeof data === 'string') App.trigger('saveError',e);
				else App.trigger('saveSuccess');
			},
			error: function(e){
				console.log(e);
				App.trigger('saveError', e);
			}
		});
	},
	
	// update collections
	update: function(){
		//console.log('UPDATE')
		App.channels.get(App.currentChannel).fetch();
		setTimeout(App.update, 500);
	}
	
}, Backbone.Events);

App.initialize();
window.App = App;

})();