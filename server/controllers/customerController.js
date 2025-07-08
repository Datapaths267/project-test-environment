const express = require("express");
const app = express();
const xlsx = require("xlsx");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const Joi = require("joi");
const dbConn = require("../config/DB");

const { custDetail, insertCustomer, getAllCustomers } = require("../models/customerModel");
const Customer = require("../models/customerModel");

const upload = multer({ dest: "uploads/" });
app.use(express.json());


const getCustomerDetail = async (req, res) => {
    try {
        console.log('DB entered to customer details....');
        const { companyId, country, role } = req.user;

        const customerDetail = await custDetail(companyId, country);

        res.status(200).json(customerDetail);
    }
    catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getCustomerFiles = async (req, res) => {
    try {
        console.log('DB entered to customer files....');

        const { customerId } = req.params; // Extract customerId from URL
        const { companyId, country, role } = req.user; // Extract companyId and country from authenticated user

        if (!customerId) {
            return res.status(400).json({ message: "Customer ID is required" });
        }

        const customerFiles = await Customer.custFiles(customerId, companyId, country);

        if (customerFiles.length === 0) {
            return res.status(404).json({ message: "No documents found for this customer" });
        }

        res.status(200).json(customerFiles);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getCustomerCompany = async (req, res) => {
    try {
        console.log('DB entered to customer details....');
        const { companyId } = req.user;

        const customerDetail = await Customer.getCustomersCompanies(companyId);

        res.status(200).json(customerDetail);
    }
    catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const registerCustomer = async (req, res) => {
    try {
        console.log("Received request to register customer");

        const formData = req.body;
        console.log("Received form data:", formData);
        console.log("Received files:", req.files);

        // Store actual file content as a buffer in DB
        if (req.files && req.files["documents"]) {
            const filePath = req.files["documents"][0].path; // Get file path
            const fileBuffer = fs.readFileSync(filePath); // Read file content as buffer
            formData["documents"] = fileBuffer; // Store buffer instead of JSON metadata
        }

        console.log("Buffer length:", formData["documents"].length);

        // Insert into DB
        const newCustomer = await Customer.insertCustomer(formData);
        console.log("Customer inserted successfully:", newCustomer);

        res.status(201).json({ message: "Customer registered successfully", data: newCustomer });

    } catch (error) {
        console.error("Error registering customer:", error);
        res.status(500).json({ message: "Error registering customer", error: error.message });
    }
};


const uploadExcel = async (req, res) => {
    try {
        console.log("Received file:", req.file);
        const { companyId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;
        console.log("File Path:", filePath);

        // Read the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheet_name_list = workbook.SheetNames;
        if (!sheet_name_list.length) {
            throw new Error("No sheets found in the Excel file");
        }

        const sheet = workbook.Sheets[sheet_name_list[0]];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

        console.log("Parsed Excel Data:", jsonData);

        if (!jsonData.length) {
            throw new Error("Excel file is empty or not properly formatted");
        }

        let insertedRows = 0; // Counter for successfully inserted rows

        for (const row of jsonData) {
            if (!row['customer_name']) {
                console.error("Skipping row due to missing customer_name:", row);
                continue;
            }

            const customerData = {
                customer: row['customer_name'] || null,
                customer_type: row['customer_type'] || null,
                customer_p_o_c: row['customer_side_poc'] || null,
                account_manager_p_o_c: row['account_manager_poc'] || null,
                address: row['address'] || null,
                nda: row['nda_done'] === "TRUE",
                msa: row['msa_done'] === "TRUE",
                country: row['country'] || null,
                billing_currency: row['billing_currency'] || null,
                documents: row['documents'] || null,
                contacts: row['contacts'] || null,
                status: row['status'] || null,
                agreement_type: row['agreement_type'] || null,
                fte_percentage: row['fte_percentage'] || null,
                invoice_period: row['invoice_period'] || null,
                customer_rating: parseInt(row['customer_rating'], 10) || null,
                rate_flag: parseInt(row['rate_flag'], 10) || null,
                req_rating: row['req_rating'] || null,
                company_id: row['company_id'] ? row['company_id'] : companyId
            };

            await insertCustomer(customerData);
            insertedRows++; // Increase the count for each successful insert
        }

        res.status(200).json({
            success: true,
            insertedRows: insertedRows,
            message: `${insertedRows} customers added successfully!`
        });

    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({
            success: false,
            error: "Error processing file: " + error.message
        });
    }
};

// 📌 2️⃣ Download Data as Excel
const downloadExcel = async (req, res) => {
    try {
        const data = await getAllCustomers();
        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Customers");

        const filePath = path.join(__dirname, "../customers_data.xlsx");
        xlsx.writeFile(workbook, filePath);

        res.download(filePath, "customers_data.xlsx", () => {
            fs.unlinkSync(filePath); // Delete the file after download
        });

    } catch (error) {
        res.status(500).json({ error: "Data retrieval failed!", details: error });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const {
            customer_id,
            customer_name,
            customer_type,
            customer_side_poc,
            account_manager_poc,
            address,
            nda_done,
            msa_done,
            country,
            billing_currency,
            contacts,
            status,
            agreement_type,
            customer_rating,
            rate_flag,
            req_rating,
            fte_percentage,
            invoice_period,
            company_id
        } = req.body;
        console.log("Received request to update customer:", req.body);

        const query = `
        UPDATE  customers_detail SET
           customer_name = $2 , customer_type = $3 , customer_side_poc = $4 , account_manager_poc = $5 , address = $6 , nda_done = $7 , msa_done = $8,
             country = $9 , billing_currency = $10 , contacts = $11 , status = $12 , agreement_type = $13 , customer_rating = $14 , rate_flag = $15 , req_rating = $16 , 
             fte_percentage = $17 , invoice_period = $18 , company_id = $19  
           WHERE customer_id = $1 
        `;

        const values = [
            customer_id,
            customer_name,
            customer_type,
            customer_side_poc,
            account_manager_poc,
            address,
            nda_done,
            msa_done,
            country,
            billing_currency,
            contacts,
            status,
            agreement_type,
            customer_rating,
            rate_flag,
            req_rating,
            fte_percentage,
            invoice_period,
            company_id
        ];

        await dbConn.query(query, values);
        console.log("Customer updated successfully:", customer_id);

        res.status(201).json({ message: "customer updated successfully" });
    } catch (error) {
        console.error("Error adding contact:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteCustomers = async (req, res) => {
    try {
        const { customerId } = req.params;
        if (!customerId) {
            return res.status(400).json({ error: "customer ID is required" });
        }

        await Customer.deleteCustomer(customerId);
        res.json({ message: "customer deleted successfully." });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error deleting customer." });
    }
};

module.exports = { getCustomerDetail, deleteCustomers, getCustomerCompany, getCustomerFiles, registerCustomer, uploadExcel, downloadExcel, updateCustomer };