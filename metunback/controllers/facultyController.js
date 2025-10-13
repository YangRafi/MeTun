const Faculty = require('../models/Faculty');

// GET all faculties
exports.getAllFaculties = async (req, res) => {
  try {
    const { universityId } = req.query;

    const whereClause = {};
    if (universityId) {
      whereClause.university_id = universityId;
    }

    const faculties = await Faculty.findAll({
      where: whereClause,
      order: [['faculty_name', 'ASC']]
    });

    res.json(faculties);
  } catch (err) {
    console.error("❌ Error fetching faculties:", err);
    res.status(500).json({
      error: "Server error while fetching faculties",
      details: err.message
    });
  }
};

// GET faculty by ID
exports.getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    res.json(faculty);
  } catch (err) {
    console.error("❌ Error fetching faculty:", err);
    res.status(500).json({ error: "Server error while fetching faculty" });
  }
};

// CREATE new faculty
exports.createFaculty = async (req, res) => {
  try {
    const { faculty_name, university_id } = req.body;
    const newFaculty = await Faculty.create({ faculty_name, university_id });
    res.status(201).json(newFaculty);
  } catch (err) {
    console.error("❌ Error creating faculty:", err);
    res.status(500).json({ error: "Server error while creating faculty" });
  }
};

// UPDATE faculty
exports.updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    const { faculty_name, university_id } = req.body;
    await faculty.update({ faculty_name, university_id });
    res.json(faculty);
  } catch (err) {
    console.error("❌ Error updating faculty:", err);
    res.status(500).json({ error: "Server error while updating faculty" });
  }
};

// DELETE faculty
exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    await faculty.destroy();
    res.json({ message: "Faculty deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting faculty:", err);
    res.status(500).json({ error: "Server error while deleting faculty" });
  }
};
