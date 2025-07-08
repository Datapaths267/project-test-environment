const express = require('express');
const app = express();
app.use(express.json());
const { login } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);

module.exports = router;
