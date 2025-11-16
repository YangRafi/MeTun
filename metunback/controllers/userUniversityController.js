const fs = require('fs');
const path = require('path');
const { 
  UserUniversity, 
  University, 
  Faculty, 
  Discipline, 
  User, 
  Group, 
  GroupMember 
} = require('../models');
const { getNextExpiryDate } = require('../util/dateUtils');

// 🔹 Pobierz wnioski użytkownika
exports.getUserUniversities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const statusFilter = req.query.status; // np. ?status=approved

    const whereClause = { user_id: userId };
    if (statusFilter) whereClause.status = statusFilter;

    const records = await UserUniversity.findAll({
      where: whereClause,
      include: [University, Faculty, Discipline],
    });

    const now = new Date();

    const mapped = await Promise.all(records.map(async (r) => {
      let status = r.status;

      if (r.trial && r.trial_end_date && now > r.trial_end_date) {
        status = 'expired';
        r.status = 'expired';
        await r.save();
        await GroupMember.destroy({ where: { user_id: userId } });
      } 
      else if (!r.trial && r.expiry_date && now > r.expiry_date) {
        status = 'expired';
        r.status = 'expired';
        await r.save();
        await GroupMember.destroy({ where: { user_id: userId } });
      }

      return {
        id: r.id,
        university_name: r.University?.university_name || '',
        faculty_name: r.Faculty?.faculty_name || '',
        discipline_name: r.Discipline?.name || '',
        faculty_id: r.faculty_id,
        discipline_id: r.discipline_id,
        status,
        join_date: r.join_date,
        expiry_date: r.expiry_date,
        trial: r.trial,
        trial_start_date: r.trial_start_date,
        trial_end_date: r.trial_end_date,
        document_url: r.document_url
      };
    }));

    res.json(mapped);
  } catch (err) {
    console.error("❌ Błąd getUserUniversities:", err);
    res.status(500).json({ error: 'Błąd pobierania aplikacji.' });
  }
};


// 🔹 Dodaj wniosek
exports.addUserUniversity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { universityId, facultyId, disciplineId } = req.body;

    // 🔸 Limit aplikacji
    const count = await UserUniversity.count({ where: { user_id: userId } });
    if (count >= 2) {
      return res.status(400).json({ error: 'Możesz mieć maksymalnie 2 aplikacje.' });
    }

    const host = req.protocol + '://' + req.get('host');
    const documentUrl = req.file ? `${host}/uploads/documents/${req.file.filename}` : null;

    // 🔸 Utwórz nowy rekord UserUniversity
    const record = await UserUniversity.create({
      user_id: userId,
      university_id: universityId,
      faculty_id: facultyId,
      discipline_id: disciplineId,
      document_url: documentUrl,
      status: 'pending',
      join_date: new Date(),
      expiry_date: null,
      trial: false,
      trial_start_date: null,
      trial_end_date: null
    });

    res.status(201).json(record);
  } catch (err) {
    console.error("❌ Błąd addUserUniversity:", err);
    res.status(500).json({ error: 'Błąd przy dodawaniu aplikacji.' });
  }
};

// 🔹 Aktywacja triala
exports.activateTrial = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika.' });
    if (user.has_trial) return res.status(400).json({ error: 'Użytkownik już aktywował trial.' });

    const record = await UserUniversity.findOne({ where: { id, user_id: userId } });
    if (!record) return res.status(404).json({ error: 'Nie znaleziono wniosku.' });
    if (record.status !== 'pending') return res.status(400).json({ error: 'Trial można aktywować tylko dla wniosku w statusie pending.' });
    if (record.trial) return res.status(400).json({ error: 'Ten wniosek ma już aktywny trial.' });

    const start = new Date();
    const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

    record.trial = true;
    record.trial_start_date = start;
    record.trial_end_date = end;
    record.expiry_date = end;
    await record.save();

    user.has_trial = true;
    await user.save();

    // 🔹 Automatyczne tworzenie lub dołączanie do grupy kierunku
    const { addUserToDisciplineGroup } = require('../util/groupUtils');
    await addUserToDisciplineGroup(userId, record.discipline_id, true);

    res.json({ message: 'Trial aktywowany pomyślnie.', trial: record });
  } catch (err) {
    console.error('❌ Błąd activateTrial:', err);
    res.status(500).json({ error: 'Błąd przy aktywowaniu triala.' });
  }
};


// 🔹 Aktualizacja dokumentu
exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!req.file) return res.status(400).json({ error: 'Brak pliku do wysłania.' });

    const record = await UserUniversity.findOne({ where: { id, user_id: userId } });
    if (!record) return res.status(404).json({ error: 'Nie znaleziono wniosku.' });

    // 🔹 Usuń poprzedni plik, jeśli istnieje
    if (record.document_url) {
      const oldFilePath = path.join(__dirname, '../uploads/documents', path.basename(record.document_url));
      fs.unlink(oldFilePath, (err) => {
        if (err) console.error('❌ Błąd usuwania starego pliku:', err);
      });
    }

    const host = req.protocol + '://' + req.get('host');
    record.document_url = `${host}/uploads/documents/${req.file.filename}`;

    if (['rejected','expired'].includes(record.status)) {
      record.status = 'pending';
      record.trial = false;
      record.trial_start_date = null;
      record.trial_end_date = null;
      record.expiry_date = null;
    }

    await record.save();
    res.json({ message: 'Dokument zaktualizowany.', document_url: record.document_url });
  } catch (err) {
    console.error('❌ Błąd updateDocument:', err);
    res.status(500).json({ error: 'Błąd aktualizacji dokumentu.' });
  }
};

