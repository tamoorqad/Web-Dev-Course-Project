// this file is the MySQL connection poool

const mysql = require("mysql2");

const pool = mysql.createPool({
  host:     "localhost",
  user:     "root",
  password: "Tamoor12",
  database: "workspace_db",
  port:     3306
});

module.exports = pool.promise();