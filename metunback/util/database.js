const Sequelize = require('sequelize');

const sequelize = new Sequelize('MeTun', 'root', 'ebeebe', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;


// require('dotenv').config({ path: '../key.env' });

// const Sequelize = require('sequelize');

// const sequelize = new Sequelize('MeTun', process.env.DB_USER,process.env.DB_PASSWORD, {
//     dialect: 'mysql',
//     host: process.env.DB_HOST,
// });

// module.exports = sequelize;