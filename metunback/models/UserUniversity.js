const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const UserUniversity = sequelize.define('UserUniversity', {
    user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    university_id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    discipline_id: Sequelize.INTEGER
}, {
    tableName: "user_university",
    timestamps: false
});

module.exports = UserUniversity;
