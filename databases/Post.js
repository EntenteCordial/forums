const shortid = require('shortid');
const db = require('../database');

class Post {
	constructor(){
		this.db = db.posts;
	}
	
	jsonify({ text, author, replies }){
		return {
			id: shortid.generate(),
			text, author,
			date: new Date(),
			replies
		};
	}
	
	listify(array){
		const A = (list)=>{
			return new Promise((resolve, reject)=>{
				this.db.find({ id: { $in: list } }).sort({ date:1 }).exec((error, posts)=>{
					if(posts.length){
						const promises = [];
						for(let post of posts){
							if(post.replies.length){
								((post)=>{
									promises.push(new Promise((resolve,reject)=>{
										A(post.replies).then(replies=>{
											post.replies = replies;
											resolve();
										}).catch(reject);
									}));
								})(post);
							}
						}
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
				//console.log('FOUND', value)
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
			db.posts.insert(this.jsonify(options), error=>{
				if(error) {
					reject(error);
				} else {
					if(options.post) {
						this.db.update({ id: options.post },{ $push: {'replies': post.id} }, error=>{
							if(error){
								reject(error);
							} else {
								resolve();
							}
						});
					} else {
						this.db.update({ name: options.channel },{ $push: {'posts': post.id} }, error=>{
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