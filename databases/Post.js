const shortid = require('shortid');
const db = require('../database');

class Post {
	constructor(){
		this.db = db.posts;
	}
	
	jsonify({ text, author }){
		return {
			id: shortid.generate(),
			text, author,
			date: new Date(),
			replies: []
		};
	}
	
	listify(array){
		const A = (list)=>{
			return new Promise((resolve, reject)=>{
				this.db.find({ id: { $in: list } }).sort({ date:1 }).exec((error, posts)=>{
					if(posts.length){
						const promises = [];
						posts.forEach(post=>{
							promises.push(new Promise((resolve,reject)=>{
								A(post.replies).then(replies=>{
									post.replies = replies;
									resolve();
								}).catch(reject);
							}));
						});
						Promise.all(promises).then(()=>resolve(posts)).catch(reject);
					} else resolve(posts);
				});
			});
		}
		
		return A(array);
	}
	
	get(id){
		return new Promise((resolve, reject)=>{
			this.db.findOne({ id }, (error, value)=>{
				if(error){
					reject(error);
				} else {
					resolve(value);
				}
			});
		});
	}
	
	add(options){
		return new Promise((resolve, reject)=>{
			const json = this.jsonify(options);
			this.db.insert(json, error=>{
				if(error) {
					reject(error);
				} else {
					if(options.post) {
						this.db.update({ id: options.post },{ $push: {'replies': options.id} }, error=>{
							if(error){
								reject(error);
							} else {
								resolve();
							}
						});
					} else {
						db.channels.update({ name: options.channel },{ $push: {'posts': json.id} }, error=>{
							if(error){
								reject(error);
							} else {
								resolve();
							}
						});
					}
				}
			});
		});
	}
}

module.exports = new Post;