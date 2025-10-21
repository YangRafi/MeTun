const UserUniversity = require('../models/UserUniversity');
const University = require('../models/University');
const Faculty = require('../models/Faculty');
const Discipline = require('../models/Discipline');

// 🔹 Pobierz aplikacje zalogowanego użytkownika
exports.getUserUniversities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const records = await UserUniversity.findAll({
      where: { user_id: userId },
      include: [University, Faculty, Discipline],
    });

    const now = new Date();
    for (const record of records) {
      const diffDays = Math.floor((now - record.applied_at) / (1000 * 60 * 60 * 24));
      if (record.status === 'pending' && diffDays > 31) {
        record.status = 'expired';
        await record.save();
      }
    }

    res.json(records.map(r => ({
      id: r.id,
      university_name: r.University.university_name,
      discipline_name: r.Discipline.name,
      faculty_name: r.Faculty.faculty_name,
      status: r.status,
      applied_at: r.applied_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania aplikacji.' });
  }
};

// 🔹 Dodaj nową aplikację użytkownika
exports.addUserUniversity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { universityId, facultyId, disciplineId } = req.body;

    const count = await UserUniversity.count({ where: { user_id: userId } });
    if (count >= 2) {
      return res.status(400).json({ error: 'Możesz mieć maksymalnie 2 aplikacje.' });
    }

    if (!req.file) return res.status(400).json({ error: 'Brak dokumentu weryfikacyjnego.' });

    const documentPath = `/uploads/${req.file.filename}`;

    const record = await UserUniversity.create({
      user_id: userId,
      university_id: universityId,
      faculty_id: facultyId,
      discipline_id: disciplineId,
      document_path: documentPath,
      status: 'pending',
      applied_at: new Date(),
    });

    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd przy dodawaniu aplikacji.' });
  }
};

// 🔹 Usuń aplikację użytkownika
exports.deleteUserUniversity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    await UserUniversity.destroy({ where: { id, user_id: userId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie udało się usunąć aplikacji.' });
  }
};

// 🔹 ADMIN: Pobierz wszystkie aplikacje studentów
exports.getAllApplications = async (req, res) => {
  try {
    const records = await UserUniversity.findAll({
      include: [University, Faculty, Discipline],
      order: [['applied_at', 'DESC']]
    });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania aplikacji (admin).' });
  }
};

// 🔹 ADMIN: Zaktualizuj status aplikacji (approved/rejected)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Niepoprawny status.' });
    }

    const record = await UserUniversity.findByPk(id);
    if (!record) return res.status(404).json({ error: 'Nie znaleziono aplikacji.' });

    record.status = status;
    await record.save();

    res.json({ message: `Status aplikacji został zmieniony na "${status}".` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd aktualizacji statusu.' });
  }
};
