const University = require('../models/University');
const { Op, Sequelize } = require('sequelize');

// GET all universities
exports.getAllUniversities = async (req, res) => {
  try {
    const { query } = req.query;
    let universities;

    if (query) {
      universities = await University.findAll({
        where: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('university_name')),
          {
            [Op.like]: `${query.toLowerCase()}%`
          }
        ),
        limit: 10
      });
    } else {
      universities = await University.findAll();
    }

    res.json(universities);
  } catch (err) {
    console.error("❌ Błąd SQL:", err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
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
