const express = require('express');
const app = express();
app.use(express.json());
const router = express.Router();
const multer = require('multer');
const uploading = multer(); // Memory storage, no file saving

const authenticateToken = require("../middleware/authMiddleware");
const authenticateUser = require("../middleware/authMiddleware");
const { getCandidateTrackercontent, addCandidates, upload, CandidateStoreupload, getCandidateExcelTemplate, uploadCandidatesExcel, deleteCandidate, getAllCandidateTrackerFiles, updateCandidates, updateFiles, DeleteFiles, deleteFile } = require('../controllers/candidateTrackerController');

router.get('/CandidateTrackerContent', authenticateToken, getCandidateTrackercontent);
router.get('/get-files/:candidate_id', authenticateUser, getAllCandidateTrackerFiles);
// Fix: Ensure correct field names in upload middleware
router.post("/addCandidate", authenticateToken,
    CandidateStoreupload.fields([
        { name: "detailed_profile", maxCount: 1 },
        { name: "masked_profile", maxCount: 1 },
        { name: "skill_mapping_attachment", maxCount: 1 }, // Fixed field name
    ]), addCandidates
);

router.post("/updateFiles/:candidate_id", authenticateToken,
    CandidateStoreupload.fields([
        { name: "detailed_profile", maxCount: 5 },
        { name: "masked_profile", maxCount: 5 },
        { name: "skill_mapping_attachment", maxCount: 5 }, // Fixed field name
    ]), updateFiles
);

router.delete("/deleteFiles/:candidate_id", authenticateToken,
    CandidateStoreupload.fields([
        { name: "detailed_profile", maxCount: 5 },
        { name: "masked_profile", maxCount: 5 },
        { name: "skill_mapping_attachment", maxCount: 5 }, // Fixed field name
    ]), DeleteFiles
);


router.post("/updateCandidate", uploading.none(), updateCandidates);

router.get("/download-template", getCandidateExcelTemplate);
router.post("/upload-excel", CandidateStoreupload.single("file"), uploadCandidatesExcel);
router.delete("/:candidate_id/deleteCandidates", deleteCandidate);
router.post('/delete-file', deleteFile);

module.exports = router;
