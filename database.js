const nedb = require('nedb');
const db = {
	users: new nedb({ filename: './users.db' }),
	posts: new nedb({ filename: './posts.db' }),
	channels: new nedb({ filename: './channels.db' }),
};

for(let i in db){
	db[i].loadDatabase(error=>{
		if(error){
			console.error(error);
			process.exit();
		} else {
			console.log('Connected to nedb database:', i);
		}
	});
}

// validation
db.users.ensureIndex({ fieldName: 'username', unique: true }, console.error);
db.channels.ensureIndex({ fieldName: 'name', unique: true }, console.error);

module.exports = db;