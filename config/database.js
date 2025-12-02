require('dotenv').config();
const mysql = require('mysql');
const util = require('util');

// const con = mysql.createConnection({
//   host: '68.183.92.225',
//   user: 'l_user',
//   password: 'mEd@2024m',
//   port: 3306
// });
// con.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
// });
//console.log(process.env.MYSQL_DATBASE)

const pool = mysql.createPool({
  connectionLimit: 10, // default:10
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATBASE
})


// Ping database to check for common exception errors.
pool.getConnection(async (err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.')
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.')
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.')
    }
  }
  //console.log(connection)
  if (connection) connection.release()
  return
})

pool.query = util.promisify(pool.query)
module.exports = pool
