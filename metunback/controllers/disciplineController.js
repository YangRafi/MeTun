const Discipline = require('../models/Discipline');

exports.getAllDisciplines = async (req, res) => {
  try {
    const disciplines = await Discipline.findAll();
    res.json(disciplines);
  } catch (err) {
    console.error("❌ Error fetching disciplines:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getDisciplinesByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.query;

    if (!facultyId) {
      return res.status(400).json({ error: "facultyId query parameter is required" });
    }

    const disciplines = await Discipline.findAll({
      where: { faculty_id: facultyId },
      attributes: ['discipline_id', 'name']
    });

    res.json(disciplines);
  } catch (err) {
    console.error("❌ Error fetching disciplines by faculty:", err);
    res.status(500).json({ error: "Server error while fetching disciplines" });
  }
};

exports.getDisciplineById = async (req, res) => {
  try {
    const discipline = await Discipline.findByPk(req.params.id);
    if (!discipline) return res.status(404).json({ error: "Discipline not found" });
    res.json(discipline);
  } catch (err) {
    console.error("❌ Error fetching discipline:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createDiscipline = async (req, res) => {
  try {
    const { name, faculty_id } = req.body;
    const discipline = await Discipline.create({ name, faculty_id });
    res.status(201).json(discipline);
  } catch (err) {
    console.error("❌ Error creating discipline:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateDiscipline = async (req, res) => {
  try {
    const { name, faculty_id } = req.body;
    const discipline = await Discipline.findByPk(req.params.id);
    if (!discipline) return res.status(404).json({ error: "Discipline not found" });

    discipline.name = name ?? discipline.name;
    discipline.faculty_id = faculty_id ?? discipline.faculty_id;

    await discipline.save();
    res.json({ message: "Discipline updated successfully", discipline });
  } catch (err) {
    console.error("❌ Error updating discipline:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteDiscipline = async (req, res) => {
  try {
    const discipline = await Discipline.findByPk(req.params.id);
    if (!discipline) return res.status(404).json({ error: "Discipline not found" });

    await discipline.destroy();
    res.json({ message: "Discipline deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting discipline:", err);
    res.status(500).json({ error: "Server error" });
  }
};
