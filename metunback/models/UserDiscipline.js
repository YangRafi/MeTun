const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const UserDiscipline = sequelize.define('UserDiscipline', {
    user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    discipline_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    join_date: Sequelize.DATE
}, {
    tableName: "user_discipline",
    timestamps: false
});

module.exports = UserDiscipline;
