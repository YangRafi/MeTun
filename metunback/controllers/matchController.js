const { UserMatch, Profile, UserUniversity, University, Faculty, Discipline, User } = require('../models');
const { Op } = require('sequelize');

// 🔹 Pobranie potencjalnych dopasowań (filtry + losowe + 48h)
exports.getPotentialMatches = async (req, res) => {
  const userId = req.user.userId;
  const { gender, ageMin, ageMax, universityId, facultyId, disciplineId } = req.query;

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const minutesAgo = new Date(new Date() - 60);

    let profiles = await Profile.findAll({
      where: {
        user_id: { [Op.ne]: userId },
        ...(gender ? { gender } : {}),
        ...(ageMin || ageMax
          ? {
              date_of_birth: {
                [Op.between]: [
                  ageMax ? new Date(new Date() - ageMax * 365 * 24 * 60 * 60 * 1000) : new Date('1900-01-01'),
                  ageMin ? new Date(new Date() - ageMin * 365 * 24 * 60 * 60 * 1000) : new Date()
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

    // Filtrowanie po uczelni/wydziale/kierunku
    profiles = profiles.filter(p => {
      const uni = p.User?.UserUniversities?.[0];
      if (!uni) return false;
      if (universityId && uni.university_id != universityId) return false;
      if (facultyId && uni.faculty_id != facultyId) return false;
      if (disciplineId && uni.discipline_id != disciplineId) return false;
      return true;
    });

    // Wykluczenie profili głosowanych w ciągu ostatnich 48h
    const votes = await UserMatch.findAll({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
        match_date: { [Op.gt]: minutesAgo } // <- używamy match_date
      }
    });

    const votedIds = votes.map(v => (v.user_id_1 === userId ? v.user_id_2 : v.user_id_1));
    profiles = profiles.filter(p => !votedIds.includes(p.user_id));

    // Losowa kolejność
    profiles = profiles.sort(() => Math.random() - 0.5);

    // Mapowanie danych dla frontendu
    res.json(
        profiles.map(p => {
            const uni = p.User?.UserUniversities?.[0];
            return {
            user_id: p.user_id,
            name: p.name,
            age: Math.floor((new Date() - new Date(p.date_of_birth)) / (365.25*24*60*60*1000)), // obliczamy wiek
            gender: p.gender,
            university_name: uni?.University?.university_name || '',
            faculty_name: uni?.Faculty?.faculty_name || '',
            discipline_name: uni?.Discipline?.name || '',
            profile_picture: p.profile_picture || null
            };
        })
    );

  } catch (err) {
    console.error('❌ Błąd getPotentialMatches:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// 🔹 Polubienie / odrzucenie profilu (swipe left/right)
exports.voteUser = async (req, res) => {
  const userId = req.user.userId;
  const { userId: otherUserId, like } = req.body;

  try {
    let match = await UserMatch.findOne({
      where: {
        [Op.or]: [
          { user_id_1: userId, user_id_2: otherUserId },
          { user_id_1: otherUserId, user_id_2: userId }
        ]
      }
    });

    if (!match) {
      if (userId < otherUserId) {
        match = await UserMatch.create({
          user_id_1: userId,
          user_id_2: otherUserId,
          user_1_like: like,
          user_2_like: false,
          match_active: false
        });
      } else {
        match = await UserMatch.create({
          user_id_1: otherUserId,
          user_id_2: userId,
          user_1_like: false,
          user_2_like: like,
          match_active: false
        });
      }
    } else {
      if (match.user_id_1 === userId) match.user_1_like = like;
      else match.user_2_like = like;

      match.match_active = match.user_1_like && match.user_2_like;
      match.match_date = new Date(); // aktualizacja daty ostatniej aktywności
      await match.save();
    }

    res.json({ success: true, matchActive: match.match_active });
  } catch (err) {
    console.error('❌ Błąd voteUser:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// 🔹 Like / Unlike
exports.likeUser = async (req, res) => {
  const userId = req.user.userId;
  const likedUserId = parseInt(req.params.id);

  try {
    let match = await UserMatch.findOne({
      where: {
        [Op.or]: [
          { user_id_1: userId, user_id_2: likedUserId },
          { user_id_1: likedUserId, user_id_2: userId }
        ]
      }
    });

    if (!match) {
      match = await UserMatch.create({
        user_id_1: userId,
        user_id_2: likedUserId,
        user_1_like: true,
        user_2_like: false,
        match_active: false
      });
    } else {
      if (match.user_id_1 === userId) match.user_1_like = true;
      else match.user_2_like = true;

      match.match_active = match.user_1_like && match.user_2_like;
      match.match_date = new Date();
      await match.save();
    }

    res.json(match);
  } catch (err) {
    console.error('❌ Błąd likeUser:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.unlikeUser = async (req, res) => {
  const userId = req.user.userId;
  const otherUserId = parseInt(req.params.id);

  try {
    const match = await UserMatch.findOne({
      where: {
        [Op.or]: [
          { user_id_1: userId, user_id_2: otherUserId },
          { user_id_1: otherUserId, user_id_2: userId }
        ]
      }
    });

    if (!match) return res.status(404).json({ error: 'Match not found' });

    if (match.user_id_1 === userId) match.user_1_like = false;
    else match.user_2_like = false;

    match.match_active = match.user_1_like && match.user_2_like;
    match.match_date = new Date();
    await match.save();

    res.json(match);
  } catch (err) {
    console.error('❌ Błąd unlikeUser:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
