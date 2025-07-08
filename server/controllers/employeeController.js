const dbConn = require("../config/DB");
const fs = require("fs");
const path = require("path");
const {
    getEmployeeDesignation,
    getAllEmployees: getAllEmployeesFromModel,
    getWorkAssignedCompany,
    getAssignedEmployees,
    getNotAssignedEmployees,
    addEmployee,
    assignCompanies,
    changeAssignCompanies,
    deleteEmployeById,
    getRecruiterDetail,
    updateEmployeeProfilePicture,
    addEmployeeDocuments,
    getEmployeeFiles: getEmployeeFilesFromDB,
    removeEmployeeDocument
} = require('../models/employeeModel');

// ================= DATE HANDLING FUNCTIONS =================
const formatDateForDB = (dateString) => {
    if (!dateString || dateString.trim() === "" || dateString === "Still working") {
        return null;
    }

    if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        if (day && month && year) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    return dateString;
};

const formatDateForDisplay = (dateString) => {
    if (!dateString) return "Still working";

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    return dateString;
};

// ================= FILE UPLOAD CONTROLLERS (UPDATED) =================
const uploadProfilePicture = async (req, res) => {
    try {
        const { employee_id } = req.body;

        if (!employee_id || !req.file) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: "Employee ID and file are required" });
        }

        // Store relative path for web access (ensure it matches your frontend API URL)
        const profile_picture = `uploads/${req.file.filename}`;

        const result = await updateEmployeeProfilePicture(employee_id, profile_picture);
        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            profile_picture: `${process.env.REACT_APP_API_URL || ''}${profile_picture}`
        });
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Profile picture upload error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload profile picture",
            error: error.message
        });
    }
};

const uploadDocuments = async (req, res) => {
    try {
        const { employee_id } = req.body;

        if (!employee_id || !req.files || req.files.length === 0) {
            if (req.files) {
                req.files.forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(400).json({
                success: false,
                message: "Employee ID and at least one file are required"
            });
        }

        // Create document objects with full URLs
        const documents = req.files.map(file => ({
            name: file.originalname,
            url: `${process.env.REACT_APP_API_URL || ''}uploads/${file.filename}`,
            type: file.mimetype,
            size: file.size
        }));

        const result = await addEmployeeDocuments(employee_id, documents);
        res.status(200).json({
            success: true,
            message: "Documents uploaded successfully",
            documents: safeJsonParse(result.documents)
        });
    } catch (error) {
        if (req.files) {
            req.files.forEach(file => fs.unlinkSync(file.path));
        }
        console.error("Documents upload error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload documents",
            error: error.message
        });
    }
};

// Helper function for safe JSON parsing
const safeJsonParse = (str) => {
    try {
        return str ? JSON.parse(str) : [];
    } catch (e) {
        console.error("JSON parse error:", e);
        return [];
    }
};

