const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const Company = {
    countryAll: async () => {
        const query = "Select * from countries where status = true";
        const result = await dbConn.query(query);
        return result.rows;
    },

    companies: async () => {
        const query = "Select company_id, countries, company_name from company_registration";
        const result = await dbConn.query(query);
        return result.rows;
    },

    companiesbycounty: async (county_code) => {
        console.log("entered into query selector..." + county_code)
        const query = "Select company_id, countries, company_name from company_registration where countries = $1";
        const result = await dbConn.query(query, [county_code]);
        return result.rows;
    },

    customerList: async () => {
        const query = "Select * from customer_list ORDER BY customer_id ASC";
        const result = await dbConn.query(query);
        return result.rows;
    },

    companyCity: async () => {
        const query = "Select com_city, com_id from companies";
        const result = await dbConn.query(query);
        return result.rows;
    },

    insertCompany: async (companyData) => {
        try {
            const query = `
                INSERT INTO company_registration (
                    company_name, company_type, company_series, date_of_registration, status, multi_location, registration_type,
                    legal_connect_id, rate_card_id, locations_presence, countries, services_offer,
                    registration_documents, company_profile_deck, attachments, documents, case_studies
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);
            `;

            const values = [
                companyData.company_name, companyData.company_type, companyData.company_series, companyData.date_of_registration,
                companyData.status, companyData.multi_location, companyData.registration_type, companyData.legal_connect_id,
                companyData.rate_card_id, companyData.locations_presence, companyData.countries, companyData.services_offer,
                companyData.registration_documents, companyData.company_profile_deck, companyData.attachments, companyData.documents,
                companyData.case_studies
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

    generateCompanyId: async () => {
        const query = `
            UPDATE company_registration 
            SET company_id = 'COMP' || LPAD(nextval('company_seq')::TEXT, 3, '0') 
            WHERE company_id IS NULL RETURNING *;
        `;

        const result = await dbConn.query(query);
        return result.rows;
    },

    getCompanies: async () => {
        const result = await dbConn.query("SELECT * FROM company_registration;");
        return result.rows;
    },

    getCompaniesContent: async (companyId, country) => {
        const result = await dbConn.query(`
            SELECT 
                company_id, 
                company_name, 
                company_type, 
                company_series, 
                registration_type, 
                locations_presence, 
                countries, 
                status, 
                services_offer, 
                rate_card_id,
                date_of_registration, 
                multi_location, 
                legal_connect_id
            FROM company_registration WHERE company_id = $1 and countries = $2;
        `, [companyId, country]);
        return result.rows;
    },

    getCompanyDocuments: async (companyId, country) => {
        const result = await dbConn.query(
            `SELECT registration_documents, company_profile_deck, documents, case_studies, attachments 
             FROM company_registration WHERE company_id = $1 and countries = $2`,
            [companyId, country]
        );
        return result.rows; // Return an empty object if no data found
    },

    deleteCompany: async (companyId) => {
        await dbConn.query("DELETE FROM company_registration WHERE company_id = $1", [companyId]);
    },



};


module.exports = Company;