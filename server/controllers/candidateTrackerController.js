const express = require('express');
const mime = require('mime-types');
const { candidateContents, insertCandidate, uploadCandidateExcelData, deleteCandidates, getCandidateFiles, updateCandidate, updateCandidateFiles, deleteCandidateFiles } = require('../models/candidateTrackerModel');
const app = express();
const xlsx = require('xlsx');
const excelService = require("../services/ExcelServices");
app.use(express.json());
const dbConn = require("../config/DB");

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

const getCandidateTrackercontent = async (req, res) => {
    try {
        console.log("DB entered into in contact details");
        const { companyId, employeeId, designation } = req.query;
        const details = await candidateContents(companyId, employeeId, designation);
        res.status(200).json(details);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Error fetching companies", error: error.message });
    }
};

const fs = require("fs");
const path = require("path");

const getAllCandidateTrackerFiles = async (req, res) => {
    try {
        const { candidate_id } = req.query;
        console.log("DB entered into in contact details");

        const files = await getCandidateFiles(candidate_id);
        console.log("Fetched files from DB:", files);

        const convertPathToBuffer = (filePathBuffer) => {
            if (!filePathBuffer) return null;

            const filePath = filePathBuffer.toString();  // ✅ convert buffer to string

            const fullPath = path.join(__dirname, "..", filePath); // You can adjust based on your upload path
            try {
                const fileData = fs.readFileSync(fullPath);
                return {
                    data: Array.from(fileData),
                    mimetype: "application/pdf",
                };
            } catch (err) {
                console.error("Error reading file from path:", fullPath, err);
                return null;
            }
        };


        const processedFiles = {
            detailed_profile: convertPathToBuffer(files.detailed_profile),
            masked_profile: convertPathToBuffer(files.masked_profile),
            skill_mapping_attachment: convertPathToBuffer(files.skill_mapping_attachment),
            candidate_id: files.candidate_id,
        };

        res.status(200).json(processedFiles);
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ error: "Failed to fetch candidate tracker files" });
    }
};

