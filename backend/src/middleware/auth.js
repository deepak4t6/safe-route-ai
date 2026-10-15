const { verifyToken } = require('../config/jwt');
const { query, usePostgres, inMemoryStore } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    let user = null;
    if (usePostgres) {
      const result = await query('SELECT id, name, email, role, phone, preferred_mode FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } else {
      user = inMemoryStore.users.find(u => u.id === decoded.id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or invalid session'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      let user = null;
      if (usePostgres) {
        const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
        if (result.rows.length > 0) user = result.rows[0];
      } else {
        user = inMemoryStore.users.find(u => u.id === decoded.id);
      }
      if (user) req.user = user;
    }
  } catch (err) {
    // optional, proceed unauthenticated
  }
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of the following roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole
};
