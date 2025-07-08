const express = require('express');
const app = express();
app.use(express.json());
const router = express.Router();
const authenticateUser = require("../middleware/authMiddleware");
const { getInterviewTrackercontent, getInterviewTrackerExcelTemplate, updateInterview, deleteInterview } = require('../controllers/InterviewTrackerController');
const multer = require('multer');
const uploading = multer(); // Memory storage, no file saving

router.post("/updateInterviewData", uploading.none(), updateInterview);
router.get('/InterviewTrackerContent', authenticateUser, getInterviewTrackercontent)
router.get("/download-template", getInterviewTrackerExcelTemplate);
router.delete("/:schedule_id/deleteinterviews", deleteInterview);

module.exports = router;