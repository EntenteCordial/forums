const db = require('../database');
const bcrypt = require('bcrypt');
const saltRounds = 10;

class User {
	constructor({ username, password }){
		this.username = username;
		this.password = password;
		
		return this;
	}
	
	toJSON(){
		return {
			username: this.username,
			password: this.password
		};
	}
	
	toSendableJSON(){
		return {
			username: this.username
		};
	}
	
	// authentication functions
	comparePassword(password){
		return new Promise((resolve, reject)=>{
			bcrypt.compare(password, this.password, (error, value)=>{
				if(error) return reject(error);
				resolve(value);
			});
		});
	}
}

class UserCollection {
	constructor(){
		this.users = {};
	}
	
	get(username){
		return new Promise((resolve, reject)=>{
			if(this.users[username]){
				resolve(this.users[username]);
			} else {
				db.users.findOne({ username }, (error, value)=>{
					console.log(username, value)
					if(error){
						reject(error);
					} else if (value == null) {
						reject('Username does not exist.');
					} else {
						this.users[username] = new User(value);
						resolve(this.users[username]);
					}
				});
			}
		});
	}
	
	add({ username, password }){
		return new Promise((resolve, reject)=>{
			bcrypt.genSalt(saltRounds, (error, salt)=>{
				if(error) return reject(error);
				bcrypt.hash(password, salt, (err, hash)=>{
					const user = new User({ username, password: hash });
					db.users.insert(user.toJSON(), error=>{
						if(error){
							if(error.errorType === 'uniqueViolated') return reject('Username is already taken');
							return reject(error);
						} else {
							this.users[username] = user;
							resolve();
						}
					});
				});
			});
		});
	}
}

module.exports = User;
module.exports.collection = new UserCollection();