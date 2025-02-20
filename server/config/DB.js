const { Client } = require('pg')
const dbConn = new Client ({
    host: 'localhost', // server name or IP address;
    port: 5432,
    database: 'recuirement',
    user: 'postgres',
    password: 'Palani20047'
})

module.exports = dbConn;