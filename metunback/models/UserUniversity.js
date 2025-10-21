const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const UserUniversity = sequelize.define('UserUniversity', {
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  university_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  faculty_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  discipline_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  join_date: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  status: { 
    type: Sequelize.ENUM('pending','approved','rejected', 'expired'), 
    defaultValue: 'pending' 
  },
  document_url: { 
    type: Sequelize.STRING, 
    allowNull: false 
  }
}, {
  tableName: "user_university",
  timestamps: false,
  indexes: [
    { unique: true, fields: ['user_id','university_id','faculty_id','discipline_id'] }
  ]
});

module.exports = UserUniversity;
