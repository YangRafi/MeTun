const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Message = sequelize.define('Message', {
  message_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  sender_id: { type: Sequelize.INTEGER, allowNull: false },
  content: { type: Sequelize.TEXT, allowNull: false },
  timestamp: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  match_id: { type: Sequelize.INTEGER, allowNull: true }, // prywatny match
  group_id: { type: Sequelize.INTEGER, allowNull: true }  // czat grupowy
}, {
  tableName: 'messages',
  timestamps: false
});

module.exports = Message;
