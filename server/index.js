const dbConn = require('./config/DB');
const express = require("express");
const bp = require("body-parser");
const cors = require("cors");
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const app = express();

// Import Routes
const costRoiRoutes = require('./routes/costRoiRoutes');
const employeeSalaryRoutes = require("./routes/EmployeeSalary");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const companyRoutes = require("./routes/companyRoutes");
const customerRoutes = require("./routes/customerRoutes");
const contactsRoutes = require("./routes/contactsRoutes");
const requirementTrackerRoutes = require("./routes/requirementTrackerRouter");
const candidateTrackerRoutes = require("./routes/candidateTrackerRouter");
const interviewTrackerRoutes = require("./routes/InterviewTrackerRoutes");
const onboard = require("./routes/onboardedCandidatesRoutes");
const ConFigRoutes = require("./routes/ConFigRoutes");
const AMFocusOnRoutes = require("./routes/AMFocusOnRoute");
const assignmentRoutes = require('./routes/assignmentRoutes');



// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// ✅ Increase JSON body limit
app.use(express.json({ limit: '10mb' }));

// ✅ Also increase URL-encoded body size (for forms)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware
// app.use(cors());
app.use(cors({ origin: "*", credentials: true }));

app.use(express.json());
app.use(bp.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir)); // Serve static files

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// DB Connect
dbConn.connect().then(() => {
    console.log('DB connected....');
}).catch(err => {
    console.error('DB connection error:', err);
});

// ✅ CRON JOB: Auto-set candidates to 'inactive' after 21 days
cron.schedule('0 0 * * *', async () => {
    try {
        const query = `
            UPDATE candidate_tracker
            SET status = 'inactive'
            WHERE interview_status_updated_at <= now() - INTERVAL '21 days'
              AND status = 'active';
        `;
        const result = await dbConn.query(query);
        console.log(`[CRON] Updated ${result.rowCount} candidate(s) to inactive.`);
    } catch (error) {
        console.error('[CRON] Error updating candidate status:', error);
    }
});

// Mount Routes
app.use("/api", costRoiRoutes);
app.use("/api", employeeSalaryRoutes);
app.use("/auth", authRoutes);
app.use("/api", employeeRoutes);
app.use("/api", companyRoutes);
app.use("/customer", customerRoutes);
app.use("/contacts", contactsRoutes);
app.use("/requirementTracker", requirementTrackerRoutes);
app.use("/candidateTracker", candidateTrackerRoutes);
app.use("/interviewTracker", interviewTrackerRoutes);
app.use("/onboardedCandidates", onboard);
app.use("/config", ConFigRoutes);
app.use("/AMFocusOn", AMFocusOnRoutes);
app.use("/api/assignment", assignmentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uploadsDirectory: uploadDir,
        dbStatus: dbConn.connection ? 'connected' : 'disconnected'
    });
});

// Server Listener
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running at ${PORT} port!!!...`);
    console.log(`File upload directory: ${uploadDir}`);
});
{/*const dbConn = require('./config/DB');
const express = require("express");
const bp = require("body-parser");
const cors = require("cors");
const cron = require('node-cron'); // cron scheduler
const app = express();

// Import Routes
const costRoiRoutes = require('./routes/costRoiRoutes');
const employeeSalaryRoutes = require("./routes/EmployeeSalary");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const companyRoutes = require("./routes/companyRoutes");
const customerRoutes = require("./routes/customerRoutes");
const contactsRoutes = require("./routes/contactsRoutes");
const requirementTrackerRoutes = require("./routes/requirementTrackerRouter");
const candidateTrackerRoutes = require("./routes/candidateTrackerRouter");
const interviewTrackerRoutes = require("./routes/InterviewTrackerRoutes");

app.use(cors());
app.use(express.json());
app.use(bp.urlencoded({ extended: true }));

// DB Connect
dbConn.connect().then(() => { console.log('DB connected....'); });

// ✅ CRON JOB: Auto-set candidates to 'inactive' after 21 days
cron.schedule('0 0 * * *', async () => {
    try {
        const query = `
            UPDATE candidate_tracker
            SET status = 'inactive'
            WHERE interview_status_updated_at <= now() - INTERVAL '21 days'
              AND status = 'active';
        `;
        const result = await dbConn.query(query);
        console.log(`[CRON] Updated ${result.rowCount} candidate(s) to inactive.`);
    } catch (error) {
        console.error('[CRON] Error updating candidate status:', error);
    }
});

// Mount Routes
app.use("/api", costRoiRoutes);
app.use("/api", employeeSalaryRoutes);
app.use("/auth", authRoutes);
app.use("/api", employeeRoutes);
app.use("/api", companyRoutes);
app.use("/customer", customerRoutes);
app.use("/contacts", contactsRoutes);
app.use("/requirementTracker", requirementTrackerRoutes);
app.use("/candidateTracker", candidateTrackerRoutes);
app.use("/interviewTracker", interviewTrackerRoutes);

// Server Listener
app.listen('8000', () => {
    console.log('Server running at 8000 port!!!...');
});

*/}