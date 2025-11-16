const facultyService = require('../services/facultyService');

exports.getAllFaculties = async (req, res) => {
  try {
    const faculties = await facultyService.getAllFaculties(req.query.universityId);
    res.json(faculties);
  } catch (err) {
    console.error("❌ Error fetching faculties:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getFacultyById = async (req, res) => {
  try {
    const faculty = await facultyService.getFacultyById(req.params.id);
    res.json(faculty);
  } catch (err) {
    console.error("❌ Error fetching faculty:", err);
    res.status(404).json({ error: err.message });
  }
};

exports.createFaculty = async (req, res) => {
  try {
    const newFaculty = await facultyService.createFaculty(req.body);
    res.status(201).json(newFaculty);
  } catch (err) {
    console.error("❌ Error creating faculty:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateFaculty = async (req, res) => {
  try {
    const faculty = await facultyService.updateFaculty(req.params.id, req.body);
    res.json(faculty);
  } catch (err) {
    console.error("❌ Error updating faculty:", err);
    res.status(404).json({ error: err.message });
  }
};

exports.deleteFaculty = async (req, res) => {
  try {
    await facultyService.deleteFaculty(req.params.id);
    res.json({ message: "Faculty deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting faculty:", err);
    res.status(404).json({ error: err.message });
  }
};