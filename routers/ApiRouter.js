const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Channel = require('../models/Channel');

const router = express.Router();

// user
router.get(/^\/users\/(\w+)$/, (req, res, next)=>{
	User.collection.get(req.params[0]).then(user=>{
		res.json(user.toSendableJSON());
	}).catch(error=>res.send(error));
});

router.get('/users/',(req, res, next)=>{
});

// post
router.get(/^\/posts\/(\w+)$/, (req, res, next)=>{
});

router.put('/posts/',(req, res, next)=>{
	console.log('PUT POST',req.body)
	if(!req.body.text) return res.send('Text not specified');
	if(!req.body.author) return res.send('Author not specified');
	if(!req.body.channel) return res.send('Channel not specified');
	Post.collection.add({
		text: req.body.text,
		author: req.body.author,
		channel: req.body.channel
	}).then(()=>{
		console.log('TRUE');
		res.json(true);
	}).catch(error=>{
		console.log('FALSE');
		res.send(error)
	});
});

// channels
router.get(/^\/channels\/(\w+)$/, (req, res, next)=>{
	const channel = Channel.collection.get(req.params[0]);
	channel.loadPosts().then(()=>{
		//console.log(channel.toJSON());
		res.json(channel.toSendableJSON());
	}).catch(error=>res.send(error));
});

router.get('/channels/', (req, res, next)=>{
	console.log(Channel.collection.channels);
	res.json(Object.keys(Channel.collection.channels));
});

router.post('/channels/',(req, res, next)=>{
});

// login / signup
router.post('/signup/', (req, res, next)=>{
	if(!req.body.username) return res.send('Username not specified');
	else if (!req.body.password) return res.send('Password not specified');
	User.add({
		username: req.body.username,
		password: req.body.password
	}).then(()=>res.json(true)).catch(error=>res.send(error));
});

router.post('/login/', (req, res, next)=>{
	User.collection.get(req.body.username).then(user=>{
		user.comparePassword(req.body.password).then(value=>{
			if(value) {
				req.session.user = req.body.username;
				res.json(true);
			} else {
				res.send('Password is incorrect.');
			}
		}).catch(error=>res.send(error));
	}).catch(error=>res.send(error));
});

router.get('/logout/', (req, res, next)=>{
	delete req.session.user;
	res.json(true);
});

module.exports = router;