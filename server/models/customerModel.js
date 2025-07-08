const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const Customer = {
    custDetail: async (companyId, country) => {
        const result = await dbConn.query(
            `SELECT customer_id, customer_name, customer_type, customer_side_poc, account_manager_poc, address, nda_done, msa_done,
             country, billing_currency, contacts, status, agreement_type, customer_rating, rate_flag, req_rating, fte_percentage, invoice_period,
             company_id FROM customers_detail WHERE company_id = $1 and country = $2 ORDER BY customer_id ASC` ,
            [companyId, country]
        );
        return result.rows; // Return the full array instead of just one row
    },

    custFiles: async (customerId, companyId, country) => {
        const result = await dbConn.query(
            `SELECT customer_id, documents FROM customers_detail WHERE customer_id = $1 AND company_id = $2 AND country = $3`,
            [customerId, companyId, country]
        );
        return result.rows; // Return all matching rows
    },

    insertCustomer: async (customerData) => {
        try {
            const query = `
                INSERT INTO customers_detail (
                    customer_name, customer_type, customer_side_poc, account_manager_poc, address, nda_done, msa_done, 
                    country, billing_currency, contacts, status, agreement_type, fte_percentage, invoice_period,
                    customer_rating, rate_flag, req_rating,company_id, documents
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,$17, $18, $19)
                RETURNING *;
            `;

            const values = [
                customerData.customer, // Ensure this is mapped correctly
                customerData.customer_type, // Use snake_case to match DB
                customerData.customer_p_o_c,
                customerData.account_manager_p_o_c,
                customerData.address,
                customerData.nda,
                customerData.msa,
                customerData.country,
                customerData.billing_currency,
                customerData.contacts,
                customerData.status,
                customerData.agreement_type,
                customerData.fte_percentage,
                customerData.invoice_period,
                customerData.customer_rating,
                customerData.rate_flag,
                customerData.req_rating,
                customerData.company_id,
                customerData.documents // Ensure this is handled correctly for files
            ];

            console.log("Executing query:", query);
            console.log("Values:", values);

            const result = await dbConn.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error("Database insertion error:", error);
            throw new Error("Database insertion failed: " + error.message);
        }
    },

    getCustomersCompanies: async (companyId) => {
        const result = await dbConn.query(
            `SELECT customer_id, customer_name FROM customers_detail WHERE company_id = $1`,
            [companyId]
        );
        return result.rows; // Return all matching rows
    },

    getAllCustomers: async () => {
        const { rows } = await pool.query("SELECT * FROM customers_detail");
        return rows;
    },

    deleteCustomer: async (customerId) => {
        await dbConn.query("DELETE FROM customers_detail WHERE customer_id = $1", [customerId]);
    }
};

module.exports = Customer;
