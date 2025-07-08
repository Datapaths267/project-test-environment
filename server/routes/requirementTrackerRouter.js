const express = require('express');
const app = express();
app.use(express.json());
const router = express.Router();
const multer = require('multer');
const uploading = multer(); // Memory storage, no file saving


const authenticateToken = require('../middleware/authMiddleware');
const { getAllRequirementTrackerContents, addRequirement, upload, getAllRequirementTrackerFiles, getrequirements, deleteRequirement, getRequirementExcelTemplate, uploadRequirementsExcel, updatesRequirement, updateReqFiles, deleteFile } = require('../controllers/requirementTrackerController');

router.get('/getRequirementTrackerContent', authenticateToken, getAllRequirementTrackerContents);
router.post("/addRequirement", authenticateToken, upload.fields([
    { name: "detailed_attachment", maxCount: 1 },
    { name: "key_skills_jd", maxCount: 1 }
]), addRequirement);

router.post("/updateFiles/:req_id", authenticateToken,
    upload.fields([
        { name: "detailed_attachment", maxCount: 5 },
        { name: "key_skills_jd", maxCount: 5 }
    ]), updateReqFiles
);

router.post("/updateRequirement", uploading.none(), updatesRequirement);
router.get('/get-files/:id', getAllRequirementTrackerFiles);
router.get('/getRequirements', authenticateToken, getrequirements);
router.delete("/:req_id/deleteRequirement", deleteRequirement);
router.get("/download-template", getRequirementExcelTemplate);
// router.get("/download", downloadContactExcel);
router.post("/upload-excel", upload.single("file"), uploadRequirementsExcel);
router.post('/delete-file', deleteFile);


module.exports = router;