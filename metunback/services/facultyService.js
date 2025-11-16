const Faculty = require('../models/Faculty');

class FacultyService {
  // GET all faculties with optional university filter
  async getAllFaculties(universityId) {
    const whereClause = {};
    if (universityId) {
      whereClause.university_id = universityId;
    }

    return Faculty.findAll({
      where: whereClause,
      order: [['faculty_name', 'ASC']]
    });
  }

  // GET faculty by ID
  async getFacultyById(facultyId) {
    const faculty = await Faculty.findByPk(facultyId);
    if (!faculty) throw new Error("Faculty not found");
    return faculty;
  }

  // CREATE new faculty
  async createFaculty({ faculty_name, university_id }) {
    return Faculty.create({ faculty_name, university_id });
  }

  // UPDATE faculty
  async updateFaculty(facultyId, data) {
    const faculty = await Faculty.findByPk(facultyId);
    if (!faculty) throw new Error("Faculty not found");
    await faculty.update(data);
    return faculty;
  }

  // DELETE faculty
  async deleteFaculty(facultyId) {
    const faculty = await Faculty.findByPk(facultyId);
    if (!faculty) throw new Error("Faculty not found");
    await faculty.destroy();
    return true;
  }
}

module.exports = new FacultyService();
