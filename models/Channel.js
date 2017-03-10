const Post = require('./Post');
const db = require('../database');

class Channel {
	constructor({ name, posts }){
		this.name = name;
		this.posts = posts;
		this.postsObj = null;
	}
	
	toJSON(){
		return {
			name: this.name,
			posts: this.posts
		};
	}
	
	toSendableJSON(){
		return {
			name: this.name,
			posts: this.postsObj
		};
	}
	
	// posts to channel
	addPost(options, fn){
	}
	
	getPost(id, fn){
	}
	
	loadPosts(){
		return new Promise((resolve, reject)=>{
			if(this.postsObj != null){
				resolve();
			} else {
				Post.collection.reducePost(this.posts).then(postsObj=>{
					this.postsObj = postsObj;
					resolve(postsObj);
				}).catch(reject);
			}
		});
	}
}

class ChannelCollection {
	constructor(){
		this.channels = {};
		this.loaded = false;
	}
	
	load(){
		return new Promise((resolve, reject)=>{
			if(this.loaded){
				resolve();
			} else {
				db.channels.find({},(error, channels)=>{
					if(error){
						reject(error);
					} else {
						channels.forEach(channel=>{
							this.channels[channel.name] = new Channel(channel);
						});
						this.loaded = true;
						resolve();
					}
				});
			}
		});
	}
	
	get(channel){
		const c = this.channels[channel];
		if(c == null){
			return 'Channel does not exist';
		} else {
			return c;
		}
	}
	
	add(options){
		return new Promise((resolve, reject)=>{
			if(this.channels[options.name]){
				reject('Channel name must be unique.');
			} else {
				const channel = new Channel(options);
				channels.put(options.name, channel.toJSON(), error=>{
					if(error){
						reject(error);
					} else {
						this.channels[options.name] = channel;
						this.updateChannelList(error=>{
							if(error) reject(error);
							else resolve(channel);
						});
					}
				});
			}
		});
	}
}

module.exports = Channel;
module.exports.collection = new ChannelCollection();