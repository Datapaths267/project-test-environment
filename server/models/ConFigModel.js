const dbConn = require("../config/DB");
const express = require("express");
const app = express();
app.use(express.json());

const Company = {
    configs: async () => {
        const query = "Select * from con_fig ";
        const result = await dbConn.query(query);
        return result.rows;
    },

    addConfig: async (column, value) => {
        const query = `
        INSERT INTO con_fig (${column})
        VALUES ($1)
        RETURNING *;
    `;
        const { rows } = await dbConn.query(query, [value]);
        return rows[0];
    },


    deleteConfig: async (id, column) => {
        const query = `
        UPDATE con_fig
        SET ${column} = NULL
        WHERE id = $1
        RETURNING *;
    `;
        const { rows } = await dbConn.query(query, [id]);
        return rows[0];
    },


    createColumn: async (columnName) => {
        const isValidColumnName = (name) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

        if (!isValidColumnName(columnName)) {
            throw new Error("Invalid column name");
        }

        const query = `ALTER TABLE con_fig ADD COLUMN "${columnName}" VARCHAR(255) DEFAULT NULL;`;
        await dbConn.query(query);
    }


};

module.exports = Company;