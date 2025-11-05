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
  senderId: { // kto wysyła raport
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reportedUserId: { // opcjonalnie – kogo dotyczy raport
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: { // np. open, resolved, closed
    type: DataTypes.ENUM('open', 'resolved', 'closed'),
    defaultValue: 'open',
  }
}, {
  tableName: 'reports',
  timestamps: true,
});

module.exports = Report;
