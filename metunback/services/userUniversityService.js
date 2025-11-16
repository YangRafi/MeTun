const fs = require('fs');
const path = require('path');
const { 
  UserUniversity, 
  University, 
  Faculty, 
  Discipline, 
  User, 
  Group, 
  GroupMember 
} = require('../models');
const { getNextExpiryDate } = require('../util/dateUtils');
const { addUserToDisciplineGroup } = require('../util/groupUtils');

class UserUniversityService {

  // 🔹 Pobierz wnioski użytkownika
  async getUserUniversities(userId, statusFilter) {
    const where = { user_id: userId };
    if (statusFilter) where.status = statusFilter;

    const records = await UserUniversity.findAll({
      where,
      include: [University, Faculty, Discipline]
    });

    const now = new Date();

    return Promise.all(records.map(async (r) => {
      if (r.trial && r.trial_end_date && now > r.trial_end_date) {
        r.status = 'expired';
        await r.save();
        await GroupMember.destroy({ where: { user_id: userId } });
      } 
      else if (!r.trial && r.expiry_date && now > r.expiry_date) {
        r.status = 'expired';
        await r.save();
        await GroupMember.destroy({ where: { user_id: userId } });
      }

      return {
        id: r.id,
        university_name: r.University?.university_name || '',
        faculty_name: r.Faculty?.faculty_name || '',
        discipline_name: r.Discipline?.name || '',
        faculty_id: r.faculty_id,
        discipline_id: r.discipline_id,
        status: r.status,
        join_date: r.join_date,
        expiry_date: r.expiry_date,
        trial: r.trial,
        trial_start_date: r.trial_start_date,
        trial_end_date: r.trial_end_date,
        document_url: r.document_url
      };
    }));
  }

  // 🔹 Dodaj aplikację
  async addUserUniversity(userId, data, file) {
    const { universityId, facultyId, disciplineId } = data;

    const count = await UserUniversity.count({ where: { user_id: userId } });
    if (count >= 2) throw new Error('LIMIT_REACHED');

    const documentUrl = file ? file : null;

    return UserUniversity.create({
      user_id: userId,
      university_id: universityId,
      faculty_id: facultyId,
      discipline_id: disciplineId,
      document_url: documentUrl,
      status: 'pending',
      join_date: new Date(),
      expiry_date: null,
      trial: false,
      trial_start_date: null,
      trial_end_date: null
    });
  }

  // 🔹 Aktywacja triala
  async activateTrial(user, applicationId) {
    if (user.has_trial) throw new Error('TRIAL_ALREADY_USED');

    const record = await UserUniversity.findOne({
      where: { id: applicationId, user_id: user.user_id }
    });
    if (!record) throw new Error('NOT_FOUND');
    if (record.status !== 'pending') throw new Error('INVALID_STATUS');
    if (record.trial) throw new Error('ALREADY_HAS_TRIAL');

    const start = new Date();
    const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

    record.trial = true;
    record.trial_start_date = start;
    record.trial_end_date = end;
    record.expiry_date = end;
    await record.save();

    user.has_trial = true;
    await user.save();

    await addUserToDisciplineGroup(user.user_id, record.discipline_id, true);

    return record;
  }

  // 🔹 Aktualizacja dokumentu
  async updateDocument(userId, applicationId, newUrl) {
    const record = await UserUniversity.findOne({
      where: { id: applicationId, user_id: userId }
    });
    if (!record) throw new Error('NOT_FOUND');

    if (record.document_url) {
      const oldPath = path.join(
        __dirname,
        '../uploads/documents',
        path.basename(record.document_url)
      );
      fs.unlink(oldPath, (err) => err && console.error(err));
    }

    record.document_url = newUrl;

    if (['rejected','expired'].includes(record.status)) {
      record.status = 'pending';
      record.trial = false;
      record.trial_start_date = null;
      record.trial_end_date = null;
      record.expiry_date = null;
    }

    await record.save();
    return record.document_url;
  }

  // 🔹 Usuń aplikację
  async deleteUserUniversity(userId, applicationId) {
    const record = await UserUniversity.findOne({
      where: { id: applicationId, user_id: userId }
    });
    if (!record) throw new Error('NOT_FOUND');

    if (record.document_url) {
      const filePath = path.join(
        __dirname,
        '../uploads/documents',
        path.basename(record.document_url)
      );
      fs.unlink(filePath, (err) => err && console.error(err));
    }

    await record.destroy();
    return true;
  }

  // 🔹 ADMIN: Pogrupowane statusy
  async getApplicationsByStatus() {
    const records = await UserUniversity.findAll({
      include: [
        { model: University, attributes: ['university_name','location','type'] },
        { model: Faculty, attributes: ['faculty_name'] },
        { model: Discipline, attributes: ['name'] },
        { model: User, attributes: ['user_id','name','surname','email'] }
      ],
      order: [['join_date','DESC']]
    });

    const now = new Date();
    const formatted = records.map(r => {
      let status = r.status;
      if (r.trial && r.trial_end_date && now > r.trial_end_date) status = 'expired';

      return {
        id: r.id,
        status,
        join_date: r.join_date,
        expiry_date: r.expiry_date,
        document_url: r.document_url,
        university_name: r.University?.university_name || '',
        faculty_name: r.Faculty?.faculty_name || '',
        discipline_name: r.Discipline?.name || '',
        user_name: r.User ? `${r.User.name} ${r.User.surname}` : 'Nieznany',
        user_email: r.User?.email || '',
        trial: r.trial,
        trial_start_date: r.trial_start_date,
        trial_end_date: r.trial_end_date
      };
    });

    return {
      pending: formatted.filter(r => r.status === 'pending'),
      approved: formatted.filter(r => r.status === 'approved'),
      rejected: formatted.filter(r => r.status === 'rejected'),
      expired: formatted.filter(r => r.status === 'expired'),
      trial: formatted.filter(r => r.trial)
    };
  }

  // 🔹 ADMIN: Zmień status
  async updateStatus(applicationId, status) {
    const record = await UserUniversity.findByPk(applicationId);
    if (!record) throw new Error('NOT_FOUND');

    record.status = status;
    record.expiry_date = status === 'approved' ? getNextExpiryDate() : null;
    await record.save();

    if (status === 'approved') {
      let group = await Group.findOne({ where: { discipline_id: record.discipline_id } });

      if (!group) {
        const discipline = await Discipline.findByPk(record.discipline_id);
        group = await Group.create({
          group_name: `Grupa kierunku ${discipline?.name || 'Nieznany'}`,
          discipline_id: record.discipline_id,
          created_at: new Date(),
          creator_user_id: record.user_id
        });

        await GroupMember.create({
          group_id: group.group_id,
          user_id: record.user_id,
          role: 'admin'
        });
      } 
      else {
        const isInGroup = await GroupMember.findOne({
          where: { group_id: group.group_id, user_id: record.user_id }
        });

        if (!isInGroup) {
          await GroupMember.create({
            group_id: group.group_id,
            user_id: record.user_id,
            role: 'member'
          });
        }
      }
    }

    return true;
  }

  // 🔹 ADMIN: Wszystkie
  getAllApplications() {
    return UserUniversity.findAll();
  }

  // 🔹 ADMIN: Jeden
  getApplication(id) {
    return UserUniversity.findByPk(id);
  }
}

module.exports = new UserUniversityService();
