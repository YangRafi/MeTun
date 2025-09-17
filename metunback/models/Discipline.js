const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Discipline = sequelize.define("Discipline", {
    discipline_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    discipline_name: {
        type: Sequelize.STRING,
        allowNull: false
    }}, {
        tableName: "disciplines",
        timestamps: false,
    });
    
module.exports = Discipline;