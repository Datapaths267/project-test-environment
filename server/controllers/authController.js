// const jwt = require("jsonwebtoken");
const jwt = require('jsonwebtoken');
const express = require("express");
const app = express();
app.use(express.json());

const { getEmployeeByUsername } = require("../models/employeeModel");

const login = async (req, res) => {
    const { username, password, country } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const user = await getEmployeeByUsername(username, country);

        if (!user || user.employee_password !== password) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const role = ["Senior Director", "Director"].includes(user.employee_designation) ? "admin" : "user";

        const token = jwt.sign({ username, country, role, employee_id: user.employee_id, designation: user.employee_designation, companyId: user.company_id, companyName: user.employee_working_company, employeeName: user.employee_name }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ role, token, employee_id: user.employee_id, designation: user.employee_designation, companyId: user.company_id, companyName: user.employee_working_company, employeeName: user.employee_name, message: `${user.employee_designation} login successful` });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { login };
