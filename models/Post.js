const shortid = require('shortid');
const db = require('../database');

const POST_MENTION_REGEX = /^p\/(\w+)/;
const USER_MENTION_REGEX = /^u\/(\w+)/;

class Post {
	constructor({
		id=shortid.generate(),
		text, author, channel, replies=[],
		date=new Date()
	}){
		this.id = id;
		this.text = text;
		this.author = author;
		this.channel = channel;
		
		this.date = date;
		this.timestamp = date.getTime();
		
		this.replies = replies;
		this.repliesObj = null;
		
		return this;
	}
	
	toJSON(){
		return {
			id: this.id,
			text: this.text,
			author: this.author,
			date: this.date,
			replies: this.replies
		};
	}
}

class PostCollection {
	constructor(){
		this.posts = {};
	}
	
	get(id){
		return new Promise((resolve, reject)=>{
			if(this.posts[id]){
				resolve(this.posts[id]);
			} else {
				db.posts.findOne({ id }, (error, value)=>{
					//console.log('FOUND', value)
					if(error){
						reject(error);
					} else {
						this.posts[id] = new Post(value);
						resolve(this.posts[id]);
					}
				});
			}
		});
	}
	
	add(value){
		return new Promise((resolve, reject)=>{
			const post = new Post(value);
			db.posts.insert(post.toJSON(), error=>{
				this.posts[post.id] = post;
				if(error) {
					reject(error);
				} else {
					db.channels.update({ name: value.channel },{ $push: {'posts': post.id} }, error=>{
						if(error){
							reject(error);
						} else {
							const Channel = require('./Channel');
							Channel.collection.get(value.channel).posts.push(post.id);
							if(Channel.collection.get(value.channel).postsObj) Channel.collection.channels[value.channel].postsObj.push(post);
							resolve();
						}
					});
					/*if(POST_MENTION_REGEX.test(value.text)){
						const mention = value.text.match(value.text)[1];
						db.posts.update({ id: mention }, { $push: { replies: value.id } }, error=>{
							if(error) return reject(error);
							if(this.posts[value.id]){
								this.posts[value.id].repliesObj.push(post);
							}
						});
					} else {
						resolve();
					}*/
				}
			});
		});
	}
	
	// reduce fns from string replies array to posts
	reduce(array){ // post -> post with replies array filled; only works when loaded
		if(Array.isArray(array)) return array.map(value=>{ // replies array
			if(typeof value === 'string') return this.posts[value];
			return this.reduce(value);
		});
		return array.map(value=>{ // post
			if(value.replies.length) this.reduce(value.replies);
			return value;
		});
	}
	
	reducePost(replies){
		const array = replies.slice(0);
		const promises = [];
		let current = null;
		while(current = array.pop()){
			(current=>promises.push( // promise to load all of replies
				new Promise((resolve, reject)=>{
					//console.log('PROMISE',current);
					this.get(current).then(post=>{
						//console.log(post);
						if(post.replies.length) array.push(...post.replies);
						resolve(post);
					}).catch(reject);
				})
			))(current);
		}
		return new Promise((resolve, reject)=>{
			
			Promise.all(promises).then(()=>resolve(this.reduce(replies))).catch(reject);
		});
	}
}

module.exports = Post;
module.exports.collection = new PostCollection();