const express = require('express');
const { allRequirementTrackerDetails, insertRequirement, getRequirementFiles, getRequirementfromRequirement, deleteRequirements, uploadRequirementExcel, updateRequirement, updateRequirementFiles, getFiles, updateFiles } = require('../models/requirementTrackerModel');
const app = express();
const xlsx = require('xlsx');
const excelService = require("../services/ExcelServices");
app.use(express.json());
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dbConn = require("../config/DB");

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage: storage });

const getAllRequirementTrackerContents = async (req, res) => {
    try {
        console.log("DB entered into in reuirement content details");
        const { companyId, employeeId, designation } = req.query;
        console.log("employee ID:", employeeId);
        const contents = await allRequirementTrackerDetails(companyId, employeeId, designation);
        console.log("requirement datas are :" + contents)
        res.status(200).json(contents);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Error fetching companies", error: error.message });
    }
}

const getAllRequirementTrackerFiles = async (req, res) => {
    try {
        console.log("DB entered into in reuirement content details");
        const { id } = req.params;
        const files = await getRequirementFiles(id);
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
            detailed_attachment: convertPathToBuffer(files.detailed_attachment),
            key_skills_jd: convertPathToBuffer(files.key_skills_jd),
            req_id: files.req_id,
        };

        res.status(200).json(processedFiles);
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ error: "Failed to fetch candidate tracker files" });
    }
};

const getrequirements = async (req, res) => {
    try {
        console.log("DB entered into in reuirement content details");
        const { companyId } = req.user;
        const contents = await getRequirementfromRequirement(companyId);
        console.log("requirement datas are :" + contents)
        res.status(200).json(contents);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Error fetching companies", error: error.message });
    }
}

