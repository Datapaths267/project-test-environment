const express = require("express");
const router = express.Router();
const dbConn = require("../config/DB");
const pool = require('../db');


// ✅ GET employee salary history details from recuirement DB (updated)
router.get("/employee-salary-history-details", async (req, res) => {
  console.log("✅ Route /employee-salary-history-details hit");
  try {
    const result = await dbConn.query(`
      SELECT 
        employee_id,
        name as employee_name,
        doj,
        month,
        year,
        type as relationship_type,
        basic_salary,
        hra,
        conveyance as conveyance_allowances,
        medical as medical_reimbursement,
        internet as internet_allowance,
        pt,
        total_days as total_working_days_of_month,
        worked_days,
        leaves_taken,
        paid_leaves,
        leave_deductions,
        gross_salary,
        pf,
        tds,
        advance as advance_payback,
        total_deductions,
        net_salary as net_payable_salary,
        remarks,
        payment_done,
        from_leave_dates as from_dates,
        to_leave_dates as to_dates
      FROM employee_salary_history
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching salary history details:", err);
    res.status(500).json({ error: "Failed to fetch salary history details" });
  }
});

// Rest of the file remains completely unchanged
router.get("/employee-salary-details", async (req, res) => {
  console.log("✅ Route /employee-salary-details hit");

  try {
    const result = await dbConn.query(`
      SELECT 
  esd.employee_id,
  el.employee_name,
  esd.doj,
  esd.month,
  esd.year,
  esd.relationship_type,
  esd.basic_salary,
  esd.hra,
  esd.conveyance_allowances,
  esd.medical_reimbursement,
  esd."Internet Allowance" as internet_allowance,
  esd.gross_salary,
  esd."PT" as pt,
  esd.total_working_days_of_month,
  esd.worked_days,
  esd.total_leave_taken,
  esd.paid_leaves,
  esd.casual_leave,
  esd.sick_leave,
  esd.approved_dates,
  esd.leave_deductions,
  esd.pf,
  esd.tds,
  esd.advance_payback,
  esd.total_deductions,
  esd.net_payable_salary,
  esd.remarks,
  esd.payment_done,
  esd.from_leave_dates as from_dates,
  esd.to_leave_dates as to_dates,
  esd.approved_by
FROM employee_salary_details esd
JOIN employee_list el ON esd.employee_id = el.employee_id order by esd.employee_id asc
    `);

    const enrichedData = await Promise.all(result.rows.map(async data => {
      const dailySalary = Number(data.basic_salary || 0) / Number(data.total_working_days_of_month || 1);

      let unpaidLeaveDays = data.total_leave_taken;
      if ((data.paid_leaves || 0) > 0 || (data.casual_leave || 0) > 0 || (data.sick_leave || 0) > 0) {
        unpaidLeaveDays = data.total_leave_taken - ((data.casual_leave || 0) + (data.sick_leave || 0));
      }

      const maxPossibleDeduction = unpaidLeaveDays * dailySalary;

      const current_total_deduction =
        Number(data.pf || 0) +
        Number(data.tds || 0) +
        Number(data.pt || 0) +
        Number(data.advance_payback || 0);

      // ✅ Update the database with computed values
      await dbConn.query(
        `
    UPDATE employee_salary_details
    SET leave_deductions = $1,
        total_deductions = $2
    WHERE employee_id = $3 AND year = $4 AND month = $5
    `,
        [maxPossibleDeduction, current_total_deduction, data.employee_id, data.year, data.month]
      );

      return {
        ...data,
        daily_salary: dailySalary,
        unpaid_leave_days: unpaidLeaveDays,
        max_possible_deduction: maxPossibleDeduction,
        leave_deductions: maxPossibleDeduction,
        total_deductions: current_total_deduction
      };
    }));

    console.log("total deductions:", enrichedData.map(item => item.total_deductions));

    res.json(enrichedData);
  } catch (err) {
    console.error("❌ Error fetching salary details:", err);
    res.status(500).json({ error: "Failed to fetch salary details" });
  }
});


router.get("/getEmployeeSalary/:id", async (req, res) => {
  const empId = req.params.id;
  console.log(`✅ Route /getEmployeeSalary/${empId} hit`);

  try {
    const result = await dbConn.query(
      `SELECT 
        employee_id,
        employee_name,
        doj,
        month,
        year,
        relationship_type,
        basic_salary,
        hra,
        conveyance_allowances,
        medical_reimbursement,
        "Internet Allowance" as internet_allowance,
        "PT" as pt,
        total_working_days_of_month,
        worked_days,
        leaves_taken,
        paid_leaves,
        leave_deductions,
        gross_salary,
        pf,
        tds,
        advance_payback,
        total_deductions,
        net_payable_salary,
        remarks,
        payment_done
       FROM employee_salary_details 
       WHERE employee_id = $1`,
      [empId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee salary details not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching employee salary details:", err);
    res.status(500).json({ error: "Failed to fetch employee salary details" });
  }
});

router.put("/update-employee-salary-details", async (req, res) => {
  const updatedData = req.body;

  try {
    await dbConn.query("BEGIN");

    for (const data of updatedData) {
      const {
        employee_id,
        month,
        year,
        basic_salary,
        hra,
        conveyance_allowances,
        medical_reimbursement,
        internet_allowance,
        pt,
        total_working_days_of_month,
        worked_days,
        total_leave_taken,
        paid_leaves,
        casual_leave,
        sick_leave,
        leave_deductions,
        gross_salary,
        pf,
        tds,
        advance_payback,
        total_deductions,
        net_payable_salary,
        remarks,
        payment_done,
        from_dates,
        to_dates
      } = data;

      console.log(`✅ Updating salary details for employee_id: ${employee_id}, month: ${month}, year: ${year}`);
      console.log("Data:", data);
      // const dailySalary = basic_salary / total_working_days_of_month;
      // const count_leave_days = total_leave_taken - (paid_leaves + casual_leave + sick_leave);
      // const maxPossibleDeduction = count_leave_days * dailySalary;
      // const validatedLeaveDeductions = gross_salary - maxPossibleDeduction;

      await dbConn.query(
        `UPDATE employee_salary_details SET
          basic_salary = $1,
          hra = $2,
          conveyance_allowances = $3,
          medical_reimbursement = $4,
          "Internet Allowance" = $5,
          "PT" = $6,
          total_working_days_of_month = $7,
          worked_days = $8,
          total_leave_taken = $9,
          paid_leaves = $10,
          leave_deductions = $11,
          gross_salary = $12,
          pf = $13,
          tds = $14,
          advance_payback = $15,
          total_deductions = $16,
          net_payable_salary = $17,
          remarks = $18,
          payment_done = $19,
          casual_leave = $20,
          sick_leave = $21,
          from_leave_dates = $22,
          to_leave_dates = $23
        WHERE employee_id = $22 AND month = $23 AND year = $24`,
        [
          basic_salary,
          hra,
          conveyance_allowances,
          medical_reimbursement,
          internet_allowance,
          pt,
          total_working_days_of_month,
          worked_days,
          total_leave_taken,
          paid_leaves,
          leave_deductions,
          gross_salary,
          pf,
          tds,
          advance_payback,
          Number(total_deductions) || 0,
          net_payable_salary,
          remarks,
          payment_done,
          casual_leave,
          sick_leave,
          employee_id,
          month,
          year
        ]
      );
    }

    await dbConn.query("COMMIT");
    res.status(200).json({ message: "Salary details updated successfully" });
  } catch (err) {
    await dbConn.query("ROLLBACK");
    console.error("❌ Error updating salary details:", err);
    res.status(500).json({ error: "Failed to update salary details" });
  }
});

router.get("/employee-gross-net-salary", async (req, res) => {
  console.log("✅ Route /employee-gross-net-salary hit");
  try {
    const result = await dbConn.query(
      `SELECT 
        employee_id, 
        employee_name, 
        gross_salary, 
        net_payable_salary 
       FROM employee_salary_details`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching gross and net salary:", err);
    res.status(500).json({ error: "Failed to fetch gross and net salary" });
  }
});

router.post("/insert-employee-salary-details", async (req, res) => {
  const newData = req.body;
  console.log("✅ Route /insert-employee-salary-details hit");
  console.log("New Data:", newData);

  try {
    await dbConn.query("BEGIN");

    for (const data of newData) {
      const {
        payment_done,
        month,
        year,
        relationship_type,
        employee_id,
        employee_name,
        doj,
        basic_salary,
        hra,
        conveyance_allowances,
        medical_reimbursement,
        internet_allowance,
        pt,
        gross_salary,
        pf,
        tds,
        advance_payback,
        total_deductions,
        net_payable_salary,
        remarks,
        payment_month,
        payment_year,
        payment_date,
        role,
        status,
        min_returns_expected,
        return_signed,
        return_recognized,
        leave_deductions,
        total_working_days_of_month,
        leaves_taken
      } = data;

      const dailySalary = basic_salary / total_working_days_of_month;
      const maxPossibleDeduction = leaves_taken * dailySalary;
      const validatedLeaveDeductions = Math.min(leave_deductions, maxPossibleDeduction);
      const formattedMonthDate = new Date(`${month} 1, ${year}`).toISOString().split('T')[0];

      await dbConn.query(
        `INSERT INTO employee_salary_details (
          basic_salary,
          hra,
          conveyance_allowances,
          medical_reimbursement,
          "Internet Allowance",
          "PT",
          gross_salary,
          pf,
          tds,
          advance_payback,
          total_deductions,
          net_payable_salary,
          remarks,
          payment_done,
          month,
          year,
          month_date,
          relationship_type,
          employee_name,
          doj,
          leave_deductions,
          total_working_days_of_month,
          leaves_taken
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23
        )`,
        [
          basic_salary,
          hra,
          conveyance_allowances,
          medical_reimbursement,
          internet_allowance,
          pt,
          gross_salary,
          pf,
          tds,
          advance_payback,
          total_deductions,
          net_payable_salary,
          remarks,
          payment_done,
          payment_month,
          payment_year,
          payment_date,
          relationship_type,
          employee_name,
          doj,
          validatedLeaveDeductions,
          total_working_days_of_month,
          leaves_taken
        ]
      );

      const { rows } = await dbConn.query(
        `SELECT cummulative_sal_paid, salary_gross
         FROM cost_vs_roi
         WHERE employee_id = $1
         ORDER BY month DESC
         LIMIT 1`,
        [employee_id]
      );

      const prevCumulative = rows.length > 0 ? parseFloat(rows[0].cummulative_sal_paid) : 0;
      const newCumulative = prevCumulative + parseFloat(net_payable_salary);
      const prevSalaryGross = rows.length > 0 ? parseFloat(rows[0].cummulative_sal_paid) : 0;
      const minReturnsExpected = parseFloat(prevSalaryGross) * 3.5;

      await dbConn.query(
        `INSERT INTO cost_vs_roi (
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
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11
        )`,
        [
          employee_name,
          gross_salary,
          net_payable_salary,
          newCumulative,
          status || 'Active',
          minReturnsExpected || 0,
          return_signed || 0,
          return_recognized || 0,
          employee_id,
          role || 'Not Assigned',
          payment_date
        ]
      );
    }

    await dbConn.query("COMMIT");
    res.status(201).json({ message: "✅ Salary details & ROI inserted successfully." });
  } catch (err) {
    await dbConn.query("ROLLBACK");
    console.error("❌ Error inserting salary details or cost_vs_roi:", err);
    res.status(500).json({ error: "❌ Failed to insert salary details" });
  }
});

router.put("/push-employee-salary-details", async (req, res) => {
  const updatedData = req.body;

  try {
    await dbConn.query("BEGIN");

    for (const data of updatedData) {
      const {
        employee_id,
        employee_name,
        doj,
        month,
        year,
        relationship_type,
        basic_salary,
        hra,
        conveyance_allowances,
        medical_reimbursement,
        internet_allowance,
        pt,
        total_working_days_of_month,
        worked_days,
        leaves_taken,
        paid_leaves,
        leave_deductions,
        gross_salary,
        pf,
        tds,
        advance_payback,
        total_deductions,
        net_payable_salary,
        remarks
      } = data;

      await dbConn.query(
        `INSERT INTO employee_salary_history (
          employee_id,
          name,
          doj,
          month,
          year,
          type,
          basic_salary,
          hra,
          conveyance,
          medical,
          internet,
          pt,
          total_days,
          worked_days,
          leaves_taken,
          paid_leaves,
          leave_deductions,
          gross_salary,
          pf,
          tds,
          advance,
          total_deductions,
          net_salary,
          remarks,
          payment_done
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, true
        )`,
        [
          employee_id,
          employee_name,
          doj,
          month,
          year,
          relationship_type,
          basic_salary,
          hra,
          conveyance_allowances,
          medical_reimbursement,
          internet_allowance,
          pt,
          total_working_days_of_month,
          worked_days,
          leaves_taken,
          paid_leaves,
          leave_deductions,
          gross_salary,
          pf,
          tds,
          advance_payback,
          total_deductions,
          net_payable_salary,
          remarks
        ]
      );
    }
    await dbConn.query("COMMIT");
    res.status(200).json({ message: "Salary details updated successfully" });
  } catch (err) {
    await dbConn.query("ROLLBACK");
    console.error("❌ Error updating salary details:", err);
    res.status(500).json({ error: "Failed to update salary details" });
  }
});

const pushToSalaryHistory = async (req, res) => {
  try {
    const paidSalaries = req.body;

    if (!Array.isArray(paidSalaries) || paidSalaries.length === 0) {
      return res.status(400).json({ error: 'No data received.' });
    }

    console.log(`✅ Received data to push: ${paidSalaries.length}`);

    let insertedCount = 0;

    for (const item of paidSalaries) {
      const { employee_id, month, year } = item;

      // ✅ Step 1: Check for duplicates
      const checkResult = await dbConn.query(
        `SELECT 1 FROM employee_salary_history WHERE employee_id = $1 AND month = $2 AND year = $3`,
        [employee_id, month, year]
      );

      if (checkResult.rows.length > 0) {
        console.log(`⚠️ Salary already exists for ${employee_id} - ${month}/${year}, skipping.`);
        continue;
      }

      console.log(`➡️ Inserting for ${employee_id} - ${month}/${year}`);

      item.payment_done = true;

      // ✅ Step 2: Insert into history
      await dbConn.query(
        `INSERT INTO employee_salary_history (
          employee_id, name, doj, month, year, type,
          basic_salary, hra, conveyance, medical, internet,
          total_days, worked_days, leaves_taken, paid_leaves,
          leave_deductions, gross_salary, pf, tds, pt, advance,
          total_deductions, net_salary, remarks, payment_done, from_leave_dates, to_leave_dates
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21,
          $22, $23, $24, $25, $26, $27
        )`,
        [
          item.employee_id,
          item.employee_name,
          item.doj,
          item.month,
          item.year,
          item.relationship_type,
          item.basic_salary,
          item.hra,
          item.conveyance_allowances,
          item.medical_reimbursement,
          item.internet_allowance,
          item.total_working_days_of_month,
          item.worked_days,
          item.leaves_taken,
          item.paid_leaves,
          item.leave_deductions,
          item.gross_salary,
          item.pf,
          item.tds,
          item.pt,
          item.advance_payback,
          item.total_deductions,
          item.net_payable_salary,
          item.remarks,
          item.payment_done,
          item.from_dates || null,
          item.to_dates || null
        ]
      );

      // ✅ Step 3: Update leave counts in employee_salary_details
      await dbConn.query(
        `UPDATE employee_salary_details
         SET total_pl = COALESCE(total_pl, 0) + $1,
             total_cl = COALESCE(total_cl, 0) + $2,
             total_sl = COALESCE(total_sl, 0) + $3
         WHERE employee_id = $4`,
        [
          item.paid_leaves || 0,
          item.casual_leave || 0,
          item.sick_leave || 0,
          item.employee_id
        ]
      );

      insertedCount++;
      console.log(`✅ Inserted and updated leave counts for: ${item.employee_id}`);
    }

    if (insertedCount > 0) {
      return res.status(200).json({ message: `✅ ${insertedCount} salaries pushed to history table successfully.` });
    } else {
      return res.status(201).json({ message: '⚠️ All salaries were already marked as paid. Nothing was inserted.' });
    }

  } catch (err) {
    console.error('❌ Error pushing salary history:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


router.put("/push-to-salary-history", pushToSalaryHistory);


// ✅ Route to check if salary is already generated for a month and year
router.get('/salary-exists', async (req, res) => {
  const { month, year } = req.query;

  try {
    const result = await dbConn.query(
      'SELECT COUNT(*) FROM employee_salary_history WHERE month = $1 AND year = $2',
      [month, year]
    );

    const alreadyExists = parseInt(result.rows[0].count) > 0;
    res.json({ exists: alreadyExists });
  } catch (error) {
    console.error('❌ Error checking salary history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//leave component
router.get("/employee-salary-leave", async (req, res) => {
  console.log("✅ Route /employee-salary-leave hit");
  try {
    const result = await dbConn.query(`
      SELECT 
        el.employee_id,
        el.employee_name, 
        esl.year,
        esl.month,
        esl.total_working_days_of_month AS working_days,
        esl.worked_days AS billed_days,
        esl.total_leave_taken,
       
        esl.paid_leaves,
        esl.casual_leave,
        esl.sick_leave,
        esl.leave_deductions AS lop,
        esl.approved_dates,
        esl.approved_by,
        esl.remarks,
        esl.from_leave_dates AS from_dates,
        esl.to_leave_dates AS to_dates

      FROM employee_salary_details esl
      JOIN employee_list el ON esl.employee_id = el.employee_id
    `);

    console.log("✅ Fetched", result.rows.length, "employee salary leave records");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching employee salary leave details:", err);
    res.status(500).json({ error: "Failed to fetch employee salary leave details" });
  }
});



router.put('/employee-salary-leave/:employee_id', async (req, res) => {
  const { employee_id } = req.params;
  const {
    // year,
    // month,
    // working_days,
    // billed_days,
    // total_leave_taken,
    // leave_dates, // comma separated string
    // paid_leaves,
    // casual_leave,
    // sick_leave,
    // lop,
    // approved_dates,
    // approved_by,
    // remarks

    year,
    month,
    working_days,
    billed_days,
    total_leave_taken,
    from_dates,
    paid_leaves,
    casual_leave,
    sick_leave,
    lop,
    approved_dates,
    approved_by,
    remarks,
    to_dates,


  } = req.body;

  try {
    await dbConn.query(
      `UPDATE employee_salary_details 
       SET year = $1, month = $2, total_working_days_of_month = $3, worked_days = $4,
           total_leave_taken = $5, from_leave_dates = $6, paid_leaves = $7, casual_leave = $8, sick_leave = $9, leave_deductions = $10,
           approved_dates = $11, approved_by = $12, remarks = $13, to_leave_dates = $15
       WHERE employee_id = $14 AND year = $1 AND month = $2`,
      [
        year,
        month,
        working_days,
        billed_days,
        total_leave_taken,
        from_dates, // save as string
        paid_leaves,
        casual_leave,
        sick_leave,
        lop,
        approved_dates,
        approved_by,
        remarks,
        employee_id,
        to_dates
      ]
    );
    res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update record" });
  }
});


module.exports = router;