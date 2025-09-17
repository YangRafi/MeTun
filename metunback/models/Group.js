const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Group = sequelize.define('Group', {
    group_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    group_name: Sequelize.STRING,
    creator_user_id: Sequelize.INTEGER,
    discipline_id: Sequelize.INTEGER
}, {
    tableName: "groups",
    timestamps: false
});

module.exports = Group;
