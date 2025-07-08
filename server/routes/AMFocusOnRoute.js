const express = require('express');
const { getAMFocuscontent } = require('../controllers/AMFocusOnController');
const app = express();
app.use(express.json());
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const authenticateUser = require("../middleware/authMiddleware");

router.get('/AMFocuOnContent', authenticateToken, getAMFocuscontent);

module.exports = router;