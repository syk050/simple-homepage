const express = require('express');
const router = express.Router();

const { renderIndex } = require('../controller/home.controller');

// home
router.get('/', renderIndex);

module.exports = router;