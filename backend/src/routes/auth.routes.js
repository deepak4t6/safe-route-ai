const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  addEmergencyContact,
  deleteEmergencyContact
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/contacts', authenticate, addEmergencyContact);
router.delete('/contacts/:contactId', authenticate, deleteEmergencyContact);

module.exports = router;
