const userUniversityService = require('../services/userUniversityService');
const User = require('../models/User');

exports.getUserUniversities = async (req, res) => {
  try {
    const result = await userUniversityService.getUserUniversities(
      req.user.userId,
      req.query.status
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania wniosków.' });
  }
};

exports.addUserUniversity = async (req, res) => {
  try {
    const host = `${req.protocol}://${req.get('host')}`;
    const documentUrl = req.file ? `${host}/uploads/documents/${req.file.filename}` : null;

    const record = await userUniversityService.addUserUniversity(
      req.user.userId,
      req.body,
      documentUrl
    );

    res.status(201).json(record);
  } catch (err) {
    if (err.message === 'LIMIT_REACHED')
      return res.status(400).json({ error: 'Możesz mieć maksymalnie 2 aplikacje.' });

    res.status(500).json({ error: 'Błąd dodawania wniosku.' });
  }
};

exports.activateTrial = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    const record = await userUniversityService.activateTrial(user, req.params.id);
    res.json({ message: 'Trial aktywowany.', trial: record });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Brak pliku.' });

    const host = `${req.protocol}://${req.get('host')}`;
    const newUrl = `${host}/uploads/documents/${req.file.filename}`;

    const url = await userUniversityService.updateDocument(
      req.user.userId,
      req.params.id,
      newUrl
    );
    res.json({ message: 'Dokument zaktualizowany.', document_url: url });
  } catch (err) {
    res.status(500).json({ error: 'Błąd aktualizacji dokumentu.' });
  }
};

exports.deleteUserUniversity = async (req, res) => {
  try {
    await userUniversityService.deleteUserUniversity(req.user.userId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Nie udało się usunąć.' });
  }
};

exports.getApplicationsByStatus = async (req, res) => {
  try {
    const result = await userUniversityService.getApplicationsByStatus();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania.' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    await userUniversityService.updateStatus(req.params.id, req.body.status);
    res.json({ message: 'Status zaktualizowano.' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd zmiany statusu.' });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const records = await userUniversityService.getAllApplications();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania.' });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const record = await userUniversityService.getApplication(req.params.id);
    if (!record) return res.status(404).json({ error: 'Nie znaleziono.' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Błąd pobierania.' });
  }
};
