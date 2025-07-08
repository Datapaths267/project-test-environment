const express = require("express");
const app = express();
app.use(express.json());
const { getAllCountries, getAllCompanies, getCompaniesbycounty, getCustomerList, getCompanyCity, registerCompany, deleteCompanies,
    getAllRegisteredCompaniesContent,
    getCompanyDocuments } = require('../controllers/companyController');

const multer = require('multer');

// Set up storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();
const authenticateUser = require("../middleware/authMiddleware");

router.get('/countryAll', getAllCountries);
router.get('/companies', getAllCompanies);
router.get('/companiesbycounty/:country_code', getCompaniesbycounty);
router.get('/customerList', getCustomerList);
router.get('/city', getCompanyCity);
router.post('/company/register', upload.fields([
    { name: 'registration_documents' },
    { name: 'company_profile_deck' },
    { name: 'attachments' },
    { name: 'documents' },
    { name: 'case_studies' }
]), registerCompany);
router.get("/company/content", authenticateUser, getAllRegisteredCompaniesContent);
router.get("/company/:companyId/documents", authenticateUser, getCompanyDocuments);
router.delete("/:companyId/delete", deleteCompanies);

module.exports = router;