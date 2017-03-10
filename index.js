const express = require('express');
const localtunnel = require('localtunnel');
const bodyParser = require('body-parser');
const session = require('express-session');

const apiRouter = require('./routers/ApiRouter.js');
const login = require('./login');
const db = require('./database');

const app = express();

// serve static files
app.use(session({ secret: 'secret' }));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(__dirname + '/public'));

// serve rest api
app.use('/api', apiRouter);

db.load().then(()=>{
	console.log(`Databases loaded`);
	
	app.listen(login.port, ()=>{
		console.log(`Express connected to port ${login.port}`);
		/*
		// localtunnel tunnelling
		localtunnel(login.port, { subdomain: login.subdomain }, (err,tunnel)=>{
			if(err) { console.log(err); process.exit(); }
			else console.log(`localtunnel connected to url ${tunnel.url}`);
		});*/
	});

}).catch(console.error);
