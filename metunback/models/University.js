const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const University = sequelize.define('University', {
    university_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    university_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    location: {
        type: Sequelize.STRING,
        allowNull: false
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false
    }}, {
        tableName: "universities",
        timestamps: false,
    });
    
module.exports = University;