const express = require("express");
const { configs, addConfig, deleteConfig, createColumn } = require("../models/ConFigModel");
const app = express();
app.use(express.json());
const dbConn = require("../config/DB");

const getAllConfig = async (req, res) => {
    try {
        // Step 1: Get all column names from the 'con_fig' table (excluding 'id')
        const columnQueryResult = await dbConn.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'con_fig' 
              AND table_schema = 'public' 
              AND column_name != 'id';
        `);

        const columns = columnQueryResult.rows.map(row => row.column_name);

        // Step 2: Fetch all rows from the table
        const rowsResult = await dbConn.query(`SELECT * FROM con_fig`);
        const data = rowsResult.rows;

        // Step 3: Initialize grouped object
        const grouped = {};
        columns.forEach(col => {
            grouped[col] = [];
        });

        // Step 4: Fill grouped object with {id, value} for each column
        data.forEach(row => {
            columns.forEach(col => {
                const value = row[col];
                if (value !== null && value !== undefined && value !== "") {
                    grouped[col].push({ id: row.id, value });
                }
            });
        });

        // Step 5: Deduplicate values per column
        columns.forEach(col => {
            const seen = new Set();
            grouped[col] = grouped[col].filter(({ value }) => {
                if (seen.has(value)) return false;
                seen.add(value);
                return true;
            });
        });

        console.log("Grouped Config Data:", grouped);
        res.status(200).json(grouped);
    } catch (error) {
        console.error("Error fetching config:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const addConfigOption = async (req, res) => {
    const { column, value } = req.body;
    if (!column || !value) return res.status(400).json({ message: "Column and value required" });

    try {
        const newOption = await addConfig(column, value);
        res.status(201).json({ message: "Option added", newOption });
    } catch (error) {
        console.error("Add config error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const deleteConfigOption = async (req, res) => {
    const { id } = req.params;
    const { column } = req.body;
    if (!id || !column) return res.status(400).json({ message: "ID and column required" });

    try {
        const updatedOption = await deleteConfig(id, column);
        if (!updatedOption) return res.status(404).json({ message: "Option not found" });
        res.status(200).json({ message: "Option deleted", updatedOption });
    } catch (error) {
        console.error("Delete config error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

createNewColumn = async (req, res) => {
    const { columnName } = req.body;

    if (!columnName) {
        return res.status(400).json({ message: "Column name is required" });
    }

    try {
        await createColumn(columnName.trim());
        res.status(200).json({ message: `Column '${columnName}' created successfully` });
    } catch (err) {
        console.error("Error creating column:", err.message);
        res.status(500).json({ message: err.message || "Failed to create column" });
    }
};

// In your controller
const deleteColumn = async (req, res) => {
    const { columnName } = req.body;
    try {
        await dbConn.query(`ALTER TABLE con_fig DROP COLUMN IF EXISTS "${columnName}"`);
        res.status(200).json({ message: "Column deleted successfully" });
    } catch (err) {
        console.error("Error deleting column:", err);
        res.status(500).json({ message: "Failed to delete column" });
    }
};


module.exports = { getAllConfig, addConfigOption, deleteConfigOption, createNewColumn, deleteColumn };