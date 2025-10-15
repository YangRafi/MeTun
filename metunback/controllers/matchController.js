const { UserMatch, Profile, UserUniversity, University, Faculty, Discipline } = require('../models');
const { Op } = require('sequelize');

// 🔹 Polubienie profilu
exports.likeUser = async (req, res) => {
  const userId = req.user.user_id; // zalogowany użytkownik
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
      // Tworzymy nowy wpis, jeśli nie ma jeszcze żadnego
      match = await UserMatch.create({
        user_id_1: userId,
        user_id_2: likedUserId,
        user_1_like: true,
        user_2_like: false,
        match_active: false
      });
    } else {
      // Aktualizujemy istniejący wpis
      if (match.user_id_1 === userId) match.user_1_like = true;
      else match.user_2_like = true;

      match.match_active = match.user_1_like && match.user_2_like;
      await match.save();
    }

    res.json(match);
  } catch (err) {
    console.error('❌ Błąd likeUser:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// 🔹 Cofnięcie polubienia / unlike
exports.unlikeUser = async (req, res) => {
  const userId = req.user.user_id;
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
    await match.save();

    res.json(match);
  } catch (err) {
    console.error('❌ Błąd unlikeUser:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// 🔹 Pobranie dopasowań aktywnych dla zalogowanego użytkownika
exports.getMatches = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const matches = await UserMatch.findAll({
      where: {
        match_active: true,
        [Op.or]: [
          { user_id_1: userId },
          { user_id_2: userId }
        ]
      },
      include: [
        {
          model: Profile,
          as: 'user1',
          include: [
            {
              model: UserUniversity,
              include: [
                { model: University },
                { model: Faculty },
                { model: Discipline }
              ]
            }
          ]
        },
        {
          model: Profile,
          as: 'user2',
          include: [
            {
              model: UserUniversity,
              include: [
                { model: University },
                { model: Faculty },
                { model: Discipline }
              ]
            }
          ]
        }
      ]
    });

    // Mapujemy, żeby frontend dostał profile drugiej osoby w parze
    const results = matches.map(m => {
      const otherProfile = m.user_id_1 === userId ? m.user2 : m.user1;
      return {
        id: m.match_id,
        name: otherProfile.name,
        age: Math.floor((new Date() - new Date(otherProfile.date_of_birth)) / (1000 * 60 * 60 * 24 * 365)),
        university_name: otherProfile.UserUniversities?.[0]?.University?.university_name || '',
        faculty_name: otherProfile.UserUniversities?.[0]?.Faculty?.faculty_name || '',
        discipline_name: otherProfile.UserUniversities?.[0]?.Discipline?.name || ''
      };
    });

    res.json(results);
  } catch (err) {
    console.error('❌ Błąd getMatches:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
