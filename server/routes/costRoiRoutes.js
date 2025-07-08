const express = require("express");
const router = express.Router();
const dbConn = require("../config/DB"); // Database connection

// ✅ GET Cost Vs ROI with monthly salary info
router.get("/cost-roi", async (req, res) => {
  try {
    const query = `
      SELECT
      id,
          employee,
          salary_gross,
          salary_net,
          cummulative_sal_paid,
          status,
          min_returns_expected,
          returns_signed,
          returns_recognized,
          employee_id,
          role,
          month
      FROM Cost_vs_ROI 
      ORDER BY id DESC;
    `;
    const result = await dbConn.query(query);
    const rows = result.rows || [];  // Ensure we always return an array
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching Cost Vs ROI:", err);
    res.status(500).json({ error: "Server error while fetching data" });
  }
});

// ✅ POST to upload Cost Vs ROI data safely with employee ID and salary
router.post("/upload-cost-roi", async (req, res) => {
  const client = await dbConn.connect();

  try {
    const { data } = req.body;

    if (!data || data.length === 0) {
      return res.status(400).json({ message: "No data received" });
    }

    await client.query("BEGIN"); // Start transaction

    for (const row of data) {
      const {
        month,
        employee,
        cummulative_sal_paid,
        status,
        returns_signed,
        returns_recognized,
      } = row;

      if (!month || month === "N/A") {
        console.warn(`Skipping record for ${employee} due to invalid month`);
        continue;
      }

      // 🔍 Lookup employee_id by name
      const empResult = await client.query(
        `SELECT employee_id FROM employee_list WHERE employee_name = $1`,
        [employee]
      );

      if (empResult.rows.length === 0) {
        console.warn(`❌ No employee_id found for ${employee}`);
        continue;
      }

      const employee_id = empResult.rows[0].employee_id;

      // 🔍 Fetch latest salary using employee_id
      const salaryResult = await client.query(
        `SELECT gross_salary AS salary_gross,
               net_payable_salary AS salary_net
        FROM employee_salary_details
        WHERE employee_id = $1
        ORDER BY year DESC, month DESC
        LIMIT 1`,
        [employee_id]
      );

      if (salaryResult.rows.length === 0) {
        console.warn(`❌ No salary details for ${employee}`);
        continue;
      }

      const { salary_gross, salary_net } = salaryResult.rows[0];
      if (salary_gross == null || salary_net == null) {
        console.warn(`❌ Missing salary data for ${employee}`);
        continue;
      }

      const min_returns_expected = salary_gross * 3.5;

      // ⚠️ Check for duplicate
      const exists = await client.query(
        `SELECT 1 FROM Cost_vs_ROI WHERE employee_id = $1 AND month = $2`,
        [employee_id, month]
      );
      if (exists.rows.length > 0) {
        console.log(`⚠️ Duplicate found for ${employee} (${month}), skipping...`);
        continue;
      }

      // ✅ Insert into Cost_vs_ROI
      await client.query(
        `INSERT INTO Cost_vs_ROI 
          (employee_id, employee, month, salary_gross, salary_net,
           cummulative_sal_paid, status, min_returns_expected,
           returns_signed, returns_recognized)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          employee_id,
          employee,
          month,
          salary_gross,
          salary_net,
          cummulative_sal_paid,
          status,
          min_returns_expected,
          returns_signed,
          returns_recognized,
        ]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "✅ Data uploaded successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: "Server error while uploading data" });
  } finally {
    client.release();
  }
});

module.exports = router;

























{/*const express = require("express");
const router = express.Router();
const dbConn = require("../config/DB"); // Database connection

// ✅ API to fetch data from Cost Vs ROI table
router.get("/cost-roi", async (req, res) => {
    try {
        const query = "SELECT * FROM Cost_vs_ROI;";
        const result = await dbConn.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// ✅ API to upload Cost Vs ROI data from Excel
router.post("/upload-cost-roi", async (req, res) => {
    try {
        const { data } = req.body;

        if (!data || data.length === 0) {
            return res.status(400).json({ message: "No data received" });
        }

        for (const row of data) {
            const { month, employee, cummulative_sal_paid, status, returns_signed, returns_recognized } = row;

            // Skip if month is N/A or invalid
            if (!month || month === "N/A") {
                console.warn(`Skipping record for ${employee} due to invalid month`);
                continue;
            }

            // Fetch salary_gross and salary_net
            const salaryQuery = `
                SELECT salary_gross, salary_net
                FROM employee_salary_details
                WHERE employee = $1 AND month = $2
            `;
            const salaryResult = await dbConn.query(salaryQuery, [employee, month]);

            if (salaryResult.rows.length === 0) {
                console.warn(`No salary details found for ${employee} in ${month}`);
                continue;
            }

            const { salary_gross, salary_net } = salaryResult.rows[0];

            // If salary_gross or salary_net is missing, skip this row
            if (salary_gross === null || salary_net === null) {
                console.warn(`Missing salary data for ${employee} in ${month}`);
                continue;
            }

            // Calculate min_returns_expected as salary_gross * 3.5
            const min_returns_expected = salary_gross * 3.5;

            // Insert data into Cost_vs_ROI table
            await dbConn.query(
                `INSERT INTO Cost_vs_ROI 
                (month, employee, salary_gross, salary_net, cummulative_sal_paid, status, 
                min_returns_expected, returns_signed, returns_recognized) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    month, employee, salary_gross, salary_net, cummulative_sal_paid,
                    status, min_returns_expected, returns_signed, returns_recognized
                ]
            );
        }

        res.json({ message: "Data uploaded successfully with salary info from database" });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Server error while uploading data" });
    }
});

module.exports = router;

*/}




















{/*const express = require("express");
const router = express.Router();
const dbConn = require("../config/DB"); // Database connection

// ✅ API to fetch data from Cost Vs ROI table
router.get("/cost-roi", async (req, res) => {
    try {
        // Query to get all rows from Cost_vs_ROI table
        const query = "SELECT * FROM Cost_vs_ROI;";
        const result = await dbConn.query(query);
        // Send result rows as JSON response
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        // Send error response in case of failure
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// ✅ API to upload Cost Vs ROI data from Excel
router.post("/upload-cost-roi", async (req, res) => {
    try {
        const { data } = req.body; // Extract data from the request body

        if (!data || data.length === 0) {
            // Return error if no data is received
            return res.status(400).json({ message: "No data received" });
        }

        // Loop through the rows of the received data and insert them into the database
        for (const row of data) {
            const { 
                month, employee, salary_gross, salary_net, 
                cummulative_sal_paid, status, min_returns_expected, 
                returns_signed, returns_recognized 
            } = row;

            // Insert data into the Cost_vs_ROI table
            await dbConn.query(
                `INSERT INTO Cost_vs_ROI 
                (month, employee, salary_gross, salary_net, cummulative_sal_paid, status, 
                min_returns_expected, returns_signed, returns_recognized) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    month, employee, salary_gross, salary_net, cummulative_sal_paid, 
                    status, min_returns_expected, returns_signed, returns_recognized
                ]
            );
        }

        // Send success response
        res.json({ message: "Data uploaded successfully" });
    } catch (error) {
        console.error("Upload error:", error);
        // Send error response if upload fails
        res.status(500).json({ message: "Server error while uploading data" });
    }
});

module.exports = router; */}
