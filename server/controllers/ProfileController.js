// controllers/profileController.js
const dbConn = require("../config/DB");

exports.getProfileData = async (req, res) => {
    const userId = req.params.id;

    try {
        console.log("Fetching profile data for user ID:", userId);
        const employeeResult = await dbConn.query(
            'SELECT employee_name, employee_email, employee_designation, employee_ctc FROM employee_list WHERE employee_id = $1',
            [userId]
        );
        const employee = employeeResult.rows[0]; // or use .rows if you want all


        const customers = await dbConn.query(
            `SELECT DISTINCT cd.customer_name
     FROM customers_detail cd
     JOIN requirements r ON cd.customer_id = r.client_id
     WHERE r.recruiter_id = $1 and r.status = 'open'`,
            [userId]
        );

        const totalCandidates = await dbConn.query(
            `SELECT COUNT(*) AS total
     FROM candidate_tracker c
     JOIN requirements r ON c.req_id = r.req_id
     WHERE r.recruiter_id = $1 and c.status = 'active'`,
            [userId]
        );


        const scheduledCandidates = await dbConn.query(
            `SELECT COUNT(*) AS total
     FROM interview_schedule isc
     JOIN candidate_tracker ct ON isc.candidate_id = ct.candidate_id
     JOIN requirements r ON isc.req_id = r.req_id
     WHERE r.recruiter_id = $1 and ct.status = 'active'`,
            [userId]
        );

        const onboardedCandidates = await dbConn.query(
            `SELECT COUNT(*) AS total
     FROM selected_candidate sc
     JOIN interview_schedule i ON sc.interview_id = i.schedule_id
     JOIN candidate_tracker c ON i.candidate_id = c.candidate_id
     JOIN requirements r ON i.req_id = r.req_id
     WHERE r.recruiter_id = $1 AND c.status = 'active'`,
            [userId]
        );


        const recentCandidates = await dbConn.query(
            `SELECT c.candidate_name AS candidate, cd.customer_name AS customer, i.interview_status, i.level_of_interview, i.interview_date
             FROM interview_schedule i
             JOIN candidate_tracker c ON c.candidate_id = i.candidate_id
             JOIN customers_detail cd ON cd.customer_id = i.client_id
             JOIN requirements r ON i.req_id = r.req_id
             WHERE r.recruiter_id = $1
             ORDER BY i.created_at DESC LIMIT 10`,
            [userId]
        );

        const monthlyRevenue = await dbConn.query(
            `SELECT 
      TO_CHAR(sc.created_at, 'Mon') AS month,
      DATE_TRUNC('month', sc.created_at) AS month_start,
      ROUND(SUM(
        CASE 
            WHEN cu.agreement_type = 'FTE' THEN r.ctc_budget * cu.fte_percentage / 100
            WHEN cu.agreement_type = 'C2H' THEN (r.ctc_budget / 12) * 6
            ELSE 0
        END
      ), 2) AS value
   FROM 
      selected_candidate sc
   JOIN 
      interview_schedule i ON sc.interview_id = i.schedule_id
   JOIN 
      requirements r ON i.req_id = r.req_id
   JOIN 
      customers_detail cu ON r.client_id = cu.customer_id
   WHERE 
      r.recruiter_id = $1
   GROUP BY 
      month, month_start, sc.created_at
   ORDER BY 
      month_start;`,
            [userId]
        );


        const revenue = await dbConn.query(
            `SELECT 
        r.recruiter_id,
        COUNT(sc.selected_id) AS onboarded_candidates,
        ROUND(SUM(
            CASE 
                WHEN cu.agreement_type = 'FTE' THEN r.ctc_budget * cu.fte_percentage / 100
                WHEN cu.agreement_type = 'C2H' THEN (r.ctc_budget / 12) * 6
                ELSE 0
            END
        ), 2) AS total_revenue
    FROM 
        selected_candidate sc
    JOIN 
        interview_schedule i ON sc.interview_id = i.schedule_id
    JOIN 
        requirements r ON i.req_id = r.req_id
    JOIN 
        customers_detail cu ON r.client_id = cu.customer_id
    WHERE 
        r.recruiter_id = $1
    GROUP BY 
        r.recruiter_id;`,
            [userId]
        );

        res.json({
            name: employee?.employee_name || "",
            email: employee?.employee_email || "",
            role: employee?.employee_designation || "",
            salary: employee?.employee_ctc || 0,
            customers: customers.rows.map(c => c.customer_name),
            candidates: {
                total: totalCandidates.rows[0]?.total || 0,
                scheduled: scheduledCandidates.rows[0]?.total || 0,
                onboarded: onboardedCandidates.rows[0]?.total || 0,
            },
            employeeSalary: employee?.employee_ctc || 0,
            revenue: revenue.rows[0]?.total_revenue || 0,
            monthlyRevenue: monthlyRevenue.rows || [],
            recentCandidates: recentCandidates.rows.map(r => ({
                date: r.date,
                candidate: r.candidate,
                customer: r.customer,
                stage: r.stage,
                status: r.status
            }))
        });
        console.log("Profile data retrieved successfully");
        console.log("Employee:", employee);
        console.log("Response:", {
            name: employee?.employee_name || "",
            email: employee?.employee_email || "",
            role: employee?.employee_designation || "",
            salary: employee?.employee_ctc || 0,
            customers: customers.rows.map(c => c.customer_name),
            candidates: {
                total: Number(totalCandidates.rows[0]?.total) || 0,
                scheduled: Number(scheduledCandidates.rows[0]?.total) || 0,
                onboarded: Number(onboardedCandidates.rows[0]?.total) || 0,
            },
            employeeSalary: employee?.employee_ctc || 0,
            revenue: revenue.rows[0]?.total_revenue || 0,
            monthlyRevenue: monthlyRevenue.rows || [],
            recentCandidates: recentCandidates.rows.map(r => ({
                date: r.interview_date,
                candidate: r.candidate,
                customer: r.customer,
                stage: r.level_of_interview,
                status: r.interview_status
            }))
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};
