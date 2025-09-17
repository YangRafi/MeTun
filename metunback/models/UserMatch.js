const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const UserMatch = sequelize.define('UserMatch', {
    match_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    user_id_1: Sequelize.INTEGER,
    user_id_2: Sequelize.INTEGER,
    match_date: Sequelize.DATE,
    is_active: Sequelize.BOOLEAN
}, {
    tableName: "user_match",
    timestamps: false,
});

module.exports = UserMatch;
