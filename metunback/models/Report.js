const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reportedUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('open', 'resolved', 'closed'),
    defaultValue: 'open',
  },
  response: { 
    type: DataTypes.TEXT,
    allowNull: true }
}, {
  tableName: 'reports',
  timestamps: true,
});

module.exports = Report;
