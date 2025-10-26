const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const GroupMember = sequelize.define('GroupMember', {
  group_id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  user_id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  join_date: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  role: {
    type: Sequelize.ENUM('admin', 'member'),
    allowNull: false,
    defaultValue: 'member'
  }
}, {
  tableName: "group_members",
  timestamps: false
});

module.exports = GroupMember;
