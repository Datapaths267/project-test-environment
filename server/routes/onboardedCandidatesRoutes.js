const express = require('express');
const app = express();
app.use(express.json());
const router = express.Router();
const authenticateUser = require("../middleware/authMiddleware");
const { getOnboardedCandidatesDetails, deleteOnboardedCandidate, updateOnboarded } = require('../controllers/onboardedCandidatesController');

const multer = require('multer');
const uploading = multer(); // Memory storage, no file saving

router.post("/updateOnboardedCandidate", uploading.none(), updateOnboarded);
router.get('/OnboardedCandidatesContent', authenticateUser, getOnboardedCandidatesDetails);
router.delete("/:selected_id/deleteOnboardedCandidate", authenticateUser, deleteOnboardedCandidate);

module.exports = router;