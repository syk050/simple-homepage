const express = require('express');
const router = express.Router();

const { isLoggedIn, noPermission } = require('../lib/auth');
const { renderIndex, renderEditUser, editUser, deleteUser, renderUser } = require('../controller/user.controller');


router.use(isLoggedIn);

// List
router.get('/', renderIndex);

// Edit
router.get('/edit/:id', checkPermission, renderEditUser);
router.put('/edit/:id', checkPermission, editUser);

// Delete
router.delete('/delete/:id', checkPermission, deleteUser);

// Show
router.get('/:id', checkPermission, renderUser);

module.exports = router;

// router.use로 사용 불가
// /:id 거치지 않아 params를 읽지 못함
function checkPermission(req, res, next){
    console.log('userCtrl-checkPermission');

    console.log(req.params.id)
    console.log(req.user.id)
    if(req.params.id != req.user.id) return noPermission(req, res);
    
    next();
}