const dbConn = require('./config/DB')
const express = require("express")
const bp = require("body-parser");
const cors = require("cors")
const app = express();

app.use(cors())
app.use(express.json());
app.use(bp.urlencoded({ extended: true }));


dbConn.connect().then( () => { console.log('DB connected....')})

app.post('/login', async (req, res) => {
    const { username, password, country } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const query = `
        SELECT employee_username, employee_password, employee_portal_access 
        FROM employee_list 
        WHERE employee_username = $1 and employee_country = $2
    `;

    try {
        const result = await dbConn.query(query, [username, country]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid username or password or country" });
        }

        const user = result.rows[0];

        // Verify password (assuming plain text, use hashing for security)
        if (user.employee_password !== password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Check access level and return response
        if (user.employee_portal_access === "super_Admin" || user.employee_portal_access === "Admin") {
            return res.status(200).json({ role: "admin", message: "Admin login successful" });
        } else {
            return res.status(200).json({ role: "user", message: "User login successful" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.get('/countryAll', (req,res) => {
    console.log('DB entered to country....')
    const fetch_query = 'Select * from countries where status = true';
    dbConn.query(fetch_query, (err, result) => {
        if(!err){
        //    console.log(result.rows);
            //res.send(result.rows);
            res.status('200').json(result.rows);
        }else{
            console.log(err.message);
            res.send(err.message);
        }
    })
})

app.get('/designation', (req,res) => {
    console.log('DB entered to designation....')
    const fetch_query = 'Select role_name from roles';
    dbConn.query(fetch_query, (err, result) => {
        if(!err){
        //    console.log(result.rows);
            //res.send(result.rows);
            res.status('200').json(result.rows);
        }else{
            console.log(err.message);
            res.send(err.message);
        }
    })
})

app.get('/companies', (req,res) => {
    console.log('DB entered to companies....')
    const fetch_query = 'Select * from companies';
    dbConn.query(fetch_query, (err, result) => {
        if(!err){
          //  console.log(result.rows);
            //res.send(result.rows);
            res.status('200').json(result.rows);
        }else{
            console.log(err.message);
            res.send(err.message);
        }
    })
})


app.get('/companiesbycounty/:country_code', (req,res) => {
    console.log('DB entered to companies....' + req.params.country_code)
    //console.log(:country_code)
    const county_code = req.params.country_code;
    const fetch_query = 'Select com_id, com_name, com_country from companies where com_country = $1';
    dbConn.query(fetch_query, [county_code], (err, result) => {
        if(!err){
           // console.log(result.rows);
            //res.send(result.rows);
            res.status('200').json(result.rows);
        }else{
            console.log(err.message);
            res.send(err.message);
        }
    })
})


app.get('/customerList', (req,res) => {
    console.log('DB entered to cuntomers....')
    const fetch_query_from_customer = 'Select * from customer_list ORDER BY customer_id ASC';
    dbConn.query(fetch_query_from_customer, (err, result) => {
        if(!err){
            //console.log(result.rows);
            //res.send(result.rows);
            res.status('200').json(result.rows);
        }else{
            console.log(err.message);
            res.send(err.message);
        }
    })
})


app.get('/city', (req,res) => {
    console.log('DB entered to city....')
    const fetch_query_from_customer = 'Select com_city, com_id from companies';
    dbConn.query(fetch_query_from_customer, (err, result) => {
        if(!err){
          //  console.log(result.rows);
            //res.send(result.rows);
            res.status('200').json(result.rows);
        }else{
            console.log(err.message);
            res.send(err.message);
        }
    })
})

app.get('/employeeList', (req, res) => {
    console.log('DB entered to employee list....');
    
    // Fetch employees sorted by ID in ascending order
    const fetch_query_from_employee_notAssigned = "SELECT * FROM employee_list ORDER BY e_id ASC";

    dbConn.query(fetch_query_from_employee_notAssigned, (err, result) => {
        if (!err) {
            res.status(200).json(result.rows);
        } else {
            console.error("Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    });
});


app.get('/work_assign_company_list', (req, res) => {
    console.log('DB entered to work_assign_company_list....');
    
    const fetch_query_from_employee_notAssigned = "SELECT * FROM work_assigned_by_employees "; // Ensure correct value

    dbConn.query(fetch_query_from_employee_notAssigned, (err, result) => {
        if (!err) {
            res.status(200).json(result.rows);
        } else {
            console.error("Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    });
});


app.get('/employeeList_With_Work_Not_Assign', (req, res) => {
    console.log('DB entered to work not Assigned....');
    
    const fetch_query_from_employee_notAssigned = "SELECT * FROM employee_list WHERE work_assign_status = 'notAssigned' ORDER BY e_id ASC"; // Ensure correct value

    dbConn.query(fetch_query_from_employee_notAssigned, (err, result) => {
        if (!err) {
           // console.log("Fetched Not Assigned Employees:", result.rows);
            res.status(200).json(result.rows);
        } else {
            console.error("Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    });
});


app.get('/employeeList_With_Work_Assign', (req, res) => {
    console.log('DB entered to work assigned....');
    
    const fetch_query_from_employee_Assigned = "SELECT * FROM employee_list WHERE work_assign_status = 'assigned' ORDER BY e_id ASC";  // Ensure correct value

    dbConn.query(fetch_query_from_employee_Assigned, (err, result) => {
        if (!err) {
           // console.log("Fetched Assigned Employees:", result.rows);
            res.status(200).json(result.rows);
        } else {
            console.error("Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    });
});



app.post('/addEmployee', (req, res) => {
    const {
        employee_country, employee_working_company, employee_name,
        employee_DOJ, employee_designation, employee_gender, employee_status,
        employee_portal_access, employee_username, employee_password,
        employee_email, employee_mobile_number, employee_city
    } = req.body;

    const insert_query = `
        INSERT INTO employee_list (
           employee_country, employee_working_company, employee_name,
            employee_DOJ, employee_designation, employee_gender, employee_status,
             employee_portal_access, employee_username, employee_password,
            employee_email, employee_mobile_number, employee_city
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    dbConn.query(insert_query, [
       employee_country, employee_working_company, employee_name,
        employee_DOJ, employee_designation, employee_gender, employee_status,
       employee_portal_access, employee_username, employee_password,
        employee_email, employee_mobile_number,employee_city
    ], (err) => {
        if (!err) {
            res.status(201).json({ message: "Employee added successfully!" });
        } else {
            console.log(err.message);
            res.status(500).send(err.message);
        }
    });
});

// app.post('/assignCompanies', (req, res) => {
//     console.log("db entered in assigncomapnies .....");
//     const {
//         employee_id, country, companies
//     } = req.body;
//     console.log(companies);
//     const insert_query = `
//         INSERT INTO work_assigned_by_employees (
//           user_id, work_assigned_country, work_assigned_comapnies
//         ) VALUES ($1, $2, $3)
//     `;

//     const update_query = `
//         UPDATE employee_list
//         SET work_assign_status = 'assigned'
//         WHERE employee_id = '$1';
// `;

//     dbConn.query(insert_query, [employee_id, country, companies], (err) => {
//         //console.log(companies + "c1");
//         if (!err) {
//             //console.log(companies + "c1");
//         } else {
//             console.log(err.message);
//             res.status(500).send(err.message);
//         }
//     });

//     //res.status(201).json({ message: "Employee added successfully!" });
//     dbConn.query(update_query, [employee_id], (err) => {
//          console.log(employee_id + "c1 srini");
//         if (!err) {
//             res.status(204).json({ message: "Employee work assigned successfully!" });
//         } else {
//             console.log(err.message);
//             res.status(500).send(err.message);
//         }
//     });


// });

app.post('/assignCompanies', (req, res) => {
    console.log("db entered in assignCompanies .....");

    const { employee_id, country, companies } = req.body;
    console.log(companies);
    console.log("db entered in assignCompanies" + country);
    // SQL query for inserting data into work_assigned_by_employees table
    const insert_query = `
        INSERT INTO work_assigned_by_employees (
            user_id, country_id, work_assigned_comapnies
        ) VALUES ($1, $2, $3)
    `;

    // SQL query for updating the employee status in employee_list table
    const update_query = `
        UPDATE employee_list
        SET work_assign_status = 'assigned'
        WHERE employee_id = $1;
    `;

    // Begin the transaction
    dbConn.query('BEGIN', (err) => {
        console.log("entered in work assign .......");
        if (err) {
            console.log('Error starting transaction:', err);
            return res.status(500).send('Error starting transaction');
        }

        // Insert the assignment into the work_assigned_by_employees table
        dbConn.query(insert_query, [employee_id, country, companies], (err) => {
            if (err) {
                console.log('Error in inserting data:', err);
                dbConn.query('ROLLBACK', () => {
                    res.status(500).send('Error inserting work assignment');
                });
                return;
            }

            // Update the employee status in the employee_list table
            dbConn.query(update_query, [employee_id], (err) => {
                if (err) {
                    console.log('Error in updating data:', err);
                    dbConn.query('ROLLBACK', () => {
                        res.status(500).send('Error updating employee status');
                    });
                    return;
                }

                // Commit the transaction if both queries succeed
                dbConn.query('COMMIT', (err) => {
                    if (err) {
                        console.log('Error committing transaction:', err);
                        res.status(500).send('Error committing transaction');
                        return;
                    }

                    // Send success response after both queries are successful
                    console.log('Employee work assigned successfully!');
                    res.status(201).json({ message: "Employee work assigned successfully!" });
                });
            });
        });
    });
});

app.post('/changeAssignCompanies', (req, res) => {
    console.log("Entered in changeAssignCompanies...");

    const { employee_id, country, companies } = req.body;
    console.log("Selected Employee ID:", employee_id);
    console.log("Selected Country ID:", country);
    console.log("Selected Companies:", companies);

    // Begin transaction
    dbConn.query('BEGIN', async (err) => {
        if (err) {
            console.log('Error starting transaction:', err);
            return res.status(500).send('Error starting transaction');
        }

        try {
            // Check if the employee is already assigned to the same country
            const check_query = `
                SELECT * FROM work_assigned_by_employees
                WHERE user_id = $1 AND country_id = $2;
            `;

            const checkResult = await dbConn.query(check_query, [employee_id, country]);

            if (checkResult.rows.length > 0) {
                // Employee is already assigned to this country, update assigned companies
                const update_query = `
                    UPDATE work_assigned_by_employees
                    SET work_assigned_comapnies = $3
                    WHERE user_id = $1 AND country_id = $2;
                `;
                await dbConn.query(update_query, [employee_id, country, companies]);
                console.log('Existing assignment updated.');
            } else {
                // New country assigned, insert new row
                const insert_query = `
                    INSERT INTO work_assigned_by_employees (user_id, country_id, work_assigned_comapnies)
                    VALUES ($1, $2, $3);
                `;
                await dbConn.query(insert_query, [employee_id, country, companies]);
                console.log('New assignment added.');
            }

            // Update employee work status in employee_list
            const status_update_query = `
                UPDATE employee_list
                SET work_assign_status = 'assigned'
                WHERE employee_id = $1;
            `;
            await dbConn.query(status_update_query, [employee_id]);

            // Commit the transaction
            await dbConn.query('COMMIT');
            res.status(200).json({ message: "Employee assignment updated successfully!" });

        } catch (error) {
            console.log('Error:', error);
            await dbConn.query('ROLLBACK');
            res.status(500).send('Error updating work assignment');
        }
    });
});



app.listen('8000', () => {
    console.log('Server running at 8000 port!!!...');
})