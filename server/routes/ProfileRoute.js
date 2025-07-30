// routes/profileRoutes.js
const express = require('express');
const { getProfileData } = require('../controllers/ProfileController');
const router = express.Router();

router.get('/profile/:id', getProfileData);

module.exports = router;
