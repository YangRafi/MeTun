const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const University = sequelize.define('University', {
    university_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    university_name: Sequelize.STRING,
    location: Sequelize.STRING,
    type: Sequelize.STRING
}, {
    tableName: "universities",
    timestamps: false
});

module.exports = University;
