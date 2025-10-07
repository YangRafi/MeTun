const Sequelize = require('sequelize');
require('dotenv').config({ path: __dirname + '/../secret.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
  }
);

module.exports = sequelize;


// const Sequelize = require('sequelize');

// const sequelize = new Sequelize('MeTun', 'root', 'ebeebe', {
//     dialect: 'mysql',
//     host: 'localhost',
//     port: '3307'
// });

// module.exports = sequelize;