const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const onboardedCandidates = {
    onboardedCandidatesContent: async (companyId, employeeId, designation) => {
        console.log("Company ID:", companyId);
        console.log("Employee ID:", employeeId);
        console.log("Designation:", designation);

        let result;

        if (designation === 'Recruiter') {
            result = await dbConn.query(
                `
                SELECT 
                    sc.interview_id ,
                    sc.selected_id ,
                    sc.client_id ,
                    sc.onboarded_date,
                    sc.invoice_status,
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
                    cd.fte_percentage,
                    cc.call_name,
                    r.recruiter_id,
                    r.requirement,
                    r.account_manager,
                     r.location,
                    r.ctc_budget,
                    ct.candidate_name,
                    ct.contact_number,
                    ct.mail_id,
                    ct.ctc,
                    el.employee_name AS recruiter

                FROM selected_candidate sc
                JOIN interview_schedule it ON SC.interview_id = it.schedule_id
                JOIN customers_detail cd ON sc.client_id = cd.customer_id
                JOIN customer_contacts cc ON it.contact_id = cc.contact_id
                 JOIN requirements r ON it.req_id = r.req_id
                  JOIN candidate_tracker ct ON it.candidate_id = ct.candidate_id
                   JOIN employee_list el ON r.recruiter_id = el.employee_id
                WHERE ct.parent_company_id = $1 AND it.interview_status != 'null' AND r.recruiter_id = $2  -- ✅ Only recruiter’s candidates
                 ORDER BY it.schedule_id ASC;
                `,
                [companyId, employeeId]
            );
            console.log("Result:", result);

        }
        else {
            result = await dbConn.query(
                `
               SELECT 
                     sc.interview_id ,
                    sc.selected_id ,
                    sc.client_id ,
                    sc.onboarded_date,
                    sc.invoice_status,
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
                    cd.agreement_type,
                    cd.fte_percentage,
                    cd.address,
                    cc.call_name,
                    r.recruiter_id,
                    r.requirement,
                    r.account_manager,
                    r.ctc_budget,
                    r.location,
                    ct.candidate_name,
                    ct.contact_number,
                    ct.mail_id,
                    ct.ectc,
                    el.employee_name AS recruiter

                FROM selected_candidate sc
                JOIN interview_schedule it ON SC.interview_id = it.schedule_id
                JOIN customers_detail cd ON sc.client_id = cd.customer_id
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

    updateOnboardedinsert: async (
        selected_id,
        interview_id,
        client_id,
        onboarded_date,
        invoice_status
    ) => {
        console.log("update OnboardedCandidate with selected_id:", selected_id);

        const query = `
    UPDATE selected_candidate 
    SET interview_id = $2, client_id = $3, onboarded_date = $4, invoice_status = $5 
    WHERE selected_id = $1
  `;

        const values = [selected_id, interview_id, client_id, onboarded_date, invoice_status];

        return await dbConn.query(query, values);
    },

    delOnboardedCandidate: async (selected_id) => {
        console.log("Deleting OnboardedCandidate with selected_id:", selected_id);

        await dbConn.query("DELETE FROM selected_candidate WHERE selected_id = $1", [selected_id]);
    }
}

module.exports = onboardedCandidates;