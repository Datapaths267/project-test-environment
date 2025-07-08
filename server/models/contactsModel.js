const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const contacts = {
    contactDetails: async (companyId) => {
        const result = await dbConn.query(`
            SELECT 
                cd.customer_name,  -- Fetch customer name instead of contact_company_id
                cc.name,  
                cc.call_name, 
                cc.contact_type,
                cc.mobile_number,
                cc.email,
                cc.status,
                cc.role,
                cc.address,
                cc.notes,
                cc.company_id,
                cc.contact_id,
                cc.contact_company_id
            FROM customer_contacts cc
            JOIN customers_detail cd ON cc.contact_company_id = cd.customer_id
            WHERE cc.company_id = $1
            ORDER BY cc.contact_id ASC;
        `, [companyId]);

        return result.rows;
    },

    getContactsImageById: async (contactId) => {
        const result = await dbConn.query('SELECT contact_image FROM customer_contacts WHERE contact_id = $1', [contactId]);
        return result.rows[0];
    },

    insertCustomerContact: async (data) => {
        const {
            contact_company_id,
            name,
            call_name,
            contact_type,
            mobile_number,
            email,
            status,
            role,
            address,
            notes,
            created_at
        } = data;

        const result = await dbConn.query(
            `INSERT INTO customer_contacts (
            contact_company_id, name, call_name, contact_type, mobile_number,
            email, status, role, address, notes, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [contact_company_id, name, call_name, contact_type, mobile_number,
                email, status, role, address, notes, created_at || new Date()]
        );

        return result;
    },

    updateContactFile: async (candidateData) => {
        const {
            contact_image, contact_id
        } = candidateData;

        const query = `
            UPDATE customer_contacts SET 
                contact_image =$1 WHERE contact_id = $2
        `;

        const values = [
            contact_image, contact_id
        ];

        await dbConn.query(query, values);
    },

    uploadContacts: async (ContactData) => {
        try {
            const query = `
                   INSERT INTO customer_contacts 
                    (name, call_name, contact_type, mobile_number, email, status, role, address, notes, company_id, contact_company_id)  
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
                    RETURNING *;
                `;

            const values = [
                ContactData.contactName,
                ContactData.contactCallName,
                ContactData.contactType,
                ContactData.mobileNumber,
                ContactData.email,
                ContactData.status,
                ContactData.role,
                ContactData.address,
                ContactData.notes,
                ContactData.company_id,
                ContactData.customer_id,
            ];

            // ContactData.console.log("Executing query:", query);
            console.log("Values:", values);

            const result = await dbConn.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error("Database insertion error:", error);
            throw new Error("Database insertion failed: " + error.message);
        }
    },

    addContacts: async (contactFormData) => {
        try {
            const query = `
                INSERT INTO customer_contacts 
                    (name, call_name, contact_type, mobile_number, email, status, role, address, notes, company_id,contact_company_id)  
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
                RETURNING *;
            `;

            const values = [
                contactFormData.contactName,
                contactFormData.contactCallName,
                contactFormData.contactType,
                contactFormData.mobileNumber,
                contactFormData.email,
                contactFormData.status,
                contactFormData.role,
                contactFormData.address,
                contactFormData.notes,
                contactFormData.company_id,
                contactFormData.customer_id  // ⚠️ Check spelling: Should be "company_id"
            ];

            const result = await dbConn.query(query, values);
            return result.rows[0]; // Returning the inserted contact
        } catch (error) {
            console.error("Database Error in addContacts:", error);
            throw new Error("Failed to add contact");
        }
    },

    pocContact: async (companyId) => {
        const result = await dbConn.query(`
            SELECT 
                contact_id, name, call_name
            FROM customer_contacts 
            WHERE company_id = $1;
        `, [companyId]);
        return result.rows;
    },

    deleteContact: async (contact_id) => {
        await dbConn.query("DELETE FROM customer_contacts WHERE contact_id = $1", [contact_id]);
    },

    deleteContactImg: async (contact_id) => {
        await dbConn.query("UPDATE customer_contacts SET contact_image = NULL WHERE contact_id = $1", [contact_id]);
    },
}

module.exports = contacts;