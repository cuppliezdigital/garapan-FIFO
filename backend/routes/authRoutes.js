const express = require('express');

const authController = require('../controllers/authController');
const { authMiddleware, requireRole, requirePermission } = require('../middleware/auth');
const { PERMISSION_KEYS } = require('../services/permissionsService');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);

router.get('/users', authMiddleware, requirePermission(PERMISSION_KEYS.MANAGE_USERS), authController.getUsers);
router.patch('/users/:id/status', authMiddleware, requirePermission(PERMISSION_KEYS.MANAGE_USERS), authController.toggleUserStatus);
router.delete('/users/:id', authMiddleware, requirePermission(PERMISSION_KEYS.MANAGE_USERS), authController.deleteUser);

router.get('/users/:id/permissions', authMiddleware, requirePermission(PERMISSION_KEYS.ACCESS_CONFIG), authController.getUserPermissions);
router.put('/users/:id/permissions', authMiddleware, requirePermission(PERMISSION_KEYS.ACCESS_CONFIG), authController.updateUserPermissions);
router.patch('/users/:id/role', authMiddleware, requirePermission(PERMISSION_KEYS.ACCESS_CONFIG), authController.changeUserRole);

router.get('/permissions/catalog', authMiddleware, requirePermission(PERMISSION_KEYS.ACCESS_CONFIG), authController.getPermissionCatalog);

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user, permissions: req.permissions || [] });
});

module.exports = router;
