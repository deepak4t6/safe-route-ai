const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const { inMemoryStore, query, usePostgres } = require('../config/db');

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role = 'user', preferred_mode = 'walking' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check existing
    const existing = inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = {
      id: 'usr-' + Date.now(),
      name,
      email: email.toLowerCase(),
      password_hash,
      phone: phone || '',
      role: role || 'user',
      preferred_mode: preferred_mode || 'walking',
      safety_pref_avoid_dark: true,
      safety_pref_avoid_isolated: true,
      safety_pref_prefer_cctv: true,
      safety_pref_prefer_main_roads: true,
      created_at: new Date().toISOString()
    };

    inMemoryStore.users.push(newUser);

    const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });

    const safeUser = { ...newUser };
    delete safeUser.password_hash;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const safeUser = { ...user };
    delete safeUser.password_hash;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user;
    const contacts = inMemoryStore.emergency_contacts.filter(c => c.user_id === user.id);
    const safeUser = { ...user, emergency_contacts: contacts };
    delete safeUser.password_hash;

    res.json({
      success: true,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, phone, preferred_mode, safety_pref_avoid_dark, safety_pref_avoid_isolated, safety_pref_prefer_cctv, safety_pref_prefer_main_roads } = req.body;

    const userIndex = inMemoryStore.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      if (name) inMemoryStore.users[userIndex].name = name;
      if (phone !== undefined) inMemoryStore.users[userIndex].phone = phone;
      if (preferred_mode) inMemoryStore.users[userIndex].preferred_mode = preferred_mode;
      if (safety_pref_avoid_dark !== undefined) inMemoryStore.users[userIndex].safety_pref_avoid_dark = safety_pref_avoid_dark;
      if (safety_pref_avoid_isolated !== undefined) inMemoryStore.users[userIndex].safety_pref_avoid_isolated = safety_pref_avoid_isolated;
      if (safety_pref_prefer_cctv !== undefined) inMemoryStore.users[userIndex].safety_pref_prefer_cctv = safety_pref_prefer_cctv;
      if (safety_pref_prefer_main_roads !== undefined) inMemoryStore.users[userIndex].safety_pref_prefer_main_roads = safety_pref_prefer_main_roads;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: inMemoryStore.users[userIndex]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Profile update failed', error: err.message });
  }
};

const addEmergencyContact = async (req, res) => {
  try {
    const { name, phone, relationship = 'Friend' } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Contact name and phone number are required' });
    }

    const contact = {
      id: 'ec-' + Date.now(),
      user_id: req.user.id,
      name,
      phone,
      relationship,
      notify_on_trip_start: true,
      notify_on_sos: true
    };

    inMemoryStore.emergency_contacts.push(contact);

    res.status(201).json({
      success: true,
      message: 'Emergency contact added',
      contact
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not add contact', error: err.message });
  }
};

const deleteEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const initialLen = inMemoryStore.emergency_contacts.length;
    inMemoryStore.emergency_contacts = inMemoryStore.emergency_contacts.filter(
      c => c.id !== contactId || c.user_id !== req.user.id
    );

    if (inMemoryStore.emergency_contacts.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.json({ success: true, message: 'Emergency contact removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete contact', error: err.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  addEmergencyContact,
  deleteEmergencyContact
};
