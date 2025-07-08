const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const candidateTracker = {
    candidateContents: async (companyId, employeeId, designation) => {
        console.log("Company ID:", companyId);
        console.log("Employee ID:", employeeId);
        console.log("Designation:", designation);

        // Step 1: Update candidate status where 15+ days passed since interview status updated
        const candidatesToUpdate = await dbConn.query(`
            SELECT candidate_id, candidate_created_at, interview_status_updated_at, status
            FROM candidate_tracker
            WHERE parent_company_id = $1
              AND interview_status_updated_at IS NOT NULL
              AND status != 'Close';
        `, [companyId]);

        for (const candidate of candidatesToUpdate.rows) {
            const createdAt = new Date(candidate.candidate_created_at);
            const updatedAt = new Date(candidate.interview_status_updated_at);
            const diffDays = Math.floor((updatedAt - createdAt) / (1000 * 60 * 60 * 24));

            if (diffDays > 30) {
                await dbConn.query(`
                    UPDATE candidate_tracker
                    SET status = 'Close'
                    WHERE candidate_id = $1;
                `, [candidate.candidate_id]);
            }
        }

        // Step 2: Fetch the candidate data (same as your original query)
        let result;
        if (designation === 'Recruiter') {
            result = await dbConn.query(
                `SELECT 
                    ct.candidate_id,
                    ct.parent_company_id,
                    ct.client_id,
                    ct.req_id,
                    cd.customer_name,
                    cc.call_name,
                    ct.date_of_submission,
                    ct.candidate_name,
                    ct.contact_number,
                    ct.mail_id,
                    ct.current_company,
                    ct.skill,
                    ct.total_exp,
                    ct.re_exp,
                    ct.ctc,
                    ct.ectc,
                    ct.notice_period,
                    ct.status,
                    ct.work_mode,
                    ct.notes,
                    ct.skill_mapping_notes,
                    ct.skill_mapping_rating,
                    ct.interview_status,
                    ct.poc_id,
                    r.recruiter_id,
                    r.ctc_budget,
                    el.employee_name AS recruiter_name
                FROM candidate_tracker ct
                JOIN customers_detail cd ON ct.client_id = cd.customer_id
                JOIN customer_contacts cc ON ct.poc_id = cc.contact_id
                JOIN requirements r ON ct.req_id = r.req_id
                JOIN employee_list el ON r.recruiter_id = el.employee_id
                WHERE ct.parent_company_id = $1
                AND r.recruiter_id = $2
                ORDER BY ct.candidate_id ASC;
                `,
                [companyId, employeeId]
            );
        } else {
            result = await dbConn.query(
                `SELECT 
                    ct.candidate_id,
                    ct.parent_company_id,
                    ct.client_id,
                    ct.req_id,
                    cd.customer_name,
                    cc.call_name,
                    ct.date_of_submission,
                    ct.candidate_name,
                    ct.contact_number,
                    ct.mail_id,
                    ct.current_company,
                    ct.skill,
                    ct.total_exp,
                    ct.re_exp,
                    ct.ctc,
                    ct.ectc,
                    ct.notice_period,
                    ct.status,
                    ct.work_mode,
                    ct.notes,
                    ct.skill_mapping_notes,
                    ct.skill_mapping_rating,
                    ct.interview_status,
                    ct.poc_id,
                    r.recruiter_id,
                    r.ctc_budget,
                    el.employee_name AS recruiter_name
                FROM candidate_tracker ct
                JOIN customers_detail cd ON ct.client_id = cd.customer_id
                JOIN customer_contacts cc ON ct.poc_id = cc.contact_id
                JOIN requirements r ON ct.req_id = r.req_id
                JOIN employee_list el ON r.recruiter_id = el.employee_id
                WHERE ct.parent_company_id = $1
                ORDER BY ct.candidate_id ASC;
                `,
                [companyId]
            );
        }

        console.log("Query Result:", result.rows);
        return result.rows;
    },


    // Fetch stored files
    getCandidateFiles: async (candidate_id) => {
        const query = "SELECT  detailed_profile , masked_profile , skill_mapping_attachment , candidate_id FROM candidate_tracker WHERE candidate_id = $1";
        const result = await dbConn.query(query, [candidate_id]);

        return result.rows[0];
    },

    updateCandidateFiles: async (candidateData) => {
        const { detailed_profile, masked_profile, skill_mapping_attachment, candidate_id } = candidateData;

        const fields = [];
        const values = [];
        let index = 1;

        if (detailed_profile) {
            fields.push(`detailed_profile = $${index++}`);
            values.push(detailed_profile);
        }

        if (masked_profile) {
            fields.push(`masked_profile = $${index++}`);
            values.push(masked_profile);
        }

        if (skill_mapping_attachment) {
            fields.push(`skill_mapping_attachment = $${index++}`);
            values.push(skill_mapping_attachment);
        }

        // Always push candidate_id at the end
        values.push(candidate_id);

        const query = `
            UPDATE candidate_tracker SET 
            ${fields.join(", ")} 
            WHERE candidate_id = $${index}
        `;

        await dbConn.query(query, values);
    },

    deleteCandidateFiles: async (candidateData) => {
        const { detailed_profile, masked_profile, skill_mapping_attachment, candidate_id } = candidateData;

        const fields = [];
        const values = [];
        let index = 1;

        // Only set to NULL if explicitly flagged (e.g., true)
        if (detailed_profile) {
            fields.push(`detailed_profile = NULL`);
        }

        if (masked_profile) {
            fields.push(`masked_profile = NULL`);
        }

        if (skill_mapping_attachment) {
            fields.push(`skill_mapping_attachment = NULL`);
        }

        if (fields.length === 0) {
            // No fields to delete, just return
            return;
        }

        // Add candidate ID to WHERE clause
        values.push(candidate_id);

        const query = `
            UPDATE candidate_tracker SET 
            ${fields.join(", ")} 
            WHERE candidate_id = $${index}
        `;

        await dbConn.query(query, values);
    },


    insertCandidate: async (candidateData) => {
        const {
            company_id, req_id, client_id, poc_id, date_of_submission, candidate_name, contact_number, mail_id, current_company,
            skill, total_exp, re_exp, ctc, ectc, notice_period, status, work_mode, notes, skill_mapping_notes, skill_mapping_rating,
            detailed_profile, masked_profile, skill_mapping_attachment

        } = candidateData;

        const client = await dbConn.connect();

        try {
            await client.query('BEGIN');

            // Insert into candidate_tracker
            const insertCandidateQuery = `
                INSERT INTO candidate_tracker (
                    parent_company_id, req_id, client_id, poc_id, date_of_submission, candidate_name, contact_number, mail_id, current_company,
                    skill, total_exp, re_exp, ctc, ectc, notice_period ,status, work_mode, notes, skill_mapping_notes, skill_mapping_rating,
                    detailed_profile , masked_profile , skill_mapping_attachment
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                    $11, $12, $13, $14, $15, $16, $17, $18, 
                    $19, $20, $21, $22, $23
                ) RETURNING candidate_id
            `;

            const candidateValues = [
                company_id, req_id, client_id, poc_id, date_of_submission, candidate_name, contact_number, mail_id, current_company,
                skill, total_exp, re_exp, ctc, ectc, notice_period, status, work_mode, notes, skill_mapping_notes, skill_mapping_rating,
                detailed_profile, masked_profile, skill_mapping_attachment
            ];

            const result = await client.query(insertCandidateQuery, candidateValues);
            const candidate_id = result.rows[0].candidate_id;

            // Insert into interview_schedule
            const insertInterviewQuery = `
                INSERT INTO interview_schedule (
                    req_id, candidate_id, client_id, contact_id, level_of_interview,
                    interview_date, interview_time
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;

            const interviewValues = [
                req_id,
                candidate_id,
                client_id,
                poc_id, // Assuming contact_id = poc_id
                'L1',
                new Date(),        // or your preferred date
                '10:00:00'        // default time
            ];

            await client.query(insertInterviewQuery, interviewValues);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error inserting candidate and interview:', error);
            throw error;
        } finally {
            client.release();
        }
    },

    updateCandidate: async (candidateData) => {
        const {
            parent_company_id, req_id, client_id, poc_id, customer_name, call_name, date_of_submission, candidate_name, contact_number,
            mail_id, current_company, skill, total_exp, re_exp, ctc, ectc, notice_period, status, work_mode, notes, skill_mapping_notes,
            skill_mapping_rating, interview_status, candidate_id
        } = candidateData;

        const query = `
        UPDATE candidate_tracker  SET
            parent_company_id = $1, req_id = $2, client_id = $3, poc_id = $4, date_of_submission = $5, candidate_name = $6, contact_number = $7, mail_id = $8, current_company = $9,
            skill = $10, total_exp = $11, re_exp = $12, ctc = $13, ectc = $14, notice_period = $15, status = $16, work_mode = $17, notes = $18, skill_mapping_notes = $19, skill_mapping_rating = $20, 
            interview_status = $21, interview_status_updated_at = now() WHERE candidate_id = $22 RETURNING *;
        `;

        const values = [
            parent_company_id, req_id, client_id, poc_id, date_of_submission, candidate_name, contact_number, mail_id, current_company,
            skill, total_exp, re_exp, ctc, ectc, notice_period, status, work_mode, notes, skill_mapping_notes, skill_mapping_rating,
            interview_status, candidate_id
        ];

        try {
            console.log("Executing query:", query);
            const result = await dbConn.query(query, values);
            return result.rows[0]; // return updated row
        } catch (error) {
            console.error("Error updating candidate:", error);
            throw error;
        }
    },

    uploadCandidateExcelData: async (candidateData) => {
        const {
            parent_company_id,
            req_id,
            client_id,
            poc_id,
            date_of_submission,
            candidate_name,
            contact_number,
            mail_id,
            current_company,
            skill,
            total_exp,
            re_exp,
            ctc,
            ectc,
            notice_period,
            status,
            work_mode,
            notes,
            skill_mapping_notes,
            skill_mapping_rating,

        } = candidateData;

        const client = await dbConn.connect();

        try {
            await client.query('BEGIN');

            // 1. Insert into candidate_tracker
            const insertCandidateQuery = `
                INSERT INTO candidate_tracker (
                    parent_company_id, req_id, client_id, poc_id, date_of_submission,
                    candidate_name, contact_number, mail_id, current_company, skill,
                    total_exp, re_exp, ctc, ectc, notice_period,
                    status, work_mode, notes, skill_mapping_notes, skill_mapping_rating
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15,
                    $16, $17, $18, $19, $20
                )
                RETURNING candidate_id;
            `;

            const candidateValues = [
                parent_company_id, req_id, client_id, poc_id, date_of_submission,
                candidate_name, contact_number, mail_id, current_company, skill,
                total_exp, re_exp, ctc, ectc, notice_period,
                status, work_mode, notes, skill_mapping_notes, skill_mapping_rating
            ];

            const candidateResult = await client.query(insertCandidateQuery, candidateValues);
            const candidate_id = candidateResult.rows[0].candidate_id;

            // 2. Insert into interview_schedule
            const insertInterviewQuery = `
                INSERT INTO interview_schedule (
                    req_id, candidate_id, client_id, contact_id,
                    level_of_interview, interview_date, interview_time
                ) VALUES ($1, $2, $3, $4, $5, $6, $7);
            `;

            const interviewValues = [
                req_id, candidate_id, client_id, poc_id, // poc_id used as contact_id
                'L1',
                new Date(),        // or your preferred date
                '10:00:00'        // default time
            ];

            await client.query(insertInterviewQuery, interviewValues);

            await client.query('COMMIT');
            return { candidate_id };

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Error inserting candidate and interview data:", error);
            throw new Error("Transaction failed: " + error.message);
        } finally {
            client.release();
        }
    },

    deleteCandidates: async (candidate_id) => {
        await dbConn.query("DELETE FROM candidate_tracker WHERE candidate_id = $1", [candidate_id]);
    },

    getFiles: async (candidate_id, field) => {
        const result = await dbConn.query(`SELECT ${field} FROM candidate_tracker WHERE candidate_id = $1`, [candidate_id]);
        return result.rows[0][field];
    },

    updateFiles: async (candidate_id, field, updatedFiles) => {
        await dbConn.query(`UPDATE candidate_tracker SET ${field} = $1 WHERE candidate_id = $2`, [JSON.stringify(updatedFiles), candidate_id]);
    },

};

module.exports = candidateTracker;
