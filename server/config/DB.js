// const { Client } = require('pg')
// const dbConn = new Client({
//     host: 'localhost', // server name or IP address;
//     port: 5432,
//     database: 'recuirement',
//     user: 'postgres',
//     password: 'Palani20047'
// })

// module.exports = dbConn;

//require('dotenv').config(); // Load environment variables

//const { Client } = require('pg');

//const dbConn = new Client({
    //host: process.env.DB_HOST,     // Loaded from .env file
   // port: process.env.DB_PORT,     // Loaded from .env file
   // database: process.env.DB_NAME, // Loaded from .env file
   // user: process.env.DB_USER,     // Loaded from .env file
   // password: process.env.DB_PASSWORD  // Loaded from .env file
//});

//module.exports = dbConn;
require('dotenv').config(); // Load environment variables

const { Pool } = require('pg'); // ✅ Change Client to Pool

const dbConn = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

module.exports = dbConn;
