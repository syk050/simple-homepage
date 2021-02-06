const express = require('express');
const router = express.Router();

const { isLoggedIn, checkBoardPermission } = require('../lib/auth');
const { renderIndex, renderWritingBoard, writingBoard, renderEditBoard, editBoard, deleteBoard, renderBoard } = require('../controller/board.controller');


// List
router.get('/', renderIndex);

// Writing
router.get('/writing', isLoggedIn, renderWritingBoard);
router.post('/writing', isLoggedIn, writingBoard);

// Edit
router.get('/edit/:id', isLoggedIn, checkBoardPermission, renderEditBoard);
router.put('/edit/:id', isLoggedIn, checkBoardPermission, editBoard);

// Delete
router.get('/delete/:id', isLoggedIn, checkBoardPermission, deleteBoard);

// Show
router.get('/:id', renderBoard);

module.exports = router;