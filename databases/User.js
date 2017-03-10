const db = require('../database');
const bcrypt = require('bcrypt');
const saltRounds = 10;

class User {
	constructor(){
		this.db = db.users;
		this.db.ensureIndex({ fieldName: 'username', unique: true }, console.error);
	}
	
	jsonify({ username, password }){
		return {
			username, password
		};
	}
	
	comparePassword(username, password){
		return new Promise((resolve, reject)=>{
			this.get(username).then(user=>{
				bcrypt.compare(password, user.password, (error, value)=>{
					if(error) return reject(error);
					resolve(value);
				});
			}).catch(reject);
		});
	}
	
	get(username){
		return new Promise((resolve, reject)=>{
			this.db.findOne({ username }, (error, user)=>{
				if(error) {
					reject(error);
				} else if(user == null) {
					reject('Username does not exist.');
				} else {
					resolve(user);
				}
			});
		});
	}
	
	add({ username, password }){
		return new Promise((resolve, reject)=>{
			bcrypt.genSalt(saltRounds, (error, salt)=>{
				if(error) return reject(error);
				bcrypt.hash(password, salt, (err, hash)=>{
					db.users.insert({
						username: username,
						password: hash
					}, error=>{
						if(error){
							if(error.errorType === 'uniqueViolated') return reject('Username is already taken');
							return reject(error);
						} else {
							resolve();
						}
					});
				});
			});
		});
	}
}

module.exports = new User;