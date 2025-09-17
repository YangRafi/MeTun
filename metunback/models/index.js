const sequelize = require("../util/database");

const User = require("./User");
const Profile = require("./Profile");
const University = require("./University");
const Faculty = require("./Faculty");
const Discipline = require("./Discipline");
const Group = require("./Group");
const GroupMember = require("./GroupMember");
const UserDiscipline = require("./UserDiscipline");
const UserUniversity = require("./UserUniversity");
const UserMatch = require("./UserMatch");

// Relacje

// University -> Faculty -> Discipline
University.hasMany(Faculty, { foreignKey: "university_id" });
Faculty.belongsTo(University, { foreignKey: "university_id" });

Faculty.hasMany(Discipline, { foreignKey: "faculty_id" });
Discipline.belongsTo(Faculty, { foreignKey: "faculty_id" });

// User -> Profile
User.hasOne(Profile, { foreignKey: "user_id" });
Profile.belongsTo(User, { foreignKey: "user_id" });

// User <-> Discipline (wiele do wielu)
User.belongsToMany(Discipline, { through: UserDiscipline, foreignKey: "user_id" });
Discipline.belongsToMany(User, { through: UserDiscipline, foreignKey: "discipline_id" });

// User <-> University (wiele do wielu, z extra discipline_id)
User.belongsToMany(University, { through: UserUniversity, foreignKey: "user_id" });
University.belongsToMany(User, { through: UserUniversity, foreignKey: "university_id" });

// User -> Group (jako creator)
User.hasMany(Group, { foreignKey: "creator_user_id" });
Group.belongsTo(User, { foreignKey: "creator_user_id" });

// Group <-> User (członkowie grupy)
User.belongsToMany(Group, { through: GroupMember, foreignKey: "user_id" });
Group.belongsToMany(User, { through: GroupMember, foreignKey: "group_id" });

// User <-> User (match)
User.belongsToMany(User, { as: "MatchedUsers", through: UserMatch, foreignKey: "user_id_1", otherKey: "user_id_2" });

module.exports = {
  sequelize,
  User,
  Profile,
  University,
  Faculty,
  Discipline,
  Group,
  GroupMember,
  UserDiscipline,
  UserUniversity,
  UserMatch
};
