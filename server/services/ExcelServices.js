const ExcelJS = require("exceljs");
const xlsx = require("xlsx");

exports.generateTemplateWorkbook = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Customer Contacts");

    sheet.columns = [
        { header: "contact_company_id", key: "contact_company_id", width: 25 },
        { header: "name", key: "name", width: 20 },
        { header: "call_name", key: "call_name", width: 20 },
        { header: "contact_type", key: "contact_type", width: 20 },
        { header: "mobile_number", key: "mobile_number", width: 20 },
        { header: "email", key: "email", width: 25 },
        { header: "status", key: "status", width: 15 },
        { header: "role", key: "role", width: 20 },
        { header: "address", key: "address", width: 25 },
        { header: "notes", key: "notes", width: 25 },
        { header: "created_at", key: "created_at", width: 25 },
    ];

    sheet.addRow({
        contact_company_id: "CUST001",
        name: "John Doe",
        call_name: "JD",
        contact_type: "Customer",
        mobile_number: "9876543210",
        email: "john@example.com",
        status: "active",
        role: "Manager",
        address: "Chennai",
        notes: "Top Client",
        created_at: new Date(),
    });

    return workbook;
};

exports.generateRequirementTemplateWorkbook = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Requirements data");

    sheet.columns = [
        { header: "account_manager", key: "account_manager", width: 20 },
        { header: "year", key: "year", width: 20 },
        { header: "month", key: "month", width: 20 },
        { header: "region", key: "region", width: 20 },
        { header: "req_date", key: "req_date", width: 25 },
        { header: "client_id", key: "client_id", width: 15 },
        { header: "company_name", key: "company_name", width: 20 },
        { header: "category", key: "category", width: 25 },
        { header: "poc_id", key: "poc_id", width: 25 },
        { header: "POC_name", key: "POC name", width: 25 },
        { header: "requirement", key: "requirement", width: 25 },
        { header: "status", key: "status", width: 25 },
        { header: "tech_skill", key: "tech_skill", width: 25 },
        { header: "hire_type", key: "hire_type", width: 25 },
        { header: "number_of_positions", key: "number_of_positions", width: 25 },
        { header: "experience", key: "experience", width: 25 },
        { header: "location", key: "location", width: 25 },
        { header: "mode", key: "mode", width: 25 },
        { header: "ctc_budget", key: "ctc_budget", width: 25 },
        { header: "recruiter_id", key: "recruiter_id", width: 25 },
        { header: "recruiter", key: "recruiter", width: 25 },
    ];

    sheet.addRow({
        account_manager: "Palanisamy",
        year: "2025",
        month: "March",
        region: "INDIA",
        req_date: "03/04/2025",
        client_id: "CUS-006",
        company_name: "ABCD43",
        category: "IT",
        poc_id: "26",
        POC_name: "sirajii47",
        requirement: "full stack developer",
        status: "open",
        tech_skill: "java",
        hire_type: "FTE",
        number_of_positions: "2",
        experience: "5",
        location: "SALEM",
        mode: "Onsite",
        ctc_budget: "400000",
        recruiter_id: "E310",
        recruiter: "Lokesh",
    });

    return workbook;
};

exports.generateCandidateTemplateWorkbook = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Candidate data");

    sheet.columns = [
        { header: "DataPaths", key: "parent_company_id", width: 20 },
        { header: "client_id", key: "client_id", width: 20 },
        { header: "poc_id", key: "poc_id", width: 20 },
        { header: "req_id", key: "req_id", width: 20 },
        { header: "customer_name", key: "customer_name", width: 25 },
        { header: "call_name", key: "call_name", width: 15 },
        { header: "date_of_submission", key: "date_of_submission", width: 20 },
        { header: "candidate_name", key: "candidate_name", width: 25 },
        { header: "contact_number", key: "contact_number", width: 25 },
        { header: "mail_id", key: "mail_id", width: 25 },
        { header: "current_company", key: "current_company", width: 25 },
        { header: "skill", key: "skill", width: 25 },
        { header: "total_exp", key: "total_exp", width: 25 },
        { header: "re_exp", key: "re_exp", width: 25 },
        { header: "ctc", key: "ctc", width: 25 },
        { header: "ectc", key: "ectc", width: 25 },
        { header: "notice_period", key: "notice_period", width: 25 },
        { header: "work_mode", key: "work_mode", width: 25 },
        { header: "notes", key: "notes", width: 25 },
        { header: "skill_mapping_notes", key: "skill_mapping_notes", width: 25 },
        { header: "skill_mapping_rating", key: "skill_mapping_rating", width: 25 },
        { header: "status", key: "status", width: 25 }
    ];

    sheet.addRow({
        parent_company_id: "COMP012",
        client_id: "CUS-006",
        poc_id: "28",
        req_id: "REQ-003",
        customer_name: "ABCD43",
        call_name: "JD",
        date_of_submission: "04/04/2025",
        candidate_name: "KAVIN",
        contact_number: "7894561230",
        mail_id: "kavin@gmail.com",
        current_company: "SRM Technologies",
        skill: "JS",
        total_exp: "3",
        re_exp: "4",
        ctc: "2000000",
        ectc: "5000000",
        notice_period: "Immediate",
        work_mode: "Onsite",
        notes: "iiiiii",
        skill_mapping_notes: "js,css",
        skill_mapping_rating: "6",
        status: "Active",
    });

    return workbook;
};

exports.generateInterviewTrackerTemplateWorkbook = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Interview Tracker Sheet");

    sheet.columns = [
        { header: "Interview Date", key: "interview_date", width: 25 },
        { header: "Interview Time", key: "interview_time", width: 20 },
        { header: "Recruiter", key: "recruiter", width: 20 },
        { header: "Req ID", key: "req_id", width: 20 },
        { header: "Client ID", key: "client_id", width: 20 },
        { header: "Client Name", key: "client_name", width: 25 },
        { header: "POC ID", key: "poc_id", width: 15 },
        { header: "POC Name", key: "poc_name", width: 20 },
        { header: "Role", key: "role", width: 25 },
        { header: "Level of Interview", key: "level_of_interview", width: 25 },
        { header: "Candidate ID", key: "candidate_id", width: 20 },
        { header: "Candidate Name", key: "candidate_name", width: 25 },
        { header: "Candidate Number", key: "candidate_number", width: 15 },
        { header: "Candidate Email", key: "candidate_email", width: 20 },
        { header: "Status", key: "status", width: 25 },
    ];

    sheet.addRow({
        interview_date: "07-04-2025",
        interview_time: "12:00:00",
        recruiter: "Lokesh",
        req_id: "REQ-003",
        client_id: "CUS-007",
        client_name: "Global Trade Ltd",
        poc_id: "14",
        poc_name: "Emily",
        role: "AI Engineer",
        level_of_interview: "L2",
        candidate_id: "6",
        candidate_name: "jeevis23",
        candidate_number: "2345666711",
        candidate_email: "jeevis21@gmail.com1",
        status: "moved L2",
    });

    return workbook;
};

exports.parseExcelFile = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    return rows;
};
