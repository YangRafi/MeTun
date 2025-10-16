const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const UserUniversity = sequelize.define('UserUniversity', {
  user_id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  university_id: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  faculty_id: {         // nowa kolumna
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
  }
}, {
  tableName: "user_university",
  timestamps: false
});

module.exports = UserUniversity;
