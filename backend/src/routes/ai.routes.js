const express = require('express');
const router = express.Router();
const { explainRoute, askSafetyQuestion } = require('../controllers/aiController');

router.post('/explain-route', explainRoute);
router.post('/ask-safety-question', askSafetyQuestion);

module.exports = router;
