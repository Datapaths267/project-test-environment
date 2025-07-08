const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const AMFocusOnTracker = {
  getAllAMFocusOn: async (companyId, employeeId, designation, employeeName) => {
    console.log("Company ID:", companyId);
    console.log("Employee ID:", employeeId);
    console.log("Designation:", designation);
    console.log("Employee Name:", employeeName);

    let result;

    if (designation === 'Senior Director' || designation === 'Director') {
      result = await dbConn.query(`
            SELECT 
                r.req_id,
                r.req_date,
                r.month,
                r.year,
                r.requirement,
                r.number_of_positions,
                r.company_id,
                r.recruiter_id,
                r.client_id,
                r.account_manager,
                emp.employee_name AS recruiter,
                cd.customer_name AS customer,
                r.status,
                r.hire_type,

                COUNT(ct.candidate_id) AS total_candidates,
                COUNT(*) FILTER (WHERE ct.interview_status IS NOT NULL AND ct.interview_status::text <> 'Screen Reject') AS screen_selected,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Screen Reject') AS screen_rejected,
                MAX(ct.interview_status_updated_at) AS last_active_date,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Interview Reject') AS interview_reject,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Interview Selected') AS interview_selected,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Shortlisted') AS shortlisted,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Offer RolledOut') AS offer_rolledout,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Onboarded') AS onboarded,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Onboarded Failure') AS onboarded_failure,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Offer RolledOut') AS offer_rolledout,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Offer RolledOut Accepted') AS offer_rolledout_accepted,

                COUNT(*) FILTER (WHERE isch.level_of_interview::text = 'Hold') AS hold,
                COUNT(*) FILTER (WHERE isch.level_of_interview::text = 'No Show') AS no_show,
                COUNT(*) FILTER (WHERE isch.level_of_interview::text = 'L4 - Managerial Round') AS Managerial_round,
                COUNT(*) FILTER (WHERE isch.level_of_interview::text = 'L5 - Client Round') AS client_round,
                COUNT(*) FILTER (WHERE isch.level_of_interview::text = 'L6 - HR Round') AS hr_round,
                COUNT(*) FILTER (WHERE isch.level_of_interview::text = 'L7 - Offer Discussion') AS offer_discussion,
                COUNT(*) FILTER (
                  WHERE isch.level_of_interview::text = 'L1 - Screening') AS l1_screening,
                COUNT(*) FILTER (
                  WHERE isch.level_of_interview::text = 'L2 - Technical Round 1') AS l2_technical_round,
                COUNT(*) FILTER (
                  WHERE isch.level_of_interview::text = 'L3 - Technical Round 2' ) AS l3_technical_round

            FROM requirements r
            JOIN employee_list emp ON r.recruiter_id = emp.employee_id
            JOIN customers_detail cd ON r.client_id = cd.customer_id
            LEFT JOIN candidate_tracker ct ON r.req_id::text = ct.req_id::text
            LEFT JOIN interview_schedule isch ON ct.req_id = isch.req_id
            WHERE r.company_id = $1 
            GROUP BY r.req_id, r.req_date, r.requirement, r.number_of_positions, r.company_id, r.recruiter_id, emp.employee_name, r.client_id, r.account_manager, cd.customer_name, r.status
            ORDER BY r.req_id ASC;
        `, [companyId]);
    }
    else {
      result = await dbConn.query(`
             SELECT 
                r.req_id,
                r.req_date,
                r.month,
                r.year,
                r.requirement,
                r.number_of_positions,
                r.company_id,
                r.recruiter_id,
                r.client_id,
                r.account_manager,
                emp.employee_name AS recruiter,
                cd.customer_name AS customer,
                r.status,
                r.hire_type,

                COUNT(ct.candidate_id) AS total_candidates,
                COUNT(*) FILTER (WHERE ct.interview_status IS NOT NULL AND ct.interview_status::text <> 'Screen Reject') AS screen_selected,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Screen Reject') AS screen_rejected,
                MAX(ct.interview_status_updated_at) AS last_active_date,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Interview Reject') AS interview_reject,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Interview Selected') AS interview_selected,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Shortlisted') AS shortlisted,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Offer RolledOut') AS offer_rolledout,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Onboarded') AS onboarded,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Onboarded Failure') AS onboarded_failure,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Offer RolledOut') AS offer_rolledout,
                COUNT(*) FILTER (WHERE ct.interview_status::text = 'Offer RolledOut Accepted') AS offer_rolledout_accepted,

                COUNT(*) FILTER (WHERE isch.interview_status = 'Hold') AS hold,
                COUNT(*) FILTER (WHERE isch.interview_status = 'No Show') AS no_show,
                COUNT(*) FILTER (WHERE isch.interview_status = 'L4 - Managerial Round') AS Managerial_round,
                COUNT(*) FILTER (WHERE isch.interview_status = 'L5 - Client Round') AS client_round,
                COUNT(*) FILTER (WHERE isch.interview_status = 'L6 - HR Round') AS hr_round,
                COUNT(*) FILTER (WHERE isch.interview_status = 'L7 - Offer Discussion') AS offer_discussion,
                COUNT(*) FILTER (
                  WHERE isch.level_of_interview = 'L1 - Screening' AND isch.interview_status = 'Interview Reject'
                ) AS l1_reject,
                COUNT(*) FILTER (
                  WHERE isch.level_of_interview = 'L2 - Technical Round 1' AND isch.interview_status = 'Interview Reject'
                ) AS l2_reject

            FROM requirements r
            JOIN employee_list emp ON r.recruiter_id = emp.employee_id
            JOIN customers_detail cd ON r.client_id = cd.customer_id
            LEFT JOIN candidate_tracker ct ON r.req_id::text = ct.req_id::text
            LEFT JOIN interview_schedule isch ON ct.candidate_id = isch.candidate_id
           WHERE r.company_id = $1 AND r.account_manager = $2 
            GROUP BY r.req_id, r.req_date, r.requirement, r.number_of_positions, r.company_id, r.recruiter_id, emp.employee_name, r.client_id, r.account_manager, cd.customer_name, r.status
            ORDER BY r.req_id ASC;
        `, [companyId, employeeName]);

      // FROM requirements r
      // JOIN employee_list emp ON r.recruiter_id = emp.employee_id
      // LEFT JOIN candidate_tracker ct ON r.req_id::text = ct.req_id::text
      // LEFT JOIN interview_schedule isch ON ct.candidate_id = isch.candidate_id
      // WHERE r.company_id = $1 AND r.account_manager = $2
      //     // GROUP BY r.req_id, r.req_date, r.requirement, r.number_of_positions, r.company_id, r.recruiter_id, emp.employee_name, r.client_id, r.account_manager, r.status
      //     // ORDER BY r.req_id ASC;
      // `, [companyId, employeeName]);
    }

    console.log("Query executed successfully");
    console.log("Result rows:", result.rows);
    return result.rows;
  }
};

module.exports = AMFocusOnTracker;