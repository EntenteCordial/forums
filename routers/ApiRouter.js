const express = require('express');
const User = require('../databases/User');
const Post = require('../databases/Post');
const Channel = require('../databases/Channel');

const router = express.Router();

// user
router.get(/^\/users\/(\w+)$/, (req, res, next)=>{
	User.get(req.params[0]).then(user=>res.json(user)).catch(error=>res.send(error));
});

router.get('/users/',(req, res, next)=>{
});

// post
router.get(/^\/posts\/(\w+)$/, (req, res, next)=>{
});

router.put('/posts/',(req, res, next)=>{
	//console.log(!req.body.channel, !req.body.post)
	if(!req.body.text) return res.send('Text not specified');
	if(!req.body.author) return res.send('Author not specified');
	if(!req.body.channel) {
		if(!req.body.post){
			return res.send('Reply not specified');
		}
		return res.send('Channel not specified');
	}
	
	Post.add({
		text: req.body.text,
		author: req.body.author,
		channel: req.body.channel,
		post: req.body.post
	}).then(()=>{
		res.json(true)
	}).catch(error=>{
		res.send(error)
	});
});

// channels
router.get(/^\/channels\/(\w+)$/, (req, res, next)=>{
	Channel.get(req.params[0]).then(channel=>{
		Post.listify(channel.posts).then(replies=>{
			channel.posts = replies;
			res.json(channel);
		}).catch(error=>{
			res.send(error)
		});
	}).catch(error=>{
		res.send(error)
	});
});

router.get('/channels/', (req, res, next)=>{
	Channel.list().then(list=>res.json(list.map(channel=>({ name: channel.name })))).catch(error=>res.send(error));
});

router.put('/channels/',(req, res, next)=>{
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
	User.comparePassword(req.body.username, req.body.password).then(value=>{
		if(value) {
			req.session.user = req.body.username;
			res.json(true);
		} else {
			res.send('Password is incorrect.');
		}
	}).catch(error=>res.send(error));
});

router.get('/logout/', (req, res, next)=>{
	delete req.session.user;
	res.json(true);
});

module.exports = router;