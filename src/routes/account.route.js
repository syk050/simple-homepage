const express = require('express');
const router = express.Router();

const { renderLogin, login, renderRegister, register, logout } = require('../controller/account.controller');


// Login
router.get('/login', renderLogin);
router.post('/login', login);


// Register
router.get('/register', renderRegister);
router.post('/register', register);

// Logout
router.get('/logout', logout);

module.exports = router;