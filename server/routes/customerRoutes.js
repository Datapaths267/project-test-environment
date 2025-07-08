const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware"); // Import multer config

const authenticateUser = require("../middleware/authMiddleware");
const { getCustomerDetail, deleteCustomers, getCustomerFiles, registerCustomer, uploadExcel, downloadExcel, getCustomerCompany, updateCustomer } = require("../controllers/customerController");

// Define routes
router.get("/details", authenticateUser, getCustomerDetail);
router.get("/:customerId/documents", authenticateUser, getCustomerFiles);
router.delete("/:customerId/deleteCustomer", deleteCustomers);
router.post("/customer/register", upload.fields([
    { name: "documents" }
]), registerCustomer);

router.post("/updateCustomer", upload.none(), updateCustomer);
router.post("/upload", authenticateUser, upload.single("file"), uploadExcel);
router.get("/download", downloadExcel);
router.get("/customerCompany", authenticateUser, getCustomerCompany);

module.exports = router; // ✅ Export the router
