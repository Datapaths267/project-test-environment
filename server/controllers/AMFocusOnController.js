const express = require('express');
const app = express();
app.use(express.json());
const dbConn = require("../config/DB");
const { getAllAMFocusOn } = require('../models/AMFocusOnModel');

const getAMFocuscontent = async (req, res) => {
    try {
        console.log("DB entered into in contact details");
        const { companyId, employeeId, designation, employeeName } = req.query;
        console.log("Company ID:", companyId);
        const details = await getAllAMFocusOn(companyId, employeeId, designation, employeeName);
        console.log("Details fetched:", details);
        res.status(200).json(details);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Error fetching companies", error: error.message });
    }
};

module.exports = { getAMFocuscontent };