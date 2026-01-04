import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  searchUsers
} from '../controllers/authController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

// ===== RUTAS PÚBLICAS (sin autenticación) =====
router.post('/register', registerUser);
router.post('/login', loginUser);

// ===== RUTAS PROTEGIDAS (requieren autenticación) =====
router.post('/logout', verifyToken, logoutUser);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/password', verifyToken, changePassword);
router.delete('/account', verifyToken, deleteAccount);
router.get('/search', verifyToken, searchUsers);

export default router;