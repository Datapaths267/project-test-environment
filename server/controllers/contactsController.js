const express = require('express');
const dbConn = require("../config/DB");

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const excelService = require("../services/ExcelServices");
const { contactDetails, addContacts, pocContact, getContactsImageById, uploadContacts, insertCustomerContact, deleteContact, updateContactFile, deleteContactImg } = require('../models/contactsModel');
const app = express();

app.use(express.json());

const getContactDetails = async (req, res) => {
    try {
        console.log("DB entered into in contact details");
        const { companyId } = req.user;
        const details = await contactDetails(companyId);
        res.status(200).json(details);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Error fetching companies", error: error.message });
    }
};

const getContactImageById = async (req, res) => {
    try {
        console.log("DB entered into get contact image by ID");
        const { contactId } = req.params; // Use params for contactId in the URL
        const files = await getContactsImageById(contactId);
        console.log("Files:", files);
        if (!files || (!files.contact_image)) {
            return res.status(404).json({ error: 'Contact image not found' });
        }

        let imageBuffer;
        let mimeType = "image/jpeg"; // Default MIME type

        // 🔁 Check if the image is a BLOB
        if (files.contact_image && Buffer.isBuffer(files.contact_image)) {
            console.log("🔁 Using BLOB image");
            imageBuffer = files.contact_image;

            // 📁 Check if the image is a file path
        } else if (files.contact_image && typeof files.contact_image === 'string') {
            console.log("📁 Using file path image");
            const resolvedPath = path.join(__dirname, "..", files.contact_image); // Adjust path

            if (!fs.existsSync(resolvedPath)) {
                return res.status(404).json({ error: "File not found on server" });
            }

            imageBuffer = fs.readFileSync(resolvedPath);
            mimeType = "image/jpeg"; // You can make this dynamic depending on the file extension, if necessary.

        } else {
            return res.status(400).json({ error: "Invalid contact image format" });
        }

        // Send the image in binary format
        res.status(200).json({
            contact_image: {
                data: Array.from(imageBuffer),  // Convert buffer to array for frontend
                mimetype: mimeType
            }
        });

    } catch (error) {
        console.error("Error fetching contact image:", error);
        res.status(500).json({ error: "Failed to fetch contact image" });
    }
};



const downloadTemplate = async (req, res) => {
    try {
        const workbook = await excelService.generateTemplateWorkbook();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=customer_contacts_template.xlsx"
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: "Failed to generate template" });
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
            if (!row['name']) {
                console.error("Skipping row due to missing customer_name:", row);
                continue;
            }


            const contactData = {
                contactName: row['name'] || null,
                contactCallName: row['call_name'] || null,
                contactType: row['contact_type'] || null,
                mobileNumber: row['mobile_number'] || null,
                email: row['email'] || null,
                status: row['status'] || null,
                role: row['role'] || null,
                address: row['address'] || null,
                notes: row['notes'] || null,
                company_name: row['company_name'] || null,
                customer_id: row['contact_company_id'] || null,
                company_id: row['company_id'] ? row['company_id'] : companyId
            };

            await uploadContacts(contactData);
            insertedRows++;
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


const uploadContactExcel = async (req, res) => {
    try {
        const { companyId } = req.body;
        const filePath = req.file?.path;
        if (!filePath) return res.status(400).json({ error: "Excel file is missing" });

        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

        let inserted = 0;

        for (const row of jsonData) {
            const imageField = row['contact_image'] || "";
            // const docField = row['document_name'] || "";

            // Access uploaded files via req.files (e.g., multer.fields)
            const profileImageFile = req.files?.find(f => f.originalname === imageField);
            const documentFile = req.files?.find(f => f.originalname === docField);

            const contactData = {
                contactName: row['name'],
                contactCallName: row['call_name'],
                contactType: row['contact_type'],
                mobileNumber: row['mobile_number'],
                email: row['email'],
                status: row['status'],
                role: row['role'],
                address: row['address'],
                notes: row['notes'],
                company_name: row['company_name'],
                customer_id: row['contact_company_id'],
                company_id: row['company_id'],
                profile_image: profileImageFile ? fs.readFileSync(profileImageFile.path) : null,
                // document: documentFile ? fs.readFileSync(documentFile.path) : null
            };

            await uploadContacts(contactData);
            inserted++;
        }

        res.status(200).json({ success: true, insertedRows: inserted, message: `${inserted} contacts added.` });
    } catch (error) {
        console.error("Excel Upload Error:", error);
        res.status(500).json({ success: false, message: "Internal error uploading contacts." });
    }
};

