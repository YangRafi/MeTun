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
University.hasMany(Faculty, { foreignKey: "university_id" });
Faculty.belongsTo(University, { foreignKey: "university_id" });

Faculty.hasMany(Discipline, { foreignKey: "faculty_id" });
Discipline.belongsTo(Faculty, { foreignKey: "faculty_id" });

// User - Profile
User.hasOne(Profile, { foreignKey: "user_id" });
Profile.belongsTo(User, { foreignKey: "user_id" });

// User - UserUniversity
User.hasMany(UserUniversity, { foreignKey: "user_id" });
UserUniversity.belongsTo(User, { foreignKey: "user_id" });

// UserUniversity - University/Faculty/Discipline
University.hasMany(UserUniversity, { foreignKey: "university_id" });
UserUniversity.belongsTo(University, { foreignKey: "university_id" });

Faculty.hasMany(UserUniversity, { foreignKey: "faculty_id" });
UserUniversity.belongsTo(Faculty, { foreignKey: "faculty_id" });

Discipline.hasMany(UserUniversity, { foreignKey: "discipline_id" });
UserUniversity.belongsTo(Discipline, { foreignKey: "discipline_id" });

// User - Group
User.hasMany(Group, { foreignKey: "creator_user_id" });
Group.belongsTo(User, { foreignKey: "creator_user_id" });

// User - GroupMember
User.belongsToMany(Group, { through: GroupMember, foreignKey: "user_id" });
Group.belongsToMany(User, { through: GroupMember, foreignKey: "group_id" });

// UserMatch - Profile (dla frontendu)
UserMatch.belongsTo(Profile, { foreignKey: 'user_id_1', as: 'user1' });
UserMatch.belongsTo(Profile, { foreignKey: 'user_id_2', as: 'user2' });

// User - UserMatch
User.hasMany(UserMatch, { foreignKey: 'user_id_1', as: 'matchesAsUser1' });
User.hasMany(UserMatch, { foreignKey: 'user_id_2', as: 'matchesAsUser2' });

// UserMatch - Message
UserMatch.hasMany(Message, { foreignKey: 'match_id' });
Message.belongsTo(UserMatch, { foreignKey: 'match_id' });

// ----------------- Exporty -----------------
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
