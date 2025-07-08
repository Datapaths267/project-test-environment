const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const Employee = {
    getEmployeeByUsername: async (username, country) => {
        const query = `SELECT employee_id, employee_username, employee_name, employee_password, employee_designation, company_id, employee_working_company 
                       FROM employee_list 
                       WHERE employee_username = $1 and employee_country = $2`;
        const result = await dbConn.query(query, [username, country]);
        return result.rows[0];
    },

    getRecruiterDetail: async (companyId, designation) => {
        const query = `SELECT employee_id, employee_name, employee_password, employee_designation, company_id, employee_working_company 
                       FROM employee_list 
                       WHERE company_id = $1 and employee_designation = $2`;
        const result = await dbConn.query(query, [companyId, designation]);
        return result.rows;
    },

    getEmployeeDesignation: async () => {
        const query = "Select role_name from roles";
        const result = await dbConn.query(query);
        return result.rows;
    },

    getAllEmployees: async (companyId, country) => {
        const query = "SELECT * FROM employee_list WHERE company_id = $1 and employee_country= $2 ORDER BY e_id ASC";
        const result = await dbConn.query(query, [companyId, country]);
        return result.rows;
    },

    getWorkAssignedCompany: async () => {
        const query = "SELECT * FROM work_assigned_by_employees";
        const result = await dbConn.query(query);
        return result.rows;
    },

    getNotAssignedEmployees: async (companyId, country) => {
        const result = await dbConn.query(`
            SELECT * FROM employee_list WHERE work_assign = 'notAssigned' and company_id = $1 and employee_country= $2 ORDER BY e_id ASC;
        `, [companyId, country]);
        return result.rows;
    },

    getAssignedEmployees: async (companyId, country) => {
        const result = await dbConn.query(`
            SELECT * FROM employee_list WHERE work_assign = 'assigned' and company_id = $1 and employee_country= $2 ORDER BY e_id ASC;
        `, [companyId, country]);
        return result.rows;
    },

    addEmployee: async (employeeData) => {
        // Insert the employee data into employee_list table
        const insert_query = `
            INSERT INTO employee_list (
            employee_name, employee_email, employee_mobile_number, employee_gender, employee_country, employee_city,
            employee_working_company, employee_DOJ, employee_designation, employee_status, work_type, relationship_type, employee_ctc,
            employee_username, employee_password, company_id, profile_picture, documents
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NULL, '[]'::json)
            RETURNING employee_id;
        `;

        const values = [
            employeeData.employee_name, employeeData.employee_email, employeeData.employee_mobile_number, employeeData.employee_gender,
            employeeData.employee_country, employeeData.employee_city, employeeData.employee_working_company, employeeData.employee_DOJ,
            employeeData.employee_designation, employeeData.employee_status, employeeData.work_type, employeeData.relationship_type,
            employeeData.employee_ctc, employeeData.employee_username, employeeData.employee_password, employeeData.company_id
        ];

        const result = await dbConn.query(insert_query, values);
        const employee_id = result.rows[0].employee_id;

        // Now, fetch the salary details for the new employee
        const salaryDetails = await Employee.fetchSalaryDetails(employeeData.employee_name);

        // Update the Cost_vs_ROI table with salary data
        if (salaryDetails && salaryDetails.gross_salary && salaryDetails.net_payable_salary) {
            await Employee.updateCostVsROI(employeeData.employee_name, salaryDetails.gross_salary, salaryDetails.net_payable_salary, employeeData.employee_DOJ);
        }

        return employee_id;
    },

    fetchSalaryDetails: async (employeeName) => {
        const query = `
            SELECT gross_salary, net_payable_salary
            FROM employee_salary_details
            WHERE employee_name = $1
            ORDER BY month DESC
            LIMIT 1
        `;
        const result = await dbConn.query(query, [employeeName]);
        return result.rows[0];
    },

    updateCostVsROI: async (employeeName, grossSalary, netSalary, month) => {
        const cumulativeSalaryQuery = `
            SELECT SUM(salary_gross) AS cumulative_salary
            FROM Cost_vs_ROI
            WHERE employee = $1
        `;
        const cumulativeResult = await dbConn.query(cumulativeSalaryQuery, [employeeName]);

        const cumulativeSalary = cumulativeResult.rows[0].cumulative_salary || 0;
        const newCumulativeSalary = cumulativeSalary + grossSalary;

        // Insert/update the Cost_vs_ROI table
        await dbConn.query(`
            INSERT INTO Cost_vs_ROI (employee, month, salary_gross, salary_net, cumulative_salary_paid)
            VALUES ($1, $2, $3, $4, $5)
        `, [employeeName, month, grossSalary, netSalary, newCumulativeSalary]);
    },

    deleteEmployeById: async (employee_id) => {
        await dbConn.query("DELETE FROM employee_list WHERE employee_id = $1", [employee_id]);
    },

    assignCompanies: async (employee_id, country, companies) => {
        const insert_query = `
            INSERT INTO work_assigned_by_employees (
                user_id, country_id, work_assigned_companies
            ) VALUES ($1, $2, $3)
        `;

        const update_query = `
            UPDATE employee_list
            SET work_assign = 'assigned'
            WHERE employee_id = $1
        `;

        try {
            // Begin transaction
            await dbConn.query('BEGIN');

            // Insert the work assignment
            await dbConn.query(insert_query, [employee_id, country, companies]);

            // Update the employee status
            await dbConn.query(update_query, [employee_id]);

            // Commit transaction
            await dbConn.query('COMMIT');
        } catch (error) {
            // Rollback in case of an error
            await dbConn.query('ROLLBACK');
            throw error;
        }
    },

    changeAssignCompanies: async (employee_id, country, companies) => {
        try {
            await dbConn.query('BEGIN');

            // Check if the employee is already assigned to this country
            const check_query = `
                SELECT * FROM work_assigned_by_employees
                WHERE user_id = $1 AND country_id = $2;
            `;
            const checkResult = await dbConn.query(check_query, [employee_id, country]);

            if (checkResult.rows.length > 0) {
                // Update assigned companies for existing assignment
                const update_query = `
                    UPDATE work_assigned_by_employees
                    SET work_assigned_companies = $3
                    WHERE user_id = $1 AND country_id = $2;
                `;
                await dbConn.query(update_query, [employee_id, country, companies]);
            } else {
                // Insert new assignment if employee is assigned to a new country
                const insert_query = `
                    INSERT INTO work_assigned_by_employees (user_id, country_id, work_assigned_companies)
                    VALUES ($1, $2, $3);
                `;
                await dbConn.query(insert_query, [employee_id, country, companies]);
            }

            // Update employee work status
            const status_update_query = `
                UPDATE employee_list
                SET work_assign = 'assigned'
                WHERE employee_id = $1;
            `;
            await dbConn.query(status_update_query, [employee_id]);

            await dbConn.query('COMMIT');
            return { success: true, message: "Employee assignment updated successfully!" };
        } catch (error) {
            await dbConn.query('ROLLBACK');
            console.error("Database transaction error:", error);
            throw new Error("Error updating work assignment");
        }
    },

    // ================= FILE HANDLING METHODS =================
    updateEmployeeProfilePicture: async (employee_id, profile_picture) => {
        const query = `
            UPDATE employee_list 
            SET profile_picture = $1
            WHERE employee_id = $2
            RETURNING employee_id, profile_picture;
        `;
        const result = await dbConn.query(query, [profile_picture, employee_id]);
        return result.rows[0];
    },

    addEmployeeDocuments: async (employee_id, documents) => {
        // First get existing documents
        const getQuery = `SELECT documents FROM employee_list WHERE employee_id = $1`;
        const current = await dbConn.query(getQuery, [employee_id]);

        // Merge existing with new documents
        let currentDocs = current.rows[0]?.documents || '[]';
        if (typeof currentDocs === 'string') {
            currentDocs = JSON.parse(currentDocs);
        }
        const updatedDocs = [...currentDocs, ...documents];

        // Update database
        const updateQuery = `
            UPDATE employee_list 
            SET documents = $1
            WHERE employee_id = $2
            RETURNING employee_id, documents;
        `;
        const result = await dbConn.query(updateQuery, [JSON.stringify(updatedDocs), employee_id]);
        return result.rows[0];
    },

    getEmployeeFiles: async (employee_id) => {
        const query = `
            SELECT profile_picture, documents 
            FROM employee_list 
            WHERE employee_id = $1;
        `;
        const result = await dbConn.query(query, [employee_id]);
        return result.rows[0];
    },

    removeEmployeeDocument: async (employee_id, documentIndex) => {
        // Get current documents
        const getQuery = `SELECT documents FROM employee_list WHERE employee_id = $1`;
        const current = await dbConn.query(getQuery, [employee_id]);
        let documents = current.rows[0]?.documents || '[]';

        // Parse if string
        if (typeof documents === 'string') {
            documents = JSON.parse(documents);
        }

        // Remove document at index
        if (documentIndex >= 0 && documentIndex < documents.length) {
            documents.splice(documentIndex, 1);
        }

        // Update database
        const updateQuery = `
            UPDATE employee_list 
            SET documents = $1
            WHERE employee_id = $2
            RETURNING employee_id, documents;
        `;
        const result = await dbConn.query(updateQuery, [JSON.stringify(documents), employee_id]);
        return result.rows[0];
    }
};

