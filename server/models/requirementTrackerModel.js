const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const requirementTracker = {
    allRequirementTrackerDetails: async (companyId, employeeId, designation) => {
        console.log("Company ID:", companyId);
        console.log("Employee ID:", employeeId);
        console.log("Designation:", designation);

        let result;

        // 1. Fetch requirements
        if (designation === 'Recruiter') {
            result = await dbConn.query(`
            SELECT * FROM requirements
            WHERE company_id = $1 AND recruiter_id = $2;
        `, [companyId, employeeId]);
        } else {
            result = await dbConn.query(`
            SELECT * FROM requirements
            WHERE company_id = $1;
        `, [companyId]);
        }

        const requirements = result.rows;
        console.log("Fetched Requirements:", requirements);
        if (requirements.length === 0) {
            return [];
        }
        console.log("Requirements fetched successfully:", requirements);


        // 2. Loop through each requirement and check candidate's latest updated_at
        for (const req of requirements) {
            const reqId = req.req_id;

            // 3. Fetch the latest candidate updated_at for this requirement
            const candidateResult = await dbConn.query(`
            SELECT MAX(interview_status_updated_at) AS latest_update
            FROM candidate_tracker
            WHERE req_id = $1;
        `, [reqId]);

            const latestUpdate = candidateResult.rows[0].latest_update;

            if (latestUpdate) {
                const reqDate = new Date(req.req_date);
                const lastUpdateDate = new Date(latestUpdate);
                const diffDays = Math.floor((lastUpdateDate - reqDate) / (1000 * 60 * 60 * 24));

                // 4. If difference is more than 15 days, update status to 'Close'
                if (diffDays > 15 && req.status !== 'Close') {
                    await dbConn.query(`
                    UPDATE requirements
                    SET status = 'Close'
                    WHERE req_id = $1;
                `, [reqId]);
                }
            }
        }

        // 5. Fetch updated list again (optional, if you want to return fresh values)
        const finalResult = await dbConn.query(`
        SELECT 
            rt.req_id,
            rt.company_id,
            c.customer_name,
            cd.call_name,
            rt.account_manager, 
            rt.year,
            rt.month,
            rt.region,
            rt.req_date,
            rt.category,
            rt.requirement,
            rt.status,
            rt.tech_skill,
            rt.hire_type,
            rt.number_of_positions,
            rt.experience,
            rt.location,
            rt.mode,
            rt.ctc_budget,
            rt.recruiter_id,
            emp.employee_name AS recruiter,
            rt.client_id,
            rt.poc_id
        FROM requirements rt
        JOIN customers_detail c ON rt.client_id = c.customer_id
        JOIN customer_contacts cd ON rt.poc_id = cd.contact_id
        JOIN employee_list emp ON rt.recruiter_id = emp.employee_id
        WHERE rt.company_id = $1
        ${designation === 'Recruiter' ? `AND rt.recruiter_id = $2` : ''}
        ORDER BY rt.req_id ASC;
    `, designation === 'Recruiter' ? [companyId, employeeId] : [companyId]);

        console.log("Final Requirements List:", finalResult.rows);
        return finalResult.rows;
    },

    addRequirementTrackerDetails: async () => {
        const result = await dbConn.query(`
            SELECT 
                rt.req_id,
                rt.company_id,
                c.customer_name,
                cd.call_name,
                rt.account_manager, 
                rt.sr_no,
                rt.year,
                rt.month,
                rt.region,
                rt.req_date,
                rt.category,
                rt.requirement,
                rt.status,
                rt.tech_skill,
                rt.hire_type,
                rt.number_of_positions,
                rt.experience,
                rt.location,
                rt.mode,
                rt.ctc_budget,
                rt.recruiter_id
            FROM requirements rt
            JOIN customers_detail c ON rt.client_id = c.customer_id
            JOIN customer_contacts cd ON rt.poc_id = cd.contact_id
            WHERE rt.company_id = $1;
        `, [companyId]);

        return result.rows;
    },

    // Fetch stored files
    getRequirementFiles: async (id) => {
        const query = "SELECT detailed_attachment, key_skills_jd, req_id FROM requirements WHERE req_id = $1";
        const result = await dbConn.query(query, [id]);

        return result.rows[0];
    },

    getRequirementfromRequirement: async (companyId) => {
        const query = "SELECT req_id, requirement  FROM requirements WHERE company_id = $1";
        const result = await dbConn.query(query, [companyId]);

        return result.rows;
    },



    // Function to generate new req_id
    getNextReqId: async () => {
        const result = await dbConn.query("SELECT nextval('req_id_seq') AS next_id");
        return `REQ-${String(result.rows[0].next_id).padStart(3, "0")}`;
    },


    updateRequirementFiles: async (data) => {
        const { req_id, ...fieldsToUpdate } = data;

        const keys = Object.keys(fieldsToUpdate);

        if (keys.length === 0) return;

        const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");
        const values = Object.values(fieldsToUpdate);

        const query = `
            UPDATE requirements SET ${setClause} WHERE req_id = $${keys.length + 1}
        `;

        values.push(req_id); // Add req_id as last value for WHERE clause

        await dbConn.query(query, values);
    },

    uploadRequirementExcel: async (requirementData) => {
        try {
            const query = `
                   INSERT INTO requirements 
                    ( company_id, account_manager, year, month, region, req_date, category, requirement, status, tech_skill,
                      hire_type, number_of_positions, experience, location, mode, ctc_budget, recruiter_id, client_id, poc_id)  
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
                    RETURNING *;
                `;

            const values = [
                requirementData.company_id,
                requirementData.account_manager,
                requirementData.year,
                requirementData.month,
                requirementData.region,
                requirementData.req_date,
                requirementData.category,
                requirementData.requirement,
                requirementData.status,
                requirementData.tech_skill,
                requirementData.hire_type,
                requirementData.number_of_positions,
                requirementData.experience,
                requirementData.location,
                requirementData.mode,
                requirementData.ctc_budget,
                requirementData.recruiter_id,
                requirementData.client_id,
                requirementData.poc_id
            ];

            // ContactData.console.log("Executing query:", query);
            console.log("Values:", values);

            const result = await dbConn.query(query, values);
            return result.rows[0];

        } catch (error) {
            console.error("Database insertion error:", error);
            throw new Error("Database insertion failed: " + error.message);
        }
    },

    // Function to insert requirement into database
    insertRequirement: async (requirementData) => {
        const {
            company_id, client_id, poc_id, account_manager, sr_no, year, month, region, req_date, category,
            requirement, status, tech_skill, hire_type, number_of_positions, experience, location, mode, ctc_budget, recruiter_id,
            detailed_attachment, key_skills_jd
        } = requirementData;

        const req_id = await requirementTracker.getNextReqId(); // 🔥 Fix Here

        const query = `
        INSERT INTO requirements (
            req_id, company_id, client_id, poc_id, account_manager, year, month, region, req_date, 
            category, requirement, status, tech_skill, hire_type, number_of_positions, experience, location, 
            mode, ctc_budget, recruiter_id, detailed_attachment, key_skills_jd
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
            $11, $12, $13, $14, $15, $16, $17, $18, 
            $19, $20, $21, $22
        )
    `;

        const values = [
            req_id, company_id, client_id, poc_id, account_manager, year, month, region, req_date,
            category, requirement, status, tech_skill, hire_type, number_of_positions, experience, location,
            mode, ctc_budget, recruiter_id, detailed_attachment, key_skills_jd
        ];

        await dbConn.query(query, values);
        return req_id;
    },

    deleteRequirements: async (req_id) => {
        await dbConn.query("DELETE FROM requirements WHERE req_id = $1", [req_id]);
    },

    updateRequirement: async (requirementData) => {
        const {
            req_id, company_id, customer_name, client_id, call_name, poc_id, account_manager, year, month, region, req_date, category,
            requirement, status, tech_skill, hire_type, number_of_positions, experience, location, mode, ctc_budget, recruiter_id

        } = requirementData;

        // const req_id = await requirementTracker.getNextReqId(); // 🔥 Fix Here

        const query = `
        UPDATE requirements SET
            company_id = $2, client_id = $3, poc_id = $4, account_manager = $5, year = $6, month = $7, region = $8, req_date = $9, 
            category = $10, requirement = $11, status = $12, tech_skill = $13, hire_type = $14, number_of_positions = $15, experience = $16, location = $17, 
            mode = $18, ctc_budget = $19, recruiter_id = $20  WHERE  req_id = $1`;

        const values = [
            req_id, company_id, client_id, poc_id, account_manager, year, month, region, req_date,
            category, requirement, status, tech_skill, hire_type, number_of_positions, experience, location,
            mode, ctc_budget, recruiter_id
        ];

        await dbConn.query(query, values);
        return req_id;
    },
    getFiles: async (req_id, field) => {
        const result = await dbConn.query(`SELECT ${field} FROM requirements WHERE req_id = $1`, [req_id]);
        return result.rows[0][field];
    },

    updateFiles: async (req_id, field, updatedFiles) => {
        await dbConn.query(`UPDATE requirements SET ${field} = $1 WHERE req_id = $2`, [JSON.stringify(updatedFiles), req_id]);
    },


};

module.exports = requirementTracker;
