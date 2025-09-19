const Sequelize = require('sequelize');

const sequelize = new Sequelize('MeTun', 'root', 'ebeebe', {
    dialect: 'mysql',
    host: 'localhost',
    port: '3307'
});

module.exports = sequelize;


// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../key.env') });

// const { Sequelize } = require('sequelize');

// // Wypisanie wartości dla debugowania
// console.log('DB_NAME:', process.env.DB_NAME);
// console.log('DB_USER:', process.env.DB_USER);
// console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
// console.log('DB_HOST:', process.env.DB_HOST);
// console.log('DB_PORT:', process.env.DB_PORT);

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     dialect: 'mariadb',        // używamy MariaDB zamiast mysql
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT || 3306, // domyślny port 3306 jeśli nie podano w .env
//     logging: false,             // wyłącza logi SQL, możesz ustawić true dla debugowania
//   }
// );

// module.exports = sequelize;