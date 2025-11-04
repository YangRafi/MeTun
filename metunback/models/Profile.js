const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Profile = sequelize.define('Profile', {
    profile_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    bio: Sequelize.TEXT,
    profile_picture: Sequelize.STRING,
    date_of_birth: Sequelize.DATEONLY,
    gender: Sequelize.ENUM('male','female','other'),
    location: Sequelize.STRING
}, {
    tableName: "profiles",
    timestamps: false
});

module.exports = Profile;
