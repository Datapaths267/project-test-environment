CREATE OR REPLACE VIEW full_details_view AS
SELECT 
    r.req_id,
    r.req_date,
    r.requirement,
    r.number_of_positions,
    r.company_id,
    r.recruiter_id,

    COUNT(ct.candidate_id) AS total_candidates,

    COUNT(*) FILTER (
        WHERE ct.interview_status IS NOT NULL 
        AND ct.interview_status != 'Screen Reject'
    ) AS screen_selected,

    COUNT(*) FILTER (
        WHERE ct.interview_status = 'Screen Reject'
    ) AS screen_rejected,

    MAX(ct.interview_status_updated_at) AS last_active_date,

    COUNT(*) FILTER (
        WHERE ct.interview_status = 'Interview Reject'
    ) AS interview_reject,

    COUNT(*) FILTER (
        WHERE ct.interview_status = 'Interview Selected'
    ) AS interview_selected,

    COUNT(*) FILTER (
        WHERE ct.interview_status = 'Shortlisted'
    ) AS shortlisted,

    COUNT(*) FILTER (
        WHERE ct.interview_status = 'Offer RolledOut'
    ) AS offer_rolledout,

    COUNT(*) FILTER (
        WHERE ct.interview_status = 'Onboarded'
    ) AS onboarded

FROM requirements r
LEFT JOIN candidate_tracker ct ON r.req_id = ct.req_id
GROUP BY r.req_id, r.req_date, r.requirement, r.number_of_positions, r.company_id, r.recruiter_id;
