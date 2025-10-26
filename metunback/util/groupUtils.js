const { Group, GroupMember, Discipline } = require('../models');

/**
 * Tworzy lub pobiera grupę dla danego kierunku (discipline_id)
 * i dodaje użytkownika z odpowiednią rolą.
 *
 * @param {number} userId - ID użytkownika
 * @param {number} disciplineId - ID kierunku (discipline)
 * @param {boolean} isAdmin - czy użytkownik ma być adminem
 */
async function addUserToDisciplineGroup(userId, disciplineId, isAdmin = false) {
  try {
    let group = await Group.findOne({ where: { discipline_id: disciplineId } });

    if (!group) {
      const discipline = await Discipline.findByPk(disciplineId);
      group = await Group.create({
        group_name: `Grupa kierunku ${discipline?.name || 'Nieznany kierunek'}`,
        discipline_id: disciplineId,
        created_at: new Date(),
      });

      await GroupMember.create({
        group_id: group.group_id,
        user_id: userId,
        role: 'admin'
      });

      console.log(`🟢 Utworzono nową grupę "${group.group_name}" (admin user_id=${userId}).`);
      return group;
    }

    const exists = await GroupMember.findOne({
      where: { group_id: group.group_id, user_id: userId }
    });

    if (!exists) {
      await GroupMember.create({
        group_id: group.group_id,
        user_id: userId,
        role: isAdmin ? 'admin' : 'member'
      });
      console.log(`🟣 Dodano user_id=${userId} do grupy "${group.group_name}" jako ${isAdmin ? 'admin' : 'member'}.`);
    }

    return group;
  } catch (err) {
    console.error('❌ Błąd w addUserToDisciplineGroup:', err);
  }
}

/**
 * Usuwa użytkownika z wszystkich grup (np. po wygaśnięciu triala)
 */
async function removeUserFromGroups(userId) {
  const { GroupMember } = require('../models');
  try {
    await GroupMember.destroy({ where: { user_id: userId } });
    console.log(`🔴 Usunięto user_id=${userId} z wszystkich grup.`);
  } catch (err) {
    console.error('❌ Błąd w removeUserFromGroups:', err);
  }
}

module.exports = {
  addUserToDisciplineGroup,
  removeUserFromGroups
};
