const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Group = sequelize.define('Group', {
  group_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  group_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  discipline_id: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  creator_user_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
  
}, {
  tableName: "groups",
  timestamps: false
});

module.exports = Group;
