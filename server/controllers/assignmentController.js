const model = require('../models/assignmentModel');
const dbConn = require("../config/DB");

exports.getReportsToOptions = async (req, res) => {
    const { employeeId } = req.query;

    try {
        const result = await dbConn.query(
            "SELECT employee_designation FROM employee_list WHERE employee_id = $1",
            [employeeId]
        );

        const designation = result.rows[0]?.employee_designation;

        if (!designation) return res.status(404).json({ error: "Employee not found" });

        // Define hierarchy
        const hierarchyMap = {
            "Recruiter": ["Account Manager"],
            "Account Manager": ["Director"],
            "Director": ["Senior Director"],
            "Senior Director": ["Sales Director", "Sales Manager"],
            // Add other designations as needed
        };

        const allowedDesignations = hierarchyMap[designation] || [];

        // Fetch eligible employees
        const reportsToResult = await dbConn.query(
            "SELECT employee_id, employee_name, employee_designation FROM employee_list WHERE employee_designation = ANY($1)",
            [allowedDesignations]
        );

        res.json(reportsToResult.rows);
    } catch (err) {
        console.error("Error fetching reports-to options:", err);
        res.status(500).json({ error: "Server error" });
    }
};


// Controller: updateReportsTo
exports.updateReportsTo = async (req, res) => {
    const { employee_id, reports_to } = req.body;

    if (!employee_id || !reports_to) {
        return res.status(400).json({ message: "Missing employee_id or reports_to" });
    }

    try {
        const result = await dbConn.query(
            `UPDATE employee_list SET reports_to = $1, work_assign = $3 WHERE employee_id = $2`,
            [reports_to, employee_id, "assigned"]
        );

        return res.status(200).json({ message: "Reports-to updated successfully" });
    } catch (err) {
        console.error("Error updating reports_to:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getclientAssignments = async (req, res) => {
    console.log("Fetching client assignments...");
    const { companyId, country } = req.query;
    if (!companyId || !country) {
        return res.status(400).json({ msg: "Company ID and country are required." });
    }
    console.log("Company ID:", companyId, "Country:", country);
    try {
        const result = await dbConn.query(
            `SELECT ca.customer_id, ca.recruiter_id, e.employee_name AS recruiter_name, C.customer_name
                FROM customer_assignment ca
                JOIN employee_list e ON ca.recruiter_id = e.employee_id
                JOIN customers_detail c ON ca.customer_id = c.customer_id
                where ca.company_id = $1 AND ca.country = $2
                ORDER BY ca.customer_id`
            , [companyId, country]);
        if (result.rowCount === 0) {
            return res.status(404).json({ msg: "No assignments found." });
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching client assignments:", error);
        res.status(500).json({ msg: "Server error" });
    }
};


// Assign customer to recruiter
exports.assignCustomer = async (req, res) => {
    const { customer_id, recruiter_id, company_id, country } = req.body;

    // Basic validation
    if (!customer_id || !recruiter_id || !company_id || !country) {
        return res.status(400).json({ msg: "Missing required fields!" });
    }

    try {
        // Check if this customer is already assigned in the same company and country
        const check = await dbConn.query(
            `SELECT * FROM customer_assignment 
             WHERE customer_id = $1 AND company_id = $2 AND country = $3`,
            [customer_id, company_id, country]
        );

        if (check.rowCount > 0) {
            return res.status(400).json({ msg: "Customer already assigned!" });
        }

        // Verify that the employee is a Recruiter
        const verifyRecruiter = await dbConn.query(
            `SELECT * FROM employee_list 
             WHERE employee_id = $1 AND employee_designation = 'Recruiter'`,
            [recruiter_id]
        );

        if (verifyRecruiter.rowCount === 0) {
            return res.status(400).json({ msg: "Invalid recruiter ID or not a Recruiter!" });
        }

        // Insert new assignment
        await dbConn.query(
            `INSERT INTO customer_assignment 
             (customer_id, recruiter_id, company_id, country) 
             VALUES ($1, $2, $3, $4)`,
            [customer_id, recruiter_id, company_id, country]
        );

        res.status(200).json({ msg: "Customer assigned successfully." });

    } catch (error) {
        console.error("Error assigning customer:", error);
        res.status(500).json({ msg: "Server error" });
    }
};

exports.getallrecruiters = async (req, res) => {
    console.log("Fetching all recruiters...");
    const { companyId, country } = req.query;
    if (!companyId || !country) {
        return res.status(400).json({ msg: "Company ID and country are required." });
    }
    console.log("Company ID:", companyId, "Country:", country);
    try {
        const result = await dbConn.query(
            "SELECT employee_id, employee_name FROM employee_list WHERE employee_designation = 'Recruiter' and work_assign = 'assigned' and company_id = $1 and employee_country = $2 ORDER BY employee_name"
            , [companyId, country]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: "No recruiters found." });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching recruiters:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

exports.getallclients = async (req, res) => {
    console.log("Fetching all clients...");
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ msg: "Company ID required." });
    }
    console.log("Company ID:", companyId);
    try {
        const result = await dbConn.query(
            "SELECT customer_id, customer_name FROM customers_detail WHERE company_id = $1 ORDER BY customer_name"
            , [companyId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: "No clients found." });
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ msg: "Server error" });
    }
}