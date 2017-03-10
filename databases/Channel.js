const db = require('../database');

class Channel {
	constructor(){
		this.db = db.channels;
		this.db.ensureIndex({ fieldName: 'name', unique: true }, console.error);
	}
	
	jsonify({ name, posts }){
		return {
			name, posts
		};
	}
	
	add(options){
		return new Promise((resolve, reject)=>{
			this.db.insert(options, error=>{
				if(error){
					if(error.errorType === 'uniqueViolated') reject('Channel name must be unique.');
					else reject(error);
				} else {
					resolve();
				}
			});
		});
	}
	
	get(name){
		return new Promise((resolve, reject)=>{
			this.db.findOne({ name },(error, channel)=>{
				if(error){
					reject(error);
				} else {
					resolve(channel);
				}
			});
		});
	}
	
	list(){
		return new Promise((resolve, reject)=>{
			this.db.find({},(error,channels)=>{
				if(error){
					reject(error);
				} else {
					resolve(channels);
				}
			});
		});
	}
}

module.exports = new Channel;