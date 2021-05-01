const express = require('express');
var router = new express.Router();
const UsersController = require('../Controllers/Users');

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

module.exports = router;