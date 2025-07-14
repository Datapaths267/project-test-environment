const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authMiddleware");
const {
  uploadProfilePic,
  uploadDocuments: multerUploadDocs
} = require('../config/multerConfig');
const upload = require('../middleware/uploadMiddleware');

// Import controller methods as a single object
const employeeController = require('../controllers/employeeController');

// 🔹 GET routes
router.get('/designation', employeeController.getAllEmployeeDesignation);
router.get('/employeeList', authenticateUser, employeeController.getAllEmployeeDetails);
router.get('/work_assign_company_list', employeeController.getAllWorkAssignedCompany);
router.get('/employeeList_With_Work_Not_Assign', authenticateUser, employeeController.getWorkNotAssignedEmployeesList);
router.get('/employeeList_With_Work_Assign', authenticateUser, employeeController.getWorkAssignedEmployeesList);
router.get('/getEmployeeDetails', authenticateUser, employeeController.getEmployeeDetail);
router.get('/employee-files', authenticateUser, employeeController.getEmployeeFiles);

// 🔹 POST routes
router.post('/addEmployee', employeeController.createEmployee);
router.post('/assignCompanies', employeeController.assignEmployeeCompanies);
router.post('/changeAssignCompanies', employeeController.updateEmployeeAssignment);

// File upload routes
router.post('/upload-profile-pic',
  authenticateUser,
  uploadProfilePic,
  employeeController.uploadProfilePicture
);

router.post('/upload-documents',
  authenticateUser,
  multerUploadDocs,
  employeeController.uploadDocuments
);

router.post("/upload-employee-excel", upload.single("file"), employeeController.uploadEmployeeExcel);

// file upload 
router.get("/download-template-for-employee", employeeController.downloadTemplatefroEmployee);

// 🔹 PUT route
router.put('/updateEmployee', authenticateUser, employeeController.updateEmployee);

// 🔹 DELETE routes
router.delete('/deleteEmployee', authenticateUser, employeeController.deleteEmployee);
router.delete('/delete-document', authenticateUser, employeeController.deleteEmployeeDocument);
router.delete('/delete-profile-pic', authenticateUser, employeeController.deleteProfilePicture); // NEW ROUTE

module.exports = router;







{/*const express = require("express");
const app = express();
app.use(express.json());

const {
    getAllEmployeeDesignation,
    getAllEmployeeDetails,
    getAllWorkAssignedCompany,
    getWorkAssignedEmployeesList,
    getWorkNotAssignedEmployeesList,
    createEmployee,
    assignEmployeeCompanies,
    updateEmployeeAssignment,
    deleteEmployee,
    updateEmployee, // ✅ new function from controller
    getEmployeeDetail
} = require('../controllers/employeeController');

const router = express.Router();
const authenticateUser = require("../middleware/authMiddleware");

// 🔹 GET routes
router.get('/designation', getAllEmployeeDesignation);
router.get('/employeeList', authenticateUser, getAllEmployeeDetails);
router.get('/work_assign_company_list', getAllWorkAssignedCompany);
router.get('/employeeList_With_Work_Not_Assign', authenticateUser, getWorkNotAssignedEmployeesList);
router.get('/employeeList_With_Work_Assign', authenticateUser, getWorkAssignedEmployeesList);
router.get('/getEmployeeDetails', authenticateUser, getEmployeeDetail);

// 🔹 POST routes
router.post('/addEmployee', createEmployee);
router.post('/assignCompanies', assignEmployeeCompanies);
router.post('/changeAssignCompanies', updateEmployeeAssignment);

// 🔹 PUT route for updating employee
router.put('/updateEmployee', updateEmployee); // ✅ Save button route

// 🔹 DELETE route
router.delete('/deleteEmployee', deleteEmployee);

module.exports = router;




*/}










{/*const express = require("express");
const app = express();
app.use(express.json());
const { getAllEmployeeDesignation, getAllEmployeeDetails, getAllWorkAssignedCompany,
    getWorkAssignedEmployeesList, getWorkNotAssignedEmployeesList,
    createEmployee,
    assignEmployeeCompanies,
    updateEmployeeAssignment,
    deleteEmployee } = require('../controllers/employeeController');

const router = express.Router();
const authenticateUser = require("../middleware/authMiddleware");



router.get('/designation', getAllEmployeeDesignation);
router.get('/employeeList', authenticateUser, getAllEmployeeDetails);
router.get('/work_assign_company_list', getAllWorkAssignedCompany);
router.get('/employeeList_With_Work_Not_Assign', authenticateUser, getWorkNotAssignedEmployeesList);
router.get('/employeeList_With_Work_Assign', authenticateUser, getWorkAssignedEmployeesList);
router.post('/addEmployee', createEmployee);
router.post('/assignCompanies', assignEmployeeCompanies);
router.post('/changeAssignCompanies', updateEmployeeAssignment);
router.delete('/deleteEmployee', deleteEmployee);

module.exports = router;  */}