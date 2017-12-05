/**
 * Created by OliveTech on 10/26/2017.
 */
var config = require('../config/config')
var mysql = require('mysql');

// db connect
var con = mysql.createConnection({
    host: config.db_host,
    user: config.db_user,
    password: config.db_pass,
    database: config.db_name
});

con.connect(function(err) {
    if (err) throw err;
});

module.exports = con;