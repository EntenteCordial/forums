const nedb = require('nedb');
const db = {
	users: new nedb({ filename: './users.db' }),
	posts: new nedb({ filename: './posts.db' }),
	channels: new nedb({ filename: './channels.db' }),
};

const promises = [];

for(let i in db){
	((i)=>{
		promises.push(new Promise((resolve, reject)=>{
			db[i].loadDatabase(error=>{
				if(error) reject(error);
				else resolve();
			});
		}));
	})(i);
}

module.exports = db;

module.exports.load = ()=>{
	return Promise.all(promises);
};