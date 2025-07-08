const express = require('express');
const { getContactDetails, addingContact, getContactPOC, addContact, getContactImageById, uploadContactExcel, getExcelTemplate,
    downloadTemplate, uploadExcel, downloadContactExcel, deleteContacts, updateContact,
    updateContactFiles,
    deleteContactImage } = require('../controllers/contactsController');
const authenticateToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const app = express();
app.use(express.json());
const router = express.Router();


router.get('/contactsDetails', authenticateToken, getContactDetails);
router.get('/contactImage/:contactId', authenticateToken, getContactImageById);
router.delete("/:contact_id/deleteContacts", deleteContacts);
router.get("/download-template", downloadTemplate);
router.get("/download", downloadContactExcel);
router.post("/upload-excel", upload.single("file"), uploadExcel);
router.post("/addContacts", upload.single("contact_image"), addContact);

router.post("/updateFiles/:contact_id", upload.single("contact_image"), updateContactFiles);

router.post("/updateContacts", upload.single("contact_image"), updateContact);
router.get('/contactsPOC', authenticateToken, getContactPOC);
router.delete("/deleteContactImage/:contact_id", authenticateToken, deleteContactImage);
module.exports = router;