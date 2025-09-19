const University = require('../models/University');

// GET all universities
exports.getAllUniversities = async (req, res) => {
  try {
    const universities = await University.findAll();
    res.json(universities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET one university by ID
exports.getUniversityById = async (req, res) => {
  const id = req.params.id;
  try {
    const uni = await University.findByPk(id);
    if (!uni) return res.status(404).json({ error: 'University not found' });
    res.json(uni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST - create a new university
exports.createUniversity = async (req, res) => {
  const { university_name, location, type } = req.body;
  try {
    const uni = await University.create({ university_name, location, type });
    res.status(201).json(uni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT - update an existing university
exports.updateUniversity = async (req, res) => {
  const id = req.params.id;
  const { university_name, location, type } = req.body;
  try {
    const uni = await University.findByPk(id);
    if (!uni) return res.status(404).json({ error: 'University not found' });

    uni.university_name = university_name;
    uni.location = location;
    uni.type = type;
    await uni.save();

    res.json(uni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE - remove a university
exports.deleteUniversity = async (req, res) => {
  const id = req.params.id;
  try {
    const uni = await University.findByPk(id);
    if (!uni) return res.status(404).json({ error: 'University not found' });

    await uni.destroy();
    res.json({ message: 'University deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
