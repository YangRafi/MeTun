// models/Message.js
const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Message = sequelize.define('Message', {
  message_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  match_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  sender_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  timestamp: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'messages',
  timestamps: false
});

module.exports = Message;