// Controller function to handle requirement submission
const addRequirement = async (req, res) => {
    try {
        const {
            company_id, client_id, poc_id, account_manager, year, month, region, req_date, category,
            requirement, status, tech_skill, hire_type, number_of_positions, experience, location, mode, ctc_budget, recruiter_id
        } = req.body;

        const detailed_attachment = req.files["detailed_attachment"] ? req.files["detailed_attachment"][0].path : null;
        const key_skills_jd = req.files["key_skills_jd"] ? req.files["key_skills_jd"][0].path : null;

        const req_id = await insertRequirement({
            company_id, client_id, poc_id, account_manager, year, month, region, req_date, category,
            requirement, status, tech_skill, hire_type, number_of_positions, experience, location, mode, ctc_budget, recruiter_id,
            detailed_attachment, key_skills_jd
        });

        res.status(201).json({ message: "Requirement added successfully!", req_id });
    } catch (error) {
        console.error("Error inserting requirement:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

const updateReqFiles = async (req, res) => {
    console.log("Entered into candidate adding files");

    try {
        const req_id = req.params.req_id;

        // Dynamically track which files are uploaded
        const updates = {};
        if (req.files?.detailed_attachment) {
            updates.detailed_attachment = req.files["detailed_attachment"][0].path;
        }
        if (req.files?.key_skills_jd) {
            updates.key_skills_jd = req.files["key_skills_jd"][0].path;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No files uploaded to update" });
        }

        // Add req_id to the update object
        updates.req_id = req_id;

        const details = await updateRequirementFiles(updates);

        res.status(201).json({ message: "Requirement files updated successfully!", details });
    } catch (error) {
        console.error("Error updating files in candidate:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};


const updatesRequirement = async (req, res) => {
    try {
        const {
            req_id, company_id, customer_name, client_id, call_name, poc_id, account_manager, year, month, region, req_date, category,
            requirement, status, tech_skill, hire_type, number_of_positions, experience, location, mode, ctc_budget, recruiter_id
        } = req.body;

        // const detailed_attachment = req.files["detailed_attachment"] ? req.files["detailed_attachment"][0].path : null;
        // const key_skills_jd = req.files["key_skills_jd"] ? req.files["key_skills_jd"][0].path : null;

        const response = await updateRequirement({
            req_id, company_id, customer_name, client_id, call_name, poc_id, account_manager, year, month, region, req_date, category,
            requirement, status, tech_skill, hire_type, number_of_positions, experience, location, mode, ctc_budget, recruiter_id
        });

        res.status(201).json({ message: "Requirement added successfully!", response });
    } catch (error) {
        console.error("Error inserting requirement:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// const xlsx = require("xlsx"); // ensure this is already required
// const fs = require("fs");     // in case you want to delete file after upload

// ✅ Helper function to convert Excel serial date to 'yyyy-mm-dd'
function excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getFullYear();
    const month = String(date_info.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date_info.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ✅ Main function
const uploadRequirementsExcel = async (req, res) => {
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

        for (const row of jsonData) {
            if (!row['poc_id']) {
                console.error("Skipping row due to missing poc_id:", row);
                continue;
            }

            const requirementData = {
                company_id: row['company_id'] ? row['company_id'] : companyId,
                client_id: row['client_id'] || null,
                company_name: row['company_name'] || null,
                poc_id: row['poc_id'] || null,
                poc_name: row['poc_name'] || null,
                account_manager: row['account_manager'] || null,
                year: row['year'] || null,
                month: row['month'] || null,
                region: row['region'] || null,
                req_date: typeof row['req_date'] === 'number'
                    ? excelDateToJSDate(row['req_date'])
                    : row['req_date'] || null,
                category: row['category'] || null,
                requirement: row['requirement'] || null,
                status: row['status'] || null,
                tech_skill: row['tech_skill'] || null,
                hire_type: row['hire_type'] || null,
                number_of_positions: row['number_of_positions'] || null,
                experience: row['experience'] || null,
                location: row['location'] || null,
                mode: row['mode'] || null,
                ctc_budget: row['ctc_budget'] || null,
                recruiter_id: row['recruiter_id'] || null,
                recruiter: row['recruiter'] || null,
            };

            await uploadRequirementExcel(requirementData);
            insertedRows++;
        }

        // Optionally delete the uploaded file
        // fs.unlinkSync(filePath);

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


// const uploadRequirementsExcel = async (req, res) => {
//     try {
//         console.log("Received file:", req.file);
//         const { companyId } = req.body;

//         if (!req.file) {
//             return res.status(400).json({ error: "No file uploaded" });
//         }

//         const filePath = req.file.path;
//         console.log("File Path:", filePath);

//         // Read the Excel file
//         const workbook = xlsx.readFile(filePath);
//         const sheet_name_list = workbook.SheetNames;
//         if (!sheet_name_list.length) {
//             throw new Error("No sheets found in the Excel file");
//         }

//         const sheet = workbook.Sheets[sheet_name_list[0]];
//         const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

//         console.log("Parsed Excel Data:", jsonData);

//         if (!jsonData.length) {
//             throw new Error("Excel file is empty or not properly formatted");
//         }

//         let insertedRows = 0; // Counter for successfully inserted rows

//         for (const row of jsonData) {
//             if (!row['poc_id']) {
//                 console.error("Skipping row due to missing poc_id:", row);
//                 continue;
//             }

//             const requirementData = {
//                 company_id: row['company_id'] ? row['company_id'] : companyId,
//                 client_id: row['client_id'] || null,
//                 company_name: row['company_name'] || null,
//                 poc_id: row['poc_id'] || null,
//                 poc_name: row['poc_name'] || null,
//                 account_manager: row['account_manager'] || null,
//                 year: row['year'] || null,
//                 month: row['month'] || null,
//                 region: row['region'] || null,
//                 req_date: row['req_date'] || null,
//                 category: row['category'] || null,
//                 requirement: row['requirement'] || null,
//                 status: row['status'] || null,
//                 tech_skill: row['tech_skill'] || null,
//                 hire_type: row['hire_type'] || null,
//                 number_of_positions: row['number_of_positions'] || null,
//                 experience: row['experience'] || null,
//                 location: row['location'] || null,
//                 mode: row['mode'] || null,
//                 ctc_budget: row['ctc_budget'] || null,
//                 recruiter_id: row['recruiter_id'] || null,
//                 recruiter: row['recruiter'] || null,
//             };

//             // req_id, company_id, client_id, poc_id, account_manager, year, month, region, req_date, 
//             // category, requirement, status, tech_skill, hire_type, number_of_positions, experience, location, 
//             // mode, ctc_budget, recruiter, detailed_attachment, key_skills_jd

//             await uploadRequirementExcel(requirementData);
//             insertedRows++;
//         }

//         res.status(200).json({
//             success: true,
//             insertedRows: insertedRows,
//             message: `${insertedRows} customers added successfully!`
//         });

//     } catch (error) {
//         console.error("Error processing file:", error);
//         res.status(500).json({
//             success: false,
//             error: "Error processing file: " + error.message
//         });
//     }
// };

const getRequirementExcelTemplate = async (req, res) => {
    try {
        const workbook = await excelService.generateRequirementTemplateWorkbook();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=Requirements_template.xlsx"
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: "Failed to generate template" });
    }
};


const deleteRequirement = async (req, res) => {
    try {
        const { req_id } = req.params;
        if (!req_id) {
            return res.status(400).json({ error: "customer ID is required" });
        }

        await deleteRequirements(req_id);
        res.json({ message: "customer deleted successfully." });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error deleting customer." });
    }
};

const deleteFile = async (req, res) => {
    const { req_id, file_name } = req.body;

    // Optional: Validate that file_name is an allowed column
    const allowedColumns = ['detailed_attachment', 'key_skills_jd'];
    if (!allowedColumns.includes(file_name)) {
        return res.status(400).json({ success: false, error: 'Invalid column name' });
    }

    try {
        await dbConn.query(
            `UPDATE requirements SET ${file_name} = $1 WHERE req_id = $2`,
            [JSON.stringify([]), req_id] // or use null if column is not JSON
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};


module.exports = {
    getAllRequirementTrackerContents, addRequirement, upload, getAllRequirementTrackerFiles, getrequirements,
    uploadRequirementsExcel, getRequirementExcelTemplate, deleteRequirement, updatesRequirement, updateReqFiles, deleteFile
};