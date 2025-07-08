const express = require("express");
const multer = require('multer');
const app = express();
app.use(express.json());
const { countryAll, companies, companiesbycounty, customerList, companyCity, getCompanies, insertCompany,
    generateCompanyId, getCompaniesContent, getCompaniesFiles } = require('../models/companyModel');
const Company = require("../models/companyModel");

const getAllCountries = async (req, res) => {
    try {
        console.log('DB entered to country....');

        const countries = await countryAll(); // Fetch data using the model function

        res.status(200).json(countries);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllCompanies = async (req, res) => {
    try {
        console.log('DB entered to companies....');

        const Allcompanies = await companies(); // Fetch data using the model function

        res.status(200).json(Allcompanies);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getCompaniesbycounty = async (req, res) => {
    try {
        const county_code = req.params.country_code;
        console.log('DB entered to companies....' + county_code);

        // ✅ Pass county_code to the function
        const Allcompaniesbycounty = await companiesbycounty(county_code);

        console.log('DB entered to companies....', Allcompaniesbycounty);
        res.status(200).json(Allcompaniesbycounty);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const getCustomerList = async (req, res) => {
    try {
        console.log('DB entered to cuntomers....')

        const AllCustomersList = await customerList(); // Fetch data using the model function

        res.status(200).json(AllCustomersList);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getCompanyCity = async (req, res) => {
    try {
        console.log('DB entered to city....');

        const AllCompanyCity = await companyCity(); // Fetch data using the model function

        res.status(200).json(AllCompanyCity);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const registerCompany = async (req, res) => {
    try {
        console.log("Received request to register company");

        const formData = req.body;
        console.log("Received form data:", formData);

        const fileFields = ['registration_documents', 'company_profile_deck', 'attachments', 'documents', 'case_studies'];

        fileFields.forEach(field => {
            if (req.files && req.files[field]) {
                formData[field] = req.files[field][0].buffer; // Store file buffer
            }
        });

        // Insert into DB
        const newCompany = await insertCompany(formData);
        console.log("Company inserted successfully:", newCompany);

        await generateCompanyId();
        console.log("Company ID generated");

        res.status(201).json({ message: "Company registered successfully", data: newCompany });

    } catch (error) {
        console.error("Error registering company:", error);
        res.status(500).json({ message: "Error registering company", error: error.message });
    }
};

const getAllRegisteredCompaniesContent = async (req, res) => {
    try {
        console.log("User Data:", req.user);
        const { companyId, country, role } = req.user;
        const companies = await getCompaniesContent(companyId, country);
        res.status(200).json(companies);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ message: "Error fetching companies", error: error.message });
    }
};

const getCompanyDocuments = async (req, res) => {
    try {
        const { companyId, country } = req.user;
        if (!companyId) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const documents = await Company.getCompanyDocuments(companyId, country); // Correct function call
        res.json(documents);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error fetching company documents." });
    }
};

const deleteCompanies = async (req, res) => {
    try {
        const { companyId } = req.params;
        if (!companyId) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        await Company.deleteCompany(companyId); // Ensure correct model function call
        res.json({ message: "Company deleted successfully." });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).json({ error: "Error deleting company." });
    }
};


module.exports = {
    getAllCountries, getAllCompanies, getCompaniesbycounty, getCustomerList, getCompanyCity,
    getAllRegisteredCompaniesContent, registerCompany, deleteCompanies, getCompanyDocuments
};