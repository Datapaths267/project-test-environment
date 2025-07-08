const express = require('express');
const { interviewContents, updateInterviewTracker } = require('../models/InterviewTrackerModel');
const app = express();
app.use(express.json());
const xlsx = require('xlsx');
const excelService = require("../services/ExcelServices");

const multer = require("multer");
const { onboardedCandidatesContent, delOnboardedCandidate, updateOnboardedinsert } = require('../models/onboardedCandidatesModel');

const getOnboardedCandidatesDetails = async (req, res) => {
    try {
        console.log("DB entered into in onboarded candidate details");
        const { companyId, employeeId, designation } = req.query;
        const details = await onboardedCandidatesContent(companyId, employeeId, designation);
        console.log("DB entered into in onboarded candidate details", details);
        console.log("DB entered into in onboarded details", details.rows);

        res.status(200).json(details);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Error fetching companies", error: error.message });
    }
};

const updateOnboarded = async (req, res) => {
    console.log("Entered into onboarded candidate updating function");

    try {
        const {
            interview_id,
            selected_id,
            client_id,
            onboarded_date,
            invoice_status,

        } = req.body;

        console.log("Received candidate data for update:", req.body);

        const details = await updateOnboardedinsert(
            selected_id,
            interview_id,
            client_id,
            onboarded_date,
            invoice_status,
        );

        console.log("Update result:", details);
        res.status(201).json({ message: "Requirement added successfully!", details });
    } catch (error) {
        console.error("Error inserting requirement:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};


const deleteOnboardedCandidate = async (req, res) => {
    try {
        console.log("Entered into OnboardedCandidate deletion function");
        const { selected_id } = req.params;
        console.log("Received selected_id for deletion:", selected_id);
        if (!selected_id) {
            return res.status(400).json({ error: "schedule ID is required" });
        }

        await delOnboardedCandidate(selected_id);

        console.log("result" + delOnboardedCandidate);

        res.json({ message: "OnboardedCandidate schedule deleted successfully." });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error deleting OnboardedCandidate schedule." });
    }
};


module.exports = { getOnboardedCandidatesDetails, deleteOnboardedCandidate, updateOnboarded };