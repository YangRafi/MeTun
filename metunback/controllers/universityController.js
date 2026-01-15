const universityService = require('../services/universityService');

exports.getAllUniversities = async (req, res) => {
  try {
    const { query } = req.query;
    const universities = await universityService.getAll(query);
    res.json(universities);
  } catch (err) {
    console.error("❌ Error fetching universities:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUniversityById = async (req, res) => {
  try {
    const uni = await universityService.getById(req.params.id);
    if (!uni) return res.status(404).json({ error: 'University not found' });
    res.json(uni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createUniversity = async (req, res) => {
  try {
    const uni = await universityService.create(req.body);
    res.status(201).json(uni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateUniversity = async (req, res) => {
  try {
    const uni = await universityService.update(req.params.id, req.body);
    if (!uni) return res.status(404).json({ error: 'University not found' });
    res.json(uni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteUniversity = async (req, res) => {
  try {
    const ok = await universityService.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'University not found' });
    res.json({ message: 'University deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
