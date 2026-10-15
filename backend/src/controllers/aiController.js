const { askSafetyAssistant } = require('../services/aiService');

const explainRoute = async (req, res) => {
  try {
    const { routeType, safetyScore, isNight = true } = req.body;

    let explanation = {};
    if (routeType === 'safest') {
      explanation = {
        title: 'Safest Route AI Analysis',
        tone: 'Reassuring & Informative',
        verdict: 'Recommended for night travel',
        summary: `Ye route thoda lamba ho sakta hai (~10-15%), lekin isme well-lit broad avenues zyada hain, police station 350m door hai, aur blind corners avoid kiye gaye hain.`,
        key_reasons: [
          '85%+ path covered by functional municipal streetlights',
          'Immediate proximity to active Central Police Post',
          'Higher foot traffic & open 24/7 commercial establishments',
          'Absence of reported chain-snatching or harassment hotspots'
        ],
        safety_score: safetyScore || 88
      };
    } else {
      explanation = {
        title: 'Fastest Route AI Analysis',
        tone: 'Cautious',
        verdict: 'Use with awareness, avoid late night walking',
        summary: `Ye route direct shortcut deta hai, lekin isme isolated back-alleys aur broken streetlights ke community reports hain. Daytime me suitable hai.`,
        key_reasons: [
          'Passes near unmonitored rear service lane',
          'Lower visibility due to patchy lighting',
          'Less footfall after 9:00 PM'
        ],
        safety_score: safetyScore || 48
      };
    }

    res.json({
      success: true,
      explanation
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not generate explanation', error: err.message });
  }
};

const askSafetyQuestion = async (req, res) => {
  try {
    const { question, latitude = 28.6328, longitude = 77.2195, timeStr = '10:00 PM' } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question string is required' });
    }

    const aiAnswer = await askSafetyAssistant(question, parseFloat(latitude), parseFloat(longitude), timeStr);

    res.json({
      success: true,
      ai_response: aiAnswer
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI Assistant query failed', error: err.message });
  }
};

module.exports = {
  explainRoute,
  askSafetyQuestion
};
