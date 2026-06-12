const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { protect, authorize } = require('../middleware/auth');
const {
  getMyResults, getStudentResults, addManual,
  uploadFile, deleteResult, search
} = require('../controllers/resultController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/my',                        protect, getMyResults);
router.get('/search',                    protect, search);
router.get('/student/:id',               protect, authorize('teacher','admin'), getStudentResults);
router.post('/manual',                   protect, addManual);
router.post('/upload',                   protect, authorize('teacher','admin'), upload.single('file'), uploadFile);
router.delete('/:id',                    protect, authorize('teacher','admin'), deleteResult);

module.exports = router;
