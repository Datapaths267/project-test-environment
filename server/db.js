require('dotenv').config(); // Load environment variables

const { Client } = require('pg');

const dbConn = new Client({
    host: process.env.DB_HOST,     // Loaded from .env file
    port: process.env.DB_PORT,     // Loaded from .env file
    database: process.env.DB_NAME, // Loaded from .env file
    user: process.env.DB_USER,     // Loaded from .env file
    password: process.env.DB_PASSWORD,
   
});

module.exports = dbConn;

