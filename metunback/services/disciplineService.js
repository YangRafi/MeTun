const Discipline = require('../models/Discipline');

class DisciplineService {
  // GET all disciplines
  async getAllDisciplines() {
    return Discipline.findAll();
  }

  // GET disciplines by faculty
  async getDisciplinesByFaculty(facultyId) {
    if (!facultyId) throw new Error("facultyId is required");

    return Discipline.findAll({
      where: { faculty_id: facultyId },
      attributes: ['discipline_id', 'name']
    });
  }

  // GET discipline by ID
  async getDisciplineById(id) {
    const discipline = await Discipline.findByPk(id);
    if (!discipline) throw new Error("Discipline not found");
    return discipline;
  }

  // CREATE new discipline
  async createDiscipline({ name, faculty_id }) {
    return Discipline.create({ name, faculty_id });
  }

  // UPDATE discipline
  async updateDiscipline(id, data) {
    const discipline = await Discipline.findByPk(id);
    if (!discipline) throw new Error("Discipline not found");

    discipline.name = data.name ?? discipline.name;
    discipline.faculty_id = data.faculty_id ?? discipline.faculty_id;

    await discipline.save();
    return discipline;
  }

  // DELETE discipline
  async deleteDiscipline(id) {
    const discipline = await Discipline.findByPk(id);
    if (!discipline) throw new Error("Discipline not found");

    await discipline.destroy();
    return true;
  }
}

module.exports = new DisciplineService();
