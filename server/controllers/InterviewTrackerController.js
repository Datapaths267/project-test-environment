const express = require('express');
const { interviewContents, updateInterviewTracker, delinterview } = require('../models/InterviewTrackerModel');
const app = express();
app.use(express.json());
const xlsx = require('xlsx');
const excelService = require("../services/ExcelServices");

const multer = require("multer");

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const CandidateStoreupload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

const updateInterview = async (req, res) => {
    console.log("Entered into candidate updating function");

    try {
        const {
            schedule_id,
            req_id,
            candidate_id,
            client_id,
            contact_id,
            level_of_interview,
            interview_date,
            interview_time,
            interview_status,
            customer_name,
            call_name,
            recruiter,
            requirement,
            candidate_name,
            contact_number,
            mail_id
        } = req.body;

        console.log("Received candidate data for update:", req.body);

        const details = await updateInterviewTracker({
            schedule_id,
            req_id,
            candidate_id,
            client_id,
            contact_id,
            level_of_interview,
            interview_date,
            interview_time,
            interview_status,
            customer_name,
            call_name,
            recruiter,
            requirement,
            candidate_name,
            contact_number,
            mail_id
        });

        console.log("Update result:", details);
        res.status(201).json({ message: "Requirement added successfully!", details });
    } catch (error) {
        console.error("Error inserting requirement:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

const getInterviewTrackercontent = async (req, res) => {
    try {
        console.log("DB entered into in Interviewtracker details");
        const { companyId, employeeId, designation } = req.query;
        const details = await interviewContents(companyId, employeeId, designation);
        res.status(200).json(details);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Error fetching companies", error: error.message });
    }
}

const uploadCandidatesExcel = async (req, res) => {
    try {
        console.log("Received file:", req.file);
        const { companyId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;
        console.log("File Path:", filePath);

        // Read the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheet_name_list = workbook.SheetNames;
        if (!sheet_name_list.length) {
            throw new Error("No sheets found in the Excel file");
        }

        const sheet = workbook.Sheets[sheet_name_list[0]];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

        console.log("Parsed Excel Data:", jsonData);

        if (!jsonData.length) {
            throw new Error("Excel file is empty or not properly formatted");
        }

        let insertedRows = 0; // Counter for successfully inserted rows
        // Helper to convert Excel serial date to JS date string
        // const excelDateToJSDateString = (excelDate) => {
        //     if (!excelDate || isNaN(excelDate)) return null;

        //     const date = new Date((excelDate - 25569) * 86400 * 1000); // Convert to ms
        //     const iso = date.toISOString().split("T")[0]; // 'YYYY-MM-DD'
        //     return iso;
        // };

        for (const row of jsonData) {
            if (!row['candidate_name']) {
                console.error("Skipping row due to missing candidate_name:", row);
                continue;
            }

            const candidateData = {
                parent_company_id: row['DataPaths'] ? row['DataPaths'] : companyId,
                client_id: row['client_id'] || null,
                poc_id: row['poc_id'] || null,
                req_id: row['req_id'] || null,
                customer_name: row['customer_name'] || null,
                call_name: row['call_name'] || null,
                // date_of_submission: excelDateToJSDateString(row['date_of_submission']) || null,
                date_of_submission: row['date_of_submission'] || null,
                candidate_name: row['candidate_name'] || null,
                contact_number: row['contact_number'] || null,
                mail_id: row['mail_id'] || null,
                current_company: row['current_company'] || null,
                skill: row['skill'] || null,
                total_exp: row['total_exp'] || null,
                re_exp: row['re_exp'] || null,
                ctc: row['ctc'] || null,
                ectc: row['ectc'] || null,
                notice_period: row['notice_period'] || null,
                work_mode: row['work_mode'] || null,
                notes: row['notes'] || null,
                skill_mapping_notes: row['skill_mapping_notes'] || null,
                skill_mapping_rating: row['skill_mapping_rating'] || null,
                status: row['status'] || null,
            };

            await uploadCandidateExcelData(candidateData);
            insertedRows++;
        }

        res.status(200).json({
            success: true,
            insertedRows: insertedRows,
            message: `${insertedRows} customers added successfully!`
        });

    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({
            success: false,
            error: "Error processing file: " + error.message
        });
    }
};

const getInterviewTrackerExcelTemplate = async (req, res) => {
    try {
        const workbook = await excelService.generateInterviewTrackerTemplateWorkbook();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=InterviewTracker_template.xlsx"
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: "Failed to generate template" });
    }
};

const deleteCandidate = async (req, res) => {
    try {
        const { candidate_id } = req.params;
        if (!candidate_id) {
            return res.status(400).json({ error: "candidate ID is required" });
        }

        await deleteCandidates(candidate_id);
        res.json({ message: "candidate deleted successfully." });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error deleting candidate." });
    }
};


const deleteInterview = async (req, res) => {
    try {
        console.log("Entered into interview deletion function");
        const { schedule_id } = req.params;
        console.log("Received schedule_id for deletion:", schedule_id);
        if (!schedule_id) {
            return res.status(400).json({ error: "schedule ID is required" });
        }

        await delinterview(schedule_id);

        console.log("result" + delinterview);

        res.json({ message: "interview schedule deleted successfully." });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error deleting interview schedule." });
    }
};

module.exports = { getInterviewTrackercontent, getInterviewTrackerExcelTemplate, updateInterview, deleteInterview };