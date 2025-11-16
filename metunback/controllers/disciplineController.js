const disciplineService = require('../services/disciplineService');

exports.getAllDisciplines = async (req, res) => {
  try {
    const disciplines = await disciplineService.getAllDisciplines();
    res.json(disciplines);
  } catch (err) {
    console.error("❌ Error fetching disciplines:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDisciplinesByFaculty = async (req, res) => {
  try {
    const disciplines = await disciplineService.getDisciplinesByFaculty(req.params.facultyId);
    res.json(disciplines);
  } catch (err) {
    console.error("❌ Error fetching disciplines by faculty:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getDisciplineById = async (req, res) => {
  try {
    const discipline = await disciplineService.getDisciplineById(req.params.id);
    res.json(discipline);
  } catch (err) {
    console.error("❌ Error fetching discipline:", err);
    res.status(404).json({ error: err.message });
  }
};

exports.createDiscipline = async (req, res) => {
  try {
    const discipline = await disciplineService.createDiscipline(req.body);
    res.status(201).json(discipline);
  } catch (err) {
    console.error("❌ Error creating discipline:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateDiscipline = async (req, res) => {
  try {
    const discipline = await disciplineService.updateDiscipline(req.params.id, req.body);
    res.json({ message: "Discipline updated successfully", discipline });
  } catch (err) {
    console.error("❌ Error updating discipline:", err);
    res.status(404).json({ error: err.message });
  }
};

exports.deleteDiscipline = async (req, res) => {
  try {
    await disciplineService.deleteDiscipline(req.params.id);
    res.json({ message: "Discipline deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting discipline:", err);
    res.status(404).json({ error: err.message });
  }
};