// 🔹 Usuń wniosek wraz z dokumentem
exports.deleteUserUniversity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    const application = await UserUniversity.findOne({ where: { id, user_id: userId } });
    if (!application) return res.status(404).json({ error: 'Nie znaleziono aplikacji.' });

    if (application.document_url) {
      const filePath = path.join(__dirname, '../uploads/documents', path.basename(application.document_url));
      fs.unlink(filePath, (err) => {
        if (err) console.error('❌ Błąd usuwania pliku:', err);
      });
    }

    await application.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Błąd deleteUserUniversity:", err);
    res.status(500).json({ error: 'Nie udało się usunąć aplikacji.' });
  }
};

// 🔹 ADMIN: Pobierz wnioski pogrupowane po statusie
exports.getApplicationsByStatus = async (req, res) => {
  try {
    const records = await UserUniversity.findAll({
      include: [
        { model: University, attributes: ['university_name', 'location', 'type'] },
        { model: Faculty, attributes: ['faculty_name'] },
        { model: Discipline, attributes: ['name'] },
        { model: User, attributes: ['user_id','name','surname','email'] }
      ],
      order: [['join_date','DESC']]
    });

    const now = new Date();
    const formatted = records.map(r => {
      let status = r.status;
      if (r.trial && r.trial_end_date && now > r.trial_end_date) status = 'expired';
      else if (!r.trial && status === 'pending' && r.expiry_date && now > r.expiry_date) status = 'expired';

      return {
        id: r.id,
        status,
        join_date: r.join_date,
        expiry_date: r.expiry_date,
        document_url: r.document_url,
        university_name: r.University?.university_name || '',
        faculty_name: r.Faculty?.faculty_name || '',
        discipline_name: r.Discipline?.name || '',
        user_name: r.User ? `${r.User.name} ${r.User.surname}` : 'Nieznany',
        user_email: r.User ? r.User.email : 'Nieznany',
        trial: r.trial,
        trial_start_date: r.trial_start_date,
        trial_end_date: r.trial_end_date
      };
    });

    res.json({
      pending: formatted.filter(r => !r.trial && r.status==='pending'),
      approved: formatted.filter(r => !r.trial && r.status==='approved'),
      rejected: formatted.filter(r => !r.trial && r.status==='rejected'),
      expired: formatted.filter(r => !r.trial && r.status==='expired'),
      trial: formatted.filter(r => r.trial)
    });
  } catch (err) {
    console.error('❌ Błąd getApplicationsByStatus:', err);
    res.status(500).json({ error: 'Błąd pobierania wniosków.' });
  }
};

// 🔹 ADMIN: Zaktualizuj status aplikacji i zarządzaj grupami
exports.updateStatus = async (req,res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending','approved','rejected','expired'].includes(status))
      return res.status(400).json({ error: 'Niepoprawny status.' });

    const record = await UserUniversity.findByPk(id);
    if (!record) return res.status(404).json({ error: 'Nie znaleziono aplikacji.' });

    record.status = status;
    record.expiry_date = (status==='approved') ? getNextExpiryDate() : null;
    await record.save();

    // 🔹 Jeśli zatwierdzony → utwórz lub dołącz do grupy
    if (status === 'approved') {
      let group = await Group.findOne({ where: { discipline_id: record.discipline_id } });

      if (!group) {
        const discipline = await Discipline.findByPk(record.discipline_id);
        group = await Group.create({
          group_name: `Grupa kierunku ${discipline?.name || 'Nieznany kierunek'}`,
          discipline_id: record.discipline_id,
          created_at: new Date(),
          creator_user_id: record.user_id
        });

        await GroupMember.create({
          group_id: group.group_id,
          user_id: record.user_id,
          role: 'admin'
        });

        console.log(`🟢 Utworzono nową grupę "${group.group_name}" (admin user_id=${record.user_id}).`);
      } else {
        const exists = await GroupMember.findOne({ 
          where: { group_id: group.group_id, user_id: record.user_id } 
        });

        if (!exists) {
          await GroupMember.create({
            group_id: group.group_id,
            user_id: record.user_id,
            role: 'member'
          });
          console.log(`🟣 Dodano user_id=${record.user_id} do grupy "${group.group_name}".`);
        }
      }
    }

    res.json({ message: `Status aplikacji został zmieniony na "${status}".` });
  } catch (err) {
    console.error("❌ Błąd updateStatus:", err);
    res.status(500).json({ error: 'Błąd aktualizacji statusu.' });
  }
};

// 🔹 ADMIN: Pobierz wszystkie wnioski
exports.getAllApplications = async (req, res) => {
  try {
    const records = await UserUniversity.findAll();
    res.json(records);
  } catch (err) {
    console.error("❌ Błąd getAllApplications:", err);
    res.status(500).json({ error: 'Błąd pobierania wniosków.' });
  }
};

// 🔹 ADMIN: Pobierz pojedynczy wniosek
exports.getApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await UserUniversity.findByPk(id);
    if (!record) return res.status(404).json({ error: 'Nie znaleziono aplikacji.' });
    res.json(record);
  } catch (err) {
    console.error("❌ Błąd getApplication:", err);
    res.status(500).json({ error: 'Błąd pobierania wniosków.' });
  }
};
