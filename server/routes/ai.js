const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { askMentor, generateRoadmap, generateStory, generateResume, getResultInsight } = require('../controllers/aiController');

router.post('/mentor',          protect, askMentor);
router.get('/roadmap',          protect, generateRoadmap);
router.get('/story',            protect, generateStory);
router.get('/resume',           protect, generateResume);
router.get('/insight/:resultId',protect, getResultInsight);

module.exports = router;
