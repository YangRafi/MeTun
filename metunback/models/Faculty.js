const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Faculty = sequelize.define('Faculty', {
    faculty_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    faculty_name: {
        type: Sequelize.STRING,
        allowNull: false
    }}, {
        tableName: "faculties",
        timestamps: false,
});

module.exports = Faculty;