const updateFiles = async (req, res) => {
    console.log("Entered into candidate adding files");

    try {
        const candidate_id = req.params.candidate_id;

        const fileData = {
            candidate_id,
        };

        if (req.files?.detailed_profile) {
            fileData.detailed_profile = req.files["detailed_profile"][0].path;
        }

        if (req.files?.masked_profile) {
            fileData.masked_profile = req.files["masked_profile"][0].path;
        }

        if (req.files?.skill_mapping_attachment) {
            fileData.skill_mapping_attachment = req.files["skill_mapping_attachment"][0].path;
        }

        const details = await updateCandidateFiles(fileData);

        res.status(201).json({ message: "Files uploaded successfully!", details });
    } catch (error) {
        console.error("Error updating files in candidate:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};


const DeleteFiles = async (req, res) => {
    console.log("Entered into candidate adding files");

    try {
        const candidate_id = req.params.candidate_id;

        const fileData = {
            candidate_id,
        };

        if (req.files?.detailed_profile) {
            fileData.detailed_profile = req.files["detailed_profile"][0].path;
        }

        if (req.files?.masked_profile) {
            fileData.masked_profile = req.files["masked_profile"][0].path;
        }

        if (req.files?.skill_mapping_attachment) {
            fileData.skill_mapping_attachment = req.files["skill_mapping_attachment"][0].path;
        }

        const details = await deleteCandidateFiles(fileData);

        res.status(201).json({ message: "Files uploaded successfully!", details });
    } catch (error) {
        console.error("Error updating files in candidate:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};


const addCandidates = async (req, res) => {
    console.log("Entered into candidate adding function");

    try {
        const {
            company_id, req_id, client_id, poc_id, date_of_submission, candidate_name, contact_number, mail_id, current_company,
            skill, total_exp, re_exp, ctc, ectc, notice_period, status, work_mode, notes, skill_mapping_notes, skill_mapping_rating
        } = req.body;

        // Retrieve uploaded file paths safely
        const detailed_profile = req.files?.detailed_profile ? req.files["detailed_profile"][0].path : null;
        const masked_profile = req.files?.masked_profile ? req.files["masked_profile"][0].path : null;
        const skill_mapping_attachment = req.files?.skill_mapping_attachment ? req.files["skill_mapping_attachment"][0].path : null;

        const details = await insertCandidate({
            company_id, req_id, client_id, poc_id, date_of_submission, candidate_name, contact_number, mail_id, current_company,
            skill, total_exp, re_exp, ctc, ectc, notice_period, status, work_mode, notes, skill_mapping_notes, skill_mapping_rating,
            detailed_profile, masked_profile, skill_mapping_attachment
        });

        res.status(201).json({ message: "Requirement added successfully!", details });
    } catch (error) {
        console.error("Error inserting requirement:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};


const updateCandidates = async (req, res) => {
    console.log("Entered into candidate updating function");

    try {
        const {
            parent_company_id, req_id, client_id, poc_id, customer_name, call_name, date_of_submission, candidate_name, contact_number,
            mail_id, current_company, skill, total_exp, re_exp, ctc, ectc, notice_period, status, work_mode, notes, skill_mapping_notes,
            skill_mapping_rating, interview_status, candidate_id
        } = req.body;

        console.log("Received candidate data for update:", req.body);

        const details = await updateCandidate({
            parent_company_id, req_id, client_id, poc_id, customer_name, call_name, date_of_submission, candidate_name, contact_number, mail_id, current_company,
            skill, total_exp, re_exp, ctc, ectc, notice_period, status, work_mode, notes, skill_mapping_notes, skill_mapping_rating,
            interview_status, candidate_id
        });

        console.log("Update result:", details);
        res.status(201).json({ message: "Requirement added successfully!", details });
    } catch (error) {
        console.error("Error inserting requirement:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};
// const xlsx = require("xlsx");

// ✅ Helper to convert Excel serial date to 'YYYY-MM-DD' format
const excelDateToJSDateString = (excelDate) => {
    if (!excelDate || isNaN(excelDate)) return null;
    const date = new Date((excelDate - 25569) * 86400 * 1000); // Convert to milliseconds
    const iso = date.toISOString().split("T")[0]; // Format as 'YYYY-MM-DD'
    return iso;
};

const uploadCandidatesExcel = async (req, res) => {
    try {
        console.log("Received file:", req.file);
        const { companyId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;
        console.log("File Path:", filePath);

        // Read Excel file
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

        let insertedRows = 0;

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
                date_of_submission:
                    typeof row['date_of_submission'] === 'number'
                        ? excelDateToJSDateString(row['date_of_submission'])
                        : row['date_of_submission'] || null,
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
            message: `${insertedRows} candidates added successfully!`
        });

    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({
            success: false,
            error: "Error processing file: " + error.message
        });
    }
};


const getCandidateExcelTemplate = async (req, res) => {
    try {
        const workbook = await excelService.generateCandidateTemplateWorkbook();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=Candidate_template.xlsx"
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


const deleteFile = async (req, res) => {
    const { candidate_id, file_name } = req.body;

    // Optional: Validate that file_name is an allowed column
    const allowedColumns = ['detailed_profile', 'masked_profile', 'skill_mapping_attachment'];
    if (!allowedColumns.includes(file_name)) {
        return res.status(400).json({ success: false, error: 'Invalid column name' });
    }

    try {
        await dbConn.query(
            `UPDATE candidate_tracker SET ${file_name} = $1 WHERE candidate_id = $2`,
            [JSON.stringify([]), candidate_id] // or use null if column is not JSON
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};



module.exports = {
    getCandidateTrackercontent, addCandidates, CandidateStoreupload, updateFiles,
    uploadCandidatesExcel, getCandidateExcelTemplate, deleteCandidate, getAllCandidateTrackerFiles, updateCandidates,
    DeleteFiles, deleteFile
};