module.exports = Employee;













{/*const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const Employee = {
    getEmployeeByUsername: async (username, country) => {
        const query = `SELECT employee_username, employee_password, employee_designation, company_id, employee_working_company 
                       FROM employee_list 
                       WHERE employee_username = $1 and employee_country = $2`;
        const result = await dbConn.query(query, [username, country]);
        return result.rows[0];
    },

    getEmployeeDesignation: async () => {
        const query = "Select role_name from roles";
        const result = await dbConn.query(query);
        return result.rows;
    },

    getAllEmployees: async (companyId, country) => {
        const query = "SELECT * FROM employee_list WHERE company_id = $1 and employee_country= $2 ORDER BY e_id ASC";
        const result = await dbConn.query(query, [companyId, country]);
        return result.rows;
    },

    getWorkAssignedCompany: async () => {
        const query = "SELECT * FROM work_assigned_by_employees";
        const result = await dbConn.query(query);
        return result.rows;
    },

    getNotAssignedEmployees: async (companyId, country) => {
        // const query = "SELECT * FROM employee_list WHERE work_assign = 'notAssigned' and company_id = $1 ORDER BY e_id ASC";
        // const VALUES = companyId;
        // const result = await dbConn.query(query);
        // return result.rows;

        const result = await dbConn.query(`
            SELECT * FROM employee_list WHERE work_assign = 'notAssigned' and company_id = $1 and employee_country= $2 ORDER BY e_id ASC;
        `, [companyId, country]);
        return result.rows;
    },

    getAssignedEmployees: async (companyId, country) => {
        // const query = "SELECT * FROM employee_list WHERE work_assign = 'assigned' ORDER BY e_id ASC";
        // const result = await dbConn.query(query);
        // return result.rows;

        const result = await dbConn.query(`
            SELECT * FROM employee_list WHERE work_assign = 'assigned' and company_id = $1 and employee_country= $2 ORDER BY e_id ASC;
        `, [companyId, country]);
        return result.rows;
    },

    addEmployee: async (employeeData) => {
        const insert_query = `
            INSERT INTO employee_list (
            employee_name, employee_email, employee_mobile_number, employee_gender, employee_country, employee_city,
            employee_working_company, employee_DOJ, employee_designation, employee_status, work_type, relationship_type, employee_ctc,
            employee_username, employee_password, company_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `;

        const values = [
            employeeData.employee_name, employeeData.employee_email, employeeData.employee_mobile_number, employeeData.employee_gender, employeeData.employee_country, employeeData.employee_city,
            employeeData.employee_working_company, employeeData.employee_DOJ, employeeData.employee_designation, employeeData.employee_status, employeeData.work_type, employeeData.relationship_type, employeeData.employee_ctc,
            employeeData.employee_username, employeeData.employee_password, employeeData.company_id
        ];

        await dbConn.query(insert_query, values);
    },

    deleteEmployeById: async (employee_id) => {
        await dbConn.query("DELETE FROM employee_list WHERE employee_id = $1", [employee_id]);
    },

    assignCompanies: async (employee_id, country, companies) => {
        const insert_query = `
            INSERT INTO work_assigned_by_employees (
                user_id, country_id, work_assigned_companies
            ) VALUES ($1, $2, $3)
        `;

        const update_query = `
            UPDATE employee_list
            SET work_assign = 'assigned'
            WHERE employee_id = $1
        `;

        try {
            // Begin transaction
            await dbConn.query('BEGIN');

            // Insert the work assignment
            await dbConn.query(insert_query, [employee_id, country, companies]);

            // Update the employee status
            await dbConn.query(update_query, [employee_id]);

            // Commit transaction
            await dbConn.query('COMMIT');
        } catch (error) {
            // Rollback in case of an error
            await dbConn.query('ROLLBACK');
            throw error; // Throw error to be handled in controller
        }
    },

    changeAssignCompanies: async (employee_id, country, companies) => {
        try {
            await dbConn.query('BEGIN');

            // Check if the employee is already assigned to this country
            const check_query = `
                SELECT * FROM work_assigned_by_employees
                WHERE user_id = $1 AND country_id = $2;
            `;
            const checkResult = await dbConn.query(check_query, [employee_id, country]);

            if (checkResult.rows.length > 0) {
                // Update assigned companies for existing assignment
                const update_query = `
                    UPDATE work_assigned_by_employees
                    SET work_assigned_companies = $3
                    WHERE user_id = $1 AND country_id = $2;
                `;
                await dbConn.query(update_query, [employee_id, country, companies]);
                console.log("Existing assignment updated.");
            } else {
                // Insert new assignment if employee is assigned to a new country
                const insert_query = `
                    INSERT INTO work_assigned_by_employees (user_id, country_id, work_assigned_companies)
                    VALUES ($1, $2, $3);
                `;
                await dbConn.query(insert_query, [employee_id, country, companies]);
                console.log("New assignment added.");
            }

            // Update employee work status
            const status_update_query = `
                UPDATE employee_list
                SET work_assign = 'assigned'
                WHERE employee_id = $1;
            `;
            await dbConn.query(status_update_query, [employee_id]);

            await dbConn.query('COMMIT');
            return { success: true, message: "Employee assignment updated successfully!" };
        } catch (error) {
            await dbConn.query('ROLLBACK');
            console.error("Database transaction error:", error);
            throw new Error("Error updating work assignment");
        }
    },
};




module.exports = Employee;  */}
