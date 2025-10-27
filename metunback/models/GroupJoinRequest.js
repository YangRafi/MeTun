const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const GroupJoinRequest = sequelize.define('GroupJoinRequest', {
  request_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  group_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'group_join_requests',
  timestamps: false
});

module.exports = GroupJoinRequest;