// ================= REST OF THE CONTROLLERS (UNCHANGED) =================
const getAllEmployeeDesignation = async (req, res) => {
    try {
        const designations = await getEmployeeDesignation();
        res.status(200).json(designations);
    } catch (error) {
        console.error("Error getting designations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getEmployeeDetail = async (req, res) => {
    try {
        const { companyId, Designation } = req.query;
        const employeeDetail = await getRecruiterDetail(companyId, Designation);
        res.status(200).json(employeeDetail);
    } catch (error) {
        console.error("Error getting employee detail:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllEmployeeDetails = async (req, res) => {
    try {
        const { companyId, country, role } = req.user;

        if (role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const employees = await getAllEmployeesFromModel(companyId, country);

        const formattedEmployees = employees.map(emp => {
            let documents = [];
            try {
                if (emp.documents && typeof emp.documents === 'string' && emp.documents.trim() !== '') {
                    documents = JSON.parse(emp.documents);
                } else if (Array.isArray(emp.documents)) {
                    documents = emp.documents;
                }
            } catch (e) {
                console.error(`Error parsing documents for employee ${emp.employee_id}:`, e);
                documents = [];
            }

            return {
                ...emp,
                employee_leaving_date: formatDateForDisplay(emp.employee_lwd),
                documents: documents
            };
        });

        res.status(200).json(formattedEmployees);
    } catch (error) {
        console.error("Error getting employees:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllWorkAssignedCompany = async (req, res) => {
    try {
        const companies = await getWorkAssignedCompany();
        res.status(200).json(companies);
    } catch (error) {
        console.error("Error getting assigned companies:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getWorkAssignedEmployeesList = async (req, res) => {
    try {
        const { companyId, country } = req.query;
        const employees = await getAssignedEmployees(companyId, country);
        res.status(200).json(employees);
    } catch (error) {
        console.error("Error getting assigned employees:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getWorkNotAssignedEmployeesList = async (req, res) => {
    try {
        const { companyId, country } = req.query;
        const employees = await getNotAssignedEmployees(companyId, country);
        res.status(200).json(employees);
    } catch (error) {
        console.error("Error getting unassigned employees:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { employee_id, employee_leaving_date, ...updateData } = req.body;

        if (!employee_id) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        const employee_lwd = formatDateForDB(employee_leaving_date);

        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        Object.entries(updateData).forEach(([key, value]) => {
            setClauses.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        });

        setClauses.push(`employee_lwd = $${paramIndex}`);
        values.push(employee_lwd);
        paramIndex++;
        values.push(employee_id);

        const query = `
            UPDATE employee_list 
            SET ${setClauses.join(', ')}
            WHERE employee_id = $${paramIndex}
            RETURNING *;
        `;

        const result = await dbConn.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json({
            message: "Employee updated successfully",
            employee: {
                ...result.rows[0],
                employee_leaving_date: formatDateForDisplay(result.rows[0].employee_lwd),
                documents: result.rows[0].documents ? safeJsonParse(result.rows[0].documents) : []
            }
        });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({
            message: "Failed to update employee",
            error: error.message
        });
    }
};

const updateEmployeeField = async (req, res) => {
    try {
        let { employeeId, field, value } = req.body;

        if (!employeeId || !field) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (field === 'employee_leaving_date') {
            field = 'employee_lwd';
            value = formatDateForDB(value);
        }

        const query = `
            UPDATE employee_list 
            SET ${field} = $1
            WHERE employee_id = $2
            RETURNING *;
        `;

        const result = await dbConn.query(query, [value, employeeId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({
            message: 'Update successful',
            employee: {
                ...result.rows[0],
                employee_leaving_date: formatDateForDisplay(result.rows[0].employee_lwd),
                documents: safeJsonParse(result.rows[0].documents)
            }
        });
    } catch (error) {
        console.error("Field update error:", error);
        res.status(500).json({
            message: 'Failed to update field',
            error: error.message
        });
    }
};

const createEmployee = async (req, res) => {
    console.log("Creating employee with data:", req.body);
    try {
        await dbConn.query('BEGIN');

        const {
            employee_name, employee_email, employee_mobile_number, employee_gender,
            employee_country, employee_city, employee_working_company, employee_DOJ,
            employee_designation, employee_status, work_type, relationship_type,
            employee_ctc, employee_username, employee_password, company_id
        } = req.body;

        // Insert into employee_list
        const employeeQuery = `
            INSERT INTO employee_list (
                employee_name, employee_email, employee_mobile_number, employee_gender,
                employee_country, employee_city, employee_working_company, employee_DOJ,
                employee_designation, employee_status, work_type, relationship_type,
                employee_ctc, employee_username, employee_password, company_id, employee_lwd,
                profile_picture, documents
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14, $15, $16,
                NULL, NULL, '[]'::json
            )
            RETURNING employee_id;
        `;

        const employeeValues = [
            employee_name, employee_email, employee_mobile_number, employee_gender,
            employee_country, employee_city, employee_working_company, employee_DOJ,
            employee_designation, employee_status, work_type, relationship_type,
            employee_ctc, employee_username, employee_password, company_id
        ];

        const result = await dbConn.query(employeeQuery, employeeValues);
        const employee_id = result.rows[0].employee_id;

        // ✅ Check if employee_id already exists in employee_salary_details
        const checkSalaryQuery = `
            SELECT 1 FROM employee_salary_details WHERE employee_id = $1
        `;
        const checkResult = await dbConn.query(checkSalaryQuery, [employee_id]);

        if (checkResult.rowCount === 0) {
            // Insert into employee_salary_details
            const salaryQuery = `
                INSERT INTO employee_salary_details (
                    employee_id, employee_name, relationship_type, ctc, payment_done, doj
                ) VALUES ($1, $2, $3, $4, false, $5)
            `;

            const salaryValues = [
                employee_id, employee_name, relationship_type, employee_ctc, employee_DOJ
            ];

            await dbConn.query(salaryQuery, salaryValues);
        } else {
            console.warn(`Salary already exists for employee_id: ${employee_id}. Skipping salary insert.`);
        }

        await dbConn.query('COMMIT');
        res.status(201).json({ message: 'Employee created successfully' });

    } catch (error) {
        await dbConn.query('ROLLBACK');
        console.error("Create employee error:", error);
        res.status(500).json({ message: 'Failed to create employee' });
    }
};



// const createEmployee = async (req, res) => {
//     try {
//         await dbConn.query('BEGIN');

//         const {
//             employee_name, employee_email, employee_mobile_number, employee_gender,
//             employee_country, employee_city, employee_working_company, employee_DOJ,
//             employee_designation, employee_status, work_type, relationship_type,
//             employee_ctc, employee_username, employee_password, company_id
//         } = req.body;

//         const employeeQuery = `
//             INSERT INTO employee_list (
//                 employee_name, employee_email, employee_mobile_number, employee_gender,
//                 employee_country, employee_city, employee_working_company, employee_DOJ,
//                 employee_designation, employee_status, work_type, relationship_type,
//                 employee_ctc, employee_username, employee_password, company_id, employee_lwd,
//                 profile_picture, documents
//             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NULL, NULL, '[]'::json)
//             RETURNING employee_id;
//         `;

//         const employeeValues = [
//             employee_name, employee_email, employee_mobile_number, employee_gender,
//             employee_country, employee_city, employee_working_company, employee_DOJ,
//             employee_designation, employee_status, work_type, relationship_type,
//             employee_ctc, employee_username, employee_password, company_id
//         ];

//         const result = await dbConn.query(employeeQuery, employeeValues);
//         const employee_id = result.rows[0].employee_id;

//         await dbConn.query('COMMIT');
//         res.status(201).json({ message: 'Employee created successfully' });
//     } catch (error) {
//         await dbConn.query('ROLLBACK');
//         console.error("Create employee error:", error);
//         res.status(500).json({ message: 'Failed to create employee' });
//     }
// };

const deleteEmployee = async (req, res) => {
    try {
        const { employee_id } = req.query;
        if (!employee_id) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        await deleteEmployeById(employee_id);
        res.status(200).json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Failed to delete employee" });
    }
};

const assignEmployeeCompanies = async (req, res) => {
    try {
        const { employee_id, country, companies } = req.body;

        if (!employee_id || !country || !companies) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        await assignCompanies(employee_id, country, companies);
        res.status(200).json({ message: "Companies assigned successfully" });
    } catch (error) {
        console.error("Assignment error:", error);
        res.status(500).json({ message: "Failed to assign companies" });
    }
};

const updateEmployeeAssignment = async (req, res) => {
    try {
        const { employee_id, country, companies } = req.body;

        if (!employee_id || !country || !companies) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        await changeAssignCompanies(employee_id, country, companies);
        res.status(200).json({ message: "Assignment updated successfully" });
    } catch (error) {
        console.error("Update assignment error:", error);
        res.status(500).json({ message: "Failed to update assignment" });
    }
};

const getEmployeeFiles = async (req, res) => {
    try {
        const { employee_id } = req.query;

        if (!employee_id) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        const files = await getEmployeeFilesFromDB(employee_id);
        res.status(200).json({
            profile_picture: files.profile_picture ?
                `${process.env.REACT_APP_API_URL || ''}${files.profile_picture}` :
                null,
            documents: safeJsonParse(files.documents).map(doc => ({
                ...doc,
                url: doc.url.startsWith('http') ? doc.url :
                    `${process.env.REACT_APP_API_URL || ''}${doc.url}`
            }))
        });
    } catch (error) {
        console.error("Error getting employee files:", error);
        res.status(500).json({ message: "Failed to get employee files" });
    }
};

const deleteEmployeeDocument = async (req, res) => {
    try {
        const { employee_id, document_index } = req.body;

        if (!employee_id || document_index === undefined) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await removeEmployeeDocument(employee_id, parseInt(document_index));
        res.status(200).json({
            message: "Document removed successfully",
            documents: safeJsonParse(result.documents)
        });
    } catch (error) {
        console.error("Error removing document:", error);
        res.status(500).json({ message: "Failed to remove document" });
    }
};

const deleteProfilePicture = async (req, res) => {
    try {
        const { employee_id } = req.query;

        if (!employee_id) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        // First get the current picture path
        const current = await dbConn.query(
            `SELECT profile_picture FROM employee_list WHERE employee_id = $1`,
            [employee_id]
        );

        const picturePath = current.rows[0]?.profile_picture;

        if (picturePath) {
            // Delete the physical file
            const fullPath = path.join(__dirname, '../', picturePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        // Update database
        await dbConn.query(
            `UPDATE employee_list SET profile_picture = NULL WHERE employee_id = $1`,
            [employee_id]
        );

        res.status(200).json({
            success: true,
            message: "Profile picture deleted successfully"
        });
    } catch (error) {
        console.error("Delete profile picture error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete profile picture",
            error: error.message
        });
    }
};

module.exports = {
    getAllEmployeeDesignation,
    getEmployeeDetail,
    getAllEmployeeDetails,
    getAllWorkAssignedCompany,
    getWorkAssignedEmployeesList,
    getWorkNotAssignedEmployeesList,
    createEmployee,
    updateEmployee,
    updateEmployeeField,
    assignEmployeeCompanies,
    updateEmployeeAssignment,
    deleteEmployee,
    uploadProfilePicture,
    uploadDocuments,
    getEmployeeFiles,
    deleteEmployeeDocument,
    deleteProfilePicture
};







{/*const dbConn = require("../config/DB");
const {
    getEmployeeDesignation,
    getAllEmployees,
    getWorkAssignedCompany,
    getAssignedEmployees,
    getNotAssignedEmployees,
    addEmployee,
    assignCompanies,
    changeAssignCompanies,
    deleteEmployeById
} = require('../models/employeeModel');

const getAllEmployeeDesignation = async (req, res) => {
    try {
        const EmployeeDesignation = await getEmployeeDesignation();
        res.status(200).json(EmployeeDesignation);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllEmployeeDetails = async (req, res) => {
    try {
        const { companyId, country, role } = req.user;

        if (role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const AllEmployeeDetails = await getAllEmployees(companyId, country);
        res.status(200).json(AllEmployeeDetails);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllWorkAssignedCompany = async (req, res) => {
    try {
        const AllWorkAssignedCompany = await getWorkAssignedCompany();
        res.status(200).json(AllWorkAssignedCompany);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getWorkAssignedEmployeesList = async (req, res) => {
    try {
        const { companyId, country } = req.query;
        const AllWorkAssignedEmployees = await getAssignedEmployees(companyId, country);
        res.status(200).json(AllWorkAssignedEmployees);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getWorkNotAssignedEmployeesList = async (req, res) => {
    try {
        const { companyId, country } = req.query;
        const AllWorkNotAssignedEmployees = await getNotAssignedEmployees(companyId, country);
        res.status(200).json(AllWorkNotAssignedEmployees);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ✅ Update full employee (for frontend Save button)
const updateEmployee = async (req, res) => {
    try {
        const {
            employee_id,
            employee_name,
            employee_working_company,
            employee_designation,
            work_type,
            employee_ctc,
            employee_gender,
            employee_status,
            relationship_type,
            employee_username,
            employee_password,
            employee_email,
            employee_mobile_number
        } = req.body;

        if (!employee_id) {
            return res.status(400).json({ message: "Employee ID is required" });
        }

        const query = `
            UPDATE employee_list SET
                employee_name = $1,
                employee_working_company = $2,
                employee_designation = $3,
                work_type = $4,
                employee_ctc = $5,
                employee_gender = $6,
                employee_status = $7,
                relationship_type = $8,
                employee_username = $9,
                employee_password = $10,
                employee_email = $11,
                employee_mobile_number = $12
            WHERE employee_id = $13
            RETURNING *;
        `;

        const values = [
            employee_name,
            employee_working_company,
            employee_designation,
            work_type,
            employee_ctc,
            employee_gender,
            employee_status,
            relationship_type,
            employee_username,
            employee_password,
            employee_email,
            employee_mobile_number,
            employee_id
        ];

        const result = await dbConn.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }

        res.status(200).json({
            message: "Employee updated successfully",
            employee: result.rows[0]
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateEmployeeField = async (req, res) => {
    try {
        const { employeeId, field, value } = req.body;

        if (!employeeId || !field || value === undefined) {
            return res.status(400).json({ message: "Invalid data provided" });
        }

        const query = `UPDATE employee_list SET ${field} = $1 WHERE employee_id = $2 RETURNING *`;
        const values = [value, employeeId];

        const result = await dbConn.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee updated successfully', employee: result.rows[0] });
    } catch (error) {
        console.error("Error updating employee field:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createEmployee = async (req, res) => {
    try {
        await dbConn.query('BEGIN');

        const {
            employee_name, employee_email, employee_mobile_number, employee_gender, employee_country, employee_city,
            employee_working_company, employee_DOJ, employee_designation, employee_status, work_type, relationship_type,
            employee_ctc, employee_username, employee_password, company_id, payment_done, month, month_date, year,
            basic_salary, hra, pf, tds, advance_payback, remarks, conveyance_allowances, medical_reimbursement
        } = req.body;

        const employeeQuery = `
            INSERT INTO employee_list (
            employee_name, employee_email, employee_mobile_number, employee_gender, employee_country, employee_city,
            employee_working_company, employee_DOJ, employee_designation, employee_status, work_type, relationship_type, employee_ctc,
            employee_username, employee_password, company_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING employee_id;
        `;

        const employeeValues = [
            employee_name, employee_email, employee_mobile_number, employee_gender, employee_country, employee_city,
            employee_working_company, employee_DOJ, employee_designation, employee_status, work_type, relationship_type,
            employee_ctc, employee_username, employee_password, company_id
        ];

        const result = await dbConn.query(employeeQuery, employeeValues);
        const employee_id = result.rows[0].employee_id;

        const formatValue = (value) => {
            return value === undefined || value === null ? null : !isNaN(value) ? Number(value) : value;
        };

        const salaryDetails = [
            payment_done, month, month_date, year, relationship_type,
            employee_id, employee_username, employee_DOJ,
            formatValue(basic_salary), formatValue(hra), formatValue(conveyance_allowances),
            formatValue(medical_reimbursement), formatValue(pf), formatValue(tds),
            formatValue(advance_payback), formatValue(remarks)
        ];

        const salaryQuery = `
            INSERT INTO employee_salary_details (
                payment_done, month, month_date, year, relationship_type,
                employee_id, employee_name, doj, basic_salary, hra, conveyance_allowances,
                medical_reimbursement, pf, tds, advance_payback, remarks
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NULLIF($16, ''))
            ON CONFLICT (employee_id) 
            DO UPDATE SET
                payment_done = EXCLUDED.payment_done,
                month = EXCLUDED.month,
                month_date = EXCLUDED.month_date,
                year = EXCLUDED.year,
                relationship_type = EXCLUDED.relationship_type,
                employee_name = EXCLUDED.employee_name,
                doj = EXCLUDED.doj,
                basic_salary = EXCLUDED.basic_salary,
                hra = EXCLUDED.hra,
                conveyance_allowances = EXCLUDED.conveyance_allowances,
                medical_reimbursement = EXCLUDED.medical_reimbursement,
                pf = EXCLUDED.pf,
                tds = EXCLUDED.tds,
                advance_payback = EXCLUDED.advance_payback,
                remarks = EXCLUDED.remarks,
                gross_salary = EXCLUDED.basic_salary + EXCLUDED.hra + EXCLUDED.conveyance_allowances + EXCLUDED.medical_reimbursement,
                total_deductions = EXCLUDED.pf + EXCLUDED.tds + EXCLUDED.advance_payback,
                net_payable_salary = (EXCLUDED.basic_salary + EXCLUDED.hra + EXCLUDED.conveyance_allowances + EXCLUDED.medical_reimbursement) 
                                    - (EXCLUDED.pf + EXCLUDED.tds + EXCLUDED.advance_payback);
        `;

        await dbConn.query(salaryQuery, salaryDetails);
        await dbConn.query('COMMIT');

        res.status(201).json({ message: 'Employee registered successfully' });
    } catch (error) {
        await dbConn.query('ROLLBACK');
        console.error("Transaction error:", error);
        res.status(500).json({ error: 'Employee registration failed' });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { employee_id } = req.query;
        if (!employee_id) {
            return res.status(400).json({ error: "Employee ID is required" });
        }

        await deleteEmployeById(employee_id);
        res.json({ message: "Employee deleted successfully." });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error deleting employee." });
    }
};

const assignEmployeeCompanies = async (req, res) => {
    try {
        const { employee_id, country, companies } = req.body;

        if (!employee_id || !country || !companies) {
            return res.status(400).json({ message: "Employee ID, country, and companies are required" });
        }

        await assignCompanies(employee_id, country, companies);
        res.status(200).json({ message: "Companies assigned successfully" });
    } catch (error) {
        console.error("Error assigning companies:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateEmployeeAssignment = async (req, res) => {
    try {
        const { employee_id, country, companies } = req.body;

        if (!employee_id || !country || !companies) {
            return res.status(400).json({ message: "Employee ID, country, and companies are required" });
        }

        await changeAssignCompanies(employee_id, country, companies);
        res.status(200).json({ message: "Assigned companies updated successfully" });
    } catch (error) {
        console.error("Error updating assigned companies:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ✅ Final Export
module.exports = {
    getAllEmployeeDesignation,
    getAllEmployeeDetails,
    getAllWorkAssignedCompany,
    getWorkAssignedEmployeesList,
    getWorkNotAssignedEmployeesList,
    createEmployee,
    updateEmployee,               // 👈 Added full update function
    updateEmployeeField,
    assignEmployeeCompanies,
    updateEmployeeAssignment,
    deleteEmployee
};
*/}









{/*const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const { getEmployeeDesignation, getAllEmployees, getWorkAssignedCompany, getAssignedEmployees,
    getNotAssignedEmployees, addEmployee, assignCompanies, changeAssignCompanies, deleteEmployeById } = require('../models/employeeModel');

const getAllEmployeeDesignation = async (req, res) => {
    try {
        console.log('DB entered to designation....');

        const EmployeeDesignation = await getEmployeeDesignation(); // Fetch data using the model function

        res.status(200).json(EmployeeDesignation);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllEmployeeDetails = async (req, res) => {
    try {
        console.log('DB entered to employee list....');
        const { companyId, country, role } = req.user;
        console.log(`companyID: ${companyId}, role: ${role}`);

        // Restrict access: Only "admin" roles can access employee details
        if (role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        // Fetch only employees of the logged-in user's company
        const AllEmployeeDetails = await getAllEmployees(companyId, country);

        res.status(200).json(AllEmployeeDetails);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const getAllWorkAssignedCompany = async (req, res) => {
    try {
        console.log('DB entered to work_assign_company_list....');

        const AllWorkAssignedCompany = await getWorkAssignedCompany(); // Fetch data using the model function

        res.status(200).json(AllWorkAssignedCompany);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getWorkAssignedEmployeesList = async (req, res) => {
    try {
        console.log('DB entered to work_assign_employees....');
        const { companyId, country } = req.query;

        const AllWorkAssignedEmployees = await getAssignedEmployees(companyId, country); // Fetch data using the model function

        res.status(200).json(AllWorkAssignedEmployees);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }

};

const getWorkNotAssignedEmployeesList = async (req, res) => {
    try {
        console.log('DB entered to work_assign_employees....');

        const { companyId, country } = req.query;

        const AllWorkNotAssignedEmployees = await getNotAssignedEmployees(companyId, country); // Fetch data using the model function

        res.status(200).json(AllWorkNotAssignedEmployees);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }

};

// const createEmployee = async (req, res) => {
//     try {
//         const {
//             employee_name, employee_email, employee_mobile_number, employee_gender, employee_country, employee_city,
//             employee_working_company, employee_DOJ, employee_designation, employee_status, work_type, relationship_type, employee_ctc,
//             employee_username, employee_password, company_id
//         } = req.body;

//         // Basic input validation
//         if (!employee_name || !employee_username || !employee_password) {
//             return res.status(400).json({ message: "Employee name, username, and password are required" });
//         }

//         await addEmployee({
//             employee_name, employee_email, employee_mobile_number, employee_gender, employee_country, employee_city,
//             employee_working_company, employee_DOJ, employee_designation, employee_status, work_type, relationship_type, employee_ctc,
//             employee_username, employee_password, company_id
//         });

//         res.status(201).json({ message: "Employee added successfully!" });

//     } catch (error) {
//         console.error("Database query error:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

const createEmployee = async (req, res) => {
    // const client = await dbConn.connect(); // Get a client connection
    try {
        await dbConn.query('BEGIN'); // Start transaction
        console.log("🔄 Transaction started...");

        const {
            employee_name, employee_email, employee_mobile_number, employee_gender, employee_country, employee_city,
            employee_working_company, employee_DOJ, employee_designation, employee_status, work_type, relationship_type,
            employee_ctc, employee_username, employee_password, company_id, payment_done, month, month_date, year,
            basic_salary, hra, pf, tds, advance_payback, remarks, conveyance_allowances, medical_reimbursement

        } = req.body;

        console.log("📩 Received Employee Data:", req.body);

        // Insert into employee_list and get the generated employee_id
        const employeeQuery = `
            INSERT INTO employee_list (
            employee_name, employee_email, employee_mobile_number, employee_gender, employee_country, employee_city,
            employee_working_company, employee_DOJ, employee_designation, employee_status, work_type, relationship_type, employee_ctc,
            employee_username, employee_password, company_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING employee_id;
        `;
        const employeeValues = [
            employee_name, employee_email, employee_mobile_number, employee_gender, employee_country, employee_city,
            employee_working_company, employee_DOJ, employee_designation, employee_status, work_type, relationship_type,
            employee_ctc, employee_username, employee_password, company_id
        ];

        const result = await dbConn.query(employeeQuery, employeeValues);
        const employee_id = result.rows[0].employee_id; // Get the auto-generated employee_id

        console.log(`✅ Employee inserted successfully with ID: ${employee_id}`);

        const formatValue = (value) => {
            if (value === undefined || value === null) {
                return null;  // Convert empty values to NULL
            }
            return !isNaN(value) ? Number(value) : value; // Convert numeric strings to numbers
        };

        const salaryDetails = [
            payment_done,
            month,
            month_date,
            year,
            relationship_type,
            employee_id,
            employee_username,
            employee_DOJ,
            formatValue(basic_salary),
            formatValue(hra),
            formatValue(conveyance_allowances),
            formatValue(medical_reimbursement),
            formatValue(pf),
            formatValue(tds),
            formatValue(advance_payback),
            formatValue(remarks),
        ];


        // Insert into employee_salary_details
        const salaryQuery = `
            INSERT INTO employee_salary_details (
                payment_done, month, month_date, year, relationship_type,
                employee_id, employee_name, doj, basic_salary, hra, conveyance_allowances,
                medical_reimbursement, pf, tds, advance_payback, remarks
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NULLIF($16, ''))
            ON CONFLICT (employee_id) 
            DO UPDATE SET
                payment_done = EXCLUDED.payment_done,
                month = EXCLUDED.month,
                month_date = EXCLUDED.month_date,
                year = EXCLUDED.year,
                relationship_type = EXCLUDED.relationship_type,
                employee_name = EXCLUDED.employee_name,
                doj = EXCLUDED.doj,
                basic_salary = EXCLUDED.basic_salary,
                hra = EXCLUDED.hra,
                conveyance_allowances = EXCLUDED.conveyance_allowances,
                medical_reimbursement = EXCLUDED.medical_reimbursement,
                pf = EXCLUDED.pf,
                tds = EXCLUDED.tds,
                advance_payback = EXCLUDED.advance_payback,
                remarks = EXCLUDED.remarks,
                -- Manually trigger salary calculations
                gross_salary = EXCLUDED.basic_salary + EXCLUDED.hra + EXCLUDED.conveyance_allowances + EXCLUDED.medical_reimbursement,
                total_deductions = EXCLUDED.pf + EXCLUDED.tds + EXCLUDED.advance_payback,
                net_payable_salary = (EXCLUDED.basic_salary + EXCLUDED.hra + EXCLUDED.conveyance_allowances + EXCLUDED.medical_reimbursement) 
                                    - (EXCLUDED.pf + EXCLUDED.tds + EXCLUDED.advance_payback);
            `;

        await dbConn.query(salaryQuery, salaryDetails);


        console.log("📤 Inserting salary details:", salaryDetails);
        await dbConn.query('COMMIT'); // Commit transaction
        console.log("✅ Transaction committed successfully!");

        res.status(201).json({ message: 'Employee registered successfully' });
    } catch (error) {
        await dbConn.query('ROLLBACK'); // Rollback if an error occurs
        console.error("❌ Transaction error! Rolling back...", error);
        res.status(500).json({ error: 'Employee registration failed' });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { employee_id } = req.query;
        if (!employee_id) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        await deleteEmployeById(employee_id); // Ensure correct model function call
        res.json({ message: "Company deleted successfully." });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error deleting company." });
    }
};

const assignEmployeeCompanies = async (req, res) => {
    try {
        console.log("DB entered in assignCompanies .....");

        const { employee_id, country, companies } = req.body;

        console.log("Incoming Request Body:", req.body);

        // Validate input
        if (!employee_id || !country || !companies) {
            return res.status(400).json({ message: "Employee ID, country, and companies are required" });
        }

        await assignCompanies(employee_id, country, companies);

        res.status(201).json({ message: "Employee work assigned successfully!" });

    } catch (error) {
        console.error("Error assigning employee work:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateEmployeeAssignment = async (req, res) => {
    try {
        console.log("Entered in changeAssignCompanies...");

        const { employee_id, country, companies } = req.body;
        console.log("Selected Employee ID:", employee_id);
        console.log("Selected Country ID:", country);
        console.log("Selected Companies:", companies);

        if (!employee_id || !country || !companies) {
            return res.status(400).json({ message: "Employee ID, country, and companies are required" });
        }

        const result = await changeAssignCompanies(employee_id, country, companies);

        res.status(200).json(result);
    } catch (error) {
        console.error("Error updating employee assignment:", error);
        res.status(500).json({ message: error.message });
    }
};



module.exports = {
    getAllEmployeeDesignation, getAllEmployeeDetails, getAllWorkAssignedCompany, getWorkAssignedEmployeesList,
    getWorkNotAssignedEmployeesList, createEmployee, assignEmployeeCompanies, updateEmployeeAssignment, deleteEmployee
};  */}