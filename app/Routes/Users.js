const express = require('express');
var router = new express.Router();
const UsersController = require('../Controllers/Users');
const Middleware = require('../../services/Middleware');

// User Register
router.post('/users/register', async (req, res) => {
    let users = await new UsersController().register(req);
    return res.send(users);
});

// User Login
router.post('/users/login', async (req, res) => {
    let users = await new UsersController().login(req);
    return res.send(users);
});

// Create topics
router.post('/users/createtopic', Middleware.isAuth, async (req, res, next) => {
    let users = await new UsersController().createTopic(req);
    return res.send(users);
});

// Create topics
router.post('/users/createpost', Middleware.isAuth, async (req, res, next) => {
    let users = await new UsersController().createTopicPost(req);
    return res.send(users);
});

// Post's Comment
router.post('/users/commentonpost', Middleware.isAuth, async (req, res, next) => {
    let users = await new UsersController().commentOnPost(req);
    return res.send(users);
});

// Get all topics
router.get('/users/gettopics', Middleware.isAuth, async (req, res, next) => {
    let users = await new UsersController().getTopics(req);
    return res.send(users);
});

// get all post and comments for post
router.get('/users/gettopicposts', Middleware.isAuth, async (req, res, next) => {
    let users = await new UsersController().getTopicPosts(req);
    return res.send(users);
});

module.exports = router;