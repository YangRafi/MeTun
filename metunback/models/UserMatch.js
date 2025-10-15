const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const UserMatch = sequelize.define('UserMatch', {
    match_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    user_id_1: { type: Sequelize.INTEGER, allowNull: false },
    user_id_2: { type: Sequelize.INTEGER, allowNull: false },
    user_1_like: { type: Sequelize.BOOLEAN, defaultValue: false },
    user_2_like: { type: Sequelize.BOOLEAN, defaultValue: false },
    match_active: { type: Sequelize.BOOLEAN, defaultValue: false },
    match_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
}, {
    tableName: "user_match",
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['user_id_1', 'user_id_2']
        }
    ]
});

module.exports = UserMatch;
