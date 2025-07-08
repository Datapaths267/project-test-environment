const express = require('express');
const app = express();
app.use(express.json());
const router = express.Router();
const authenticateUser = require("../middleware/authMiddleware");
const { getAllConfig, addConfigOption, deleteConfigOption, createNewColumn, deleteColumn } = require('../controllers/ConFigController');

router.get('/getAllConfig', authenticateUser, getAllConfig);
router.post("/addConfig", addConfigOption);
router.delete("/deleteConfig/:id", deleteConfigOption);
router.delete("/deleteColumn", deleteColumn);
router.post("/createColumn", createNewColumn);

module.exports = router;