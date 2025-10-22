const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const User = sequelize.define('User', {
    user_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    surname: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    role: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user'
    },
    banned_until: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
    },
    is_banned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    has_trial: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, 
{
    tableName: "users",
    timestamps: false
});

module.exports = User;
