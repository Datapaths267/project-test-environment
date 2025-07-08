const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const interviewTracker = {
    interviewContents: async (companyId, employeeId, designation) => {
        console.log("Company ID:", companyId);
        console.log("Employee ID:", employeeId);
        console.log("Designation:", designation);

        let result;

        if (designation === 'Recruiter') {
            result = await dbConn.query(
                `
                SELECT 
                    it.schedule_id ,
                    it.req_id ,
                    it.candidate_id ,
                    it.client_id ,
                    it.contact_id ,
                    it.level_of_interview ,
                    it.interview_date ,
                    it.interview_time ,
                    it.interview_status ,
                    cd.customer_name,
                    cc.call_name,
                    r.recruiter_id,
                    r.requirement,
                    ct.candidate_name,
                    ct.contact_number,
                    ct.mail_id,
                    el.employee_name AS recruiter

                FROM interview_schedule it
                JOIN customers_detail cd ON it.client_id = cd.customer_id
                JOIN customer_contacts cc ON it.contact_id = cc.contact_id
                 JOIN requirements r ON it.req_id = r.req_id
                  JOIN candidate_tracker ct ON it.candidate_id = ct.candidate_id
                   JOIN employee_list el ON r.recruiter_id = el.employee_id
                WHERE ct.parent_company_id = $1 AND it.interview_status != 'null' AND r.recruiter_id = $2  -- ✅ Only recruiter’s candidates
                 ORDER BY it.schedule_id ASC;
                `,
                [companyId, employeeId]
            );

        }
        else {
            result = await dbConn.query(
                `
                SELECT 
                    it.schedule_id ,
                    it.req_id ,
                    it.candidate_id ,
                    it.client_id ,
                    it.contact_id ,
                    it.level_of_interview ,
                    it.interview_date ,
                    it.interview_time ,
                    it.interview_status ,
                    cd.customer_name,
                    cc.call_name,
                    r.recruiter_id,
                    r.requirement,
                    ct.candidate_name,
                    ct.contact_number,
                    ct.mail_id,
                    el.employee_name AS recruiter

                FROM interview_schedule it
                JOIN customers_detail cd ON it.client_id = cd.customer_id
                JOIN customer_contacts cc ON it.contact_id = cc.contact_id
                 JOIN requirements r ON it.req_id = r.req_id
                  JOIN candidate_tracker ct ON it.candidate_id = ct.candidate_id
                   JOIN employee_list el ON r.recruiter_id = el.employee_id
                WHERE ct.parent_company_id = $1 AND it.interview_status != 'null'
                 ORDER BY it.schedule_id ASC;
                `,
                [companyId]
            );

        }
        return result.rows;
    },

    updateInterviewTracker: async (candidateData) => {
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
        } = candidateData;

        const updateQuery = `
            UPDATE interview_schedule SET
                req_id = $1, candidate_id = $2, client_id = $3, contact_id = $4,
                level_of_interview = $5, interview_date = $6, interview_time = $7,
                interview_status = $8
            WHERE schedule_id = $9 RETURNING *;
        `;

        const updateValues = [
            req_id,
            candidate_id,
            client_id,
            contact_id,
            level_of_interview,
            interview_date,
            interview_time,
            interview_status,
            schedule_id,
        ];

        try {
            console.log("Executing update query...");
            const result = await dbConn.query(updateQuery, updateValues);
            const updatedRow = result.rows[0];

            // ✅ Always update interview_status_updated_at
            const updateTimeQuery = `
                UPDATE candidate_tracker
                SET interview_status_updated_at = NOW()
                WHERE candidate_id = $1 RETURNING *;
            `;
            await dbConn.query(updateTimeQuery, [candidate_id]);
            console.log("Updated interview_status_updated_at");

            // ✅ If onboarded, insert into selected_candidate
            if (interview_status.toLowerCase() === 'onboarded') {
                const insertQuery = `
                    INSERT INTO selected_candidate (interview_id, client_id, onboarded_date)
                    VALUES ($1, $2, NOW())
                    ON CONFLICT DO NOTHING
                    RETURNING *;
                `;
                await dbConn.query(insertQuery, [schedule_id, client_id]);

                console.log("Candidate onboarded — inserted into selected_candidate");
            }

            return updatedRow;

        } catch (error) {
            console.error("Error updating candidate:", error);
            throw error;
        }
    },

    delinterview: async (schedule_id) => {
        console.log("Deleting interview with schedule_id:", schedule_id);

        await dbConn.query("DELETE FROM interview_schedule WHERE schedule_id = $1", [schedule_id]);
    }
};

module.exports = interviewTracker;
