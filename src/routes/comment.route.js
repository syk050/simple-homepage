const express = require('express');
const router = express.Router();

const { isLoggedIn, checkCommentPermission, checkPostId } = require('../lib/auth');
const { writingComment, editComment, deleteComment } = require('../controller/comment.controller');

router.use(isLoggedIn);
router.use(checkPostId);

// Write
router.post('/', writingComment);

// Edit
router.put('/:id', checkCommentPermission, editComment);

// Delete
router.delete('/:id', checkCommentPermission, deleteComment);


module.exports = router;