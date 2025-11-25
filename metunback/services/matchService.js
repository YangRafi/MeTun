const { UserMatch, Profile, UserUniversity, University, Faculty, Discipline, User } = require('../models');
const { Op } = require('sequelize');
const { emitNewMatch, getIo } = require('../util/socket');

class MatchService {
  async getPotentialMatches(userId, filters) {
    const { gender, ageMin, ageMax, universityId, facultyId, disciplineId } = filters;
    const minutesAgo = new Date(new Date() - 60 * 1000); // 1 minuta

    let profiles = await Profile.findAll({
      where: {
        user_id: { [Op.ne]: userId },
        ...(gender ? { gender } : {}),
        ...(ageMin || ageMax
          ? {
              date_of_birth: {
                [Op.between]: [
                  ageMax ? new Date(new Date() - ageMax * 365.25 * 24 * 60 * 60 * 1000) : new Date('1900-01-01'),
                  ageMin ? new Date(new Date() - ageMin * 365.25 * 24 * 60 * 60 * 1000) : new Date()
                ]
              }
            }
          : {})
      },
      include: [
        {
          model: User,
          include: [
            {
              model: UserUniversity,
              include: [University, Faculty, Discipline]
            }
          ]
        }
      ]
    });

    // Filtrowanie po uczelni/wydziale/kierunku i statusie
    profiles = profiles.filter(p => {
      const uni = p.User?.UserUniversities?.[0];
      if (!uni) return false;
      if (!(uni.status === 'approved' || uni.trial)) return false;
      if (universityId && uni.university_id != universityId) return false;
      if (facultyId && uni.faculty_id != facultyId) return false;
      if (disciplineId && uni.discipline_id != disciplineId) return false;
      return true;
    });

    // Wykluczenie profili już głosowanych w ciągu ostatniej minuty
    const votes = await UserMatch.findAll({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
        match_date: { [Op.gt]: minutesAgo }
      }
    });
    const votedIds = votes.map(v => (v.user_id_1 === userId ? v.user_id_2 : v.user_id_1));
    profiles = profiles.filter(p => !votedIds.includes(p.user_id));

    // Wykluczenie aktywnych matchy
    const activeMatches = await UserMatch.findAll({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
        match_active: true
      }
    });
    const activeIds = activeMatches.map(m => (m.user_id_1 === userId ? m.user_id_2 : m.user_id_1));
    profiles = profiles.filter(p => !activeIds.includes(p.user_id));

    // Losowa kolejność
    profiles.sort(() => Math.random() - 0.5);

    // Mapowanie do frontendu
    return profiles.map(p => {
      const uni = p.User?.UserUniversities?.[0];
      return {
        user_id: p.user_id,
        name: p.name,
        age: Math.floor((new Date() - new Date(p.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)),
        gender: p.gender,
        bio: p.bio || '',
        profile_picture: p.profile_picture || null,
        images: p.images || [],
        university_name: uni?.University?.university_name || '',
        faculty_name: uni?.Faculty?.faculty_name || '',
        discipline_name: uni?.Discipline?.name || '',
        isVerified: uni?.status === 'approved' || uni,
        isTrial: uni?.trial === true
      };
    });
  }

  async voteUser(userId, otherUserId, like) {
    let match = await UserMatch.findOne({
      where: {
        [Op.or]: [
          { user_id_1: userId, user_id_2: otherUserId },
          { user_id_1: otherUserId, user_id_2: userId }
        ]
      }
    });

    if (!match) {
      const [id1, id2] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
      const [like1, like2] = userId < otherUserId ? [like, false] : [false, like];
      match = await UserMatch.create({ user_id_1: id1, user_id_2: id2, user_1_like: like1, user_2_like: like2 });
      return { matchActive: false, matchJustActivated: false };
    } else {
      if (match.user_id_1 === userId) match.user_1_like = like;
      else match.user_2_like = like;

      const wasActive = match.match_active;
      match.match_active = match.user_1_like && match.user_2_like;
      match.match_date = new Date();
      await match.save();

      const matchJustActivated = !wasActive && match.match_active;
      if (matchJustActivated) {
        emitNewMatch(match.user_id_1, match.user_id_2, {
          matchId: match.match_id,
          user1Id: match.user_id_1,
          user2Id: match.user_id_2,
          matchDate: match.match_date
        });
      }

      return { matchActive: match.match_active, matchJustActivated };
    }
  }

  async unlikeUser(userId, matchId) {
      const match = await UserMatch.findOne({
        where: { match_id: matchId }
      });
      if (!match) throw { status: 404, message: 'Match not found' };

      await match.destroy();

      const io = getIo();
      if (io) {
        // userId to osoba, która usuwa match, więc odbiorca to druga osoba w matchu
        const receiverId = match.user_id_1 === userId ? match.user_id_2 : match.user_id_1;
        io.to(receiverId).emit('match_removed', { matchId: match.match_id });
      }

      return { success: true };
    }
  }

module.exports = new MatchService();
