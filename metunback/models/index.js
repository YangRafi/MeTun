const sequelize = require('../util/database');

const User = require('./User');
const Profile = require('./Profile');
const University = require('./University');
const Faculty = require('./Faculty');
const Discipline = require('./Discipline');
const Group = require('./Group');
const GroupMember = require('./GroupMember');
const UserUniversity = require('./UserUniversity');
const UserMatch = require('./UserMatch');
const Message = require('./Message');

// ----------------- Relacje -----------------

// University - Faculty - Discipline
University.hasMany(Faculty, { foreignKey: "university_id", onDelete: 'CASCADE' });
Faculty.belongsTo(University, { foreignKey: "university_id", onDelete: 'CASCADE' });

Faculty.hasMany(Discipline, { foreignKey: "faculty_id", onDelete: 'CASCADE' });
Discipline.belongsTo(Faculty, { foreignKey: "faculty_id", onDelete: 'CASCADE' });

// User - Profile
User.hasOne(Profile, { foreignKey: "user_id", onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: "user_id", onDelete: 'CASCADE' });

// User - UserUniversity
User.hasMany(UserUniversity, { foreignKey: "user_id", onDelete: 'CASCADE' });
UserUniversity.belongsTo(User, { foreignKey: "user_id", onDelete: 'CASCADE' });

// UserUniversity - University/Faculty/Discipline
University.hasMany(UserUniversity, { foreignKey: "university_id", onDelete: 'CASCADE' });
UserUniversity.belongsTo(University, { foreignKey: "university_id", onDelete: 'CASCADE' });

Faculty.hasMany(UserUniversity, { foreignKey: "faculty_id", onDelete: 'CASCADE' });
UserUniversity.belongsTo(Faculty, { foreignKey: "faculty_id", onDelete: 'CASCADE' });

Discipline.hasMany(UserUniversity, { foreignKey: "discipline_id", onDelete: 'CASCADE' });
UserUniversity.belongsTo(Discipline, { foreignKey: "discipline_id", onDelete: 'CASCADE' });

// User - Group
User.hasMany(Group, { foreignKey: "creator_user_id", onDelete: 'CASCADE' });
Group.belongsTo(User, { foreignKey: "creator_user_id", onDelete: 'CASCADE' });

// User - GroupMember
User.belongsToMany(Group, { through: GroupMember, foreignKey: "user_id", onDelete: 'CASCADE' });
Group.belongsToMany(User, { through: GroupMember, foreignKey: "group_id", as: 'members', onDelete: 'CASCADE' });

// UserMatch - Profile (dla frontendu)
UserMatch.belongsTo(Profile, { foreignKey: 'user_id_1', as: 'user1', onDelete: 'CASCADE' });
UserMatch.belongsTo(Profile, { foreignKey: 'user_id_2', as: 'user2', onDelete: 'CASCADE' });

// User - UserMatch
User.hasMany(UserMatch, { foreignKey: 'user_id_1', as: 'matchesAsUser1', onDelete: 'CASCADE' });
User.hasMany(UserMatch, { foreignKey: 'user_id_2', as: 'matchesAsUser2', onDelete: 'CASCADE' });

// UserMatch - Message (prywatne wiadomości)
UserMatch.hasMany(Message, { foreignKey: 'match_id', onDelete: 'CASCADE' });
Message.belongsTo(UserMatch, { foreignKey: 'match_id', onDelete: 'CASCADE' });

// Group - Message (grupowe wiadomości)
Group.hasMany(Message, { foreignKey: 'group_id', onDelete: 'CASCADE' });
Message.belongsTo(Group, { foreignKey: 'group_id', onDelete: 'CASCADE' });

module.exports = {
  sequelize,
  User,
  Profile,
  University,
  Faculty,
  Discipline,
  Group,
  GroupMember,
  UserUniversity,
  UserMatch,
  Message
};