const addContact = async (req, res) => {
    try {
        const {
            contactName,
            contactCallName,
            contactType,
            mobileNumber,
            email,
            status,
            role,
            address,
            notes,
            company_name,
            customer_id,
            company_id
        } = req.body;

        let imageBuffer = null;

        if (req.file && req.file.path) {
            // 🔁 Convert file to binary (BLOB)
            const resolvedPath = path.resolve(req.file.path);
            imageBuffer = fs.readFileSync(resolvedPath);
        }

        const query = `
            INSERT INTO customer_contacts (
                contact_company_id, name, call_name, contact_type, mobile_number,
                email, status, role, address, notes, contact_image, company_id, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
        `;

        const values = [
            customer_id,
            contactName,
            contactCallName,
            contactType,
            mobileNumber,
            email,
            status,
            role,
            address,
            notes,
            imageBuffer, // 🔄 Store BLOB instead of file path
            company_id
        ];

        await dbConn.query(query, values);

        res.status(201).json({ message: "Contact added successfully as BLOB" });
    } catch (error) {
        console.error("Error adding contact (BLOB):", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



const updateContactFiles = async (req, res) => {
    try {
        const contact_id = req.params.contact_id;

        if (!contact_id) {
            return res.status(400).json({ error: "Contact ID is required" });
        }

        let contact_image = null;

        if (req.file && req.file.path) {
            contact_image = fs.readFileSync(req.file.path); // read binary content
        }

        const details = await updateContactFile({
            contact_image,
            contact_id
        });

        res.status(200).json({ message: "Contact image updated successfully", details });
    }
    catch (error) {
        console.error("Error updating contact image:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateContact = async (req, res) => {
    try {
        const {
            contact_company_id,
            contact_id,
            customer_name,
            name,
            call_name,
            contact_type,
            mobile_number,
            email,
            status,
            role,
            address,
            notes,
            company_id
        } = req.body;



        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const query = `
        UPDATE  customer_contacts SET
          contact_company_id = $1, name = $2, call_name = $3, contact_type = $4, mobile_number = $5,
          email = $6, status = $7, role = $8, address = $9, notes = $10, contact_image = $11, company_id = $12, created_at = NOW()
           WHERE contact_id = $13
        `;

        const values = [
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
            imagePath,
            company_id,
            contact_id
        ];

        await dbConn.query(query, values);

        res.status(201).json({ message: "Contact added successfully", image: imagePath });
    } catch (error) {
        console.error("Error adding contact:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getContactPOC = async (req, res) => {
    try {
        console.log("DB entered into add contacts");
        const { companyId } = req.user;
        const details = await pocContact(companyId);
        res.status(200).json(details);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Error fetching companies", error: error.message });
    }
}

// 📌 2️⃣ Download Data as Excel
const downloadContactExcel = async (req, res) => {
    try {
        const data = await getAllCustomers();
        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "contacts");

        const filePath = path.join(__dirname, "../contacts_data.xlsx");
        xlsx.writeFile(workbook, filePath);

        res.download(filePath, "contacts_data.xlsx", () => {
            fs.unlinkSync(filePath); // Delete the file after download
        });

    } catch (error) {
        res.status(500).json({ error: "Data retrieval failed!", details: error });
    }
};


const deleteContacts = async (req, res) => {
    try {
        const { contact_id } = req.params;
        if (!contact_id) {
            return res.status(400).json({ error: "customer ID is required" });
        }

        await deleteContact(contact_id);
        res.json({ message: "customer deleted successfully." });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error deleting customer." });
    }
};

const deleteContactImage = async (req, res) => {
    try {
        const { contact_id } = req.params;
        if (!contact_id) {
            return res.status(400).json({ error: "customer ID is required" });
        }

        await deleteContactImg(contact_id);
        res.status(200).json({ message: "customer deleted successfully." });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error deleting customer." });
    }
}


module.exports = {
    getContactDetails, getContactImageById, getContactPOC, addContact, deleteContacts,
    downloadContactExcel, downloadTemplate, uploadExcel, uploadContactExcel, updateContact,
    updateContactFiles, deleteContactImage
};