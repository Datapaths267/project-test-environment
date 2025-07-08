const express = require("express");
const router = express.Router();
const controller = require("../controllers/assignmentController");

router.get('/reports-to-options', controller.getReportsToOptions);
router.put('/employees/updateReportsTo', controller.updateReportsTo);
router.post("/assign", controller.assignCustomer);
router.get("/client-assignments", controller.getclientAssignments);
router.get("/recruiters", controller.getallrecruiters);
router.get("/clients", controller.getallclients);

module.exports = router;



