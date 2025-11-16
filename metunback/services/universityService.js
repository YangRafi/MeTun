const University = require('../models/University');
const { Op, Sequelize } = require('sequelize');

exports.getAll = async (query) => {
  if (query) {
    return University.findAll({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('university_name')),
        { [Op.like]: `${query.toLowerCase()}%` }
      ),
      limit: 10
    });
  }
  return University.findAll();
};

exports.getById = async (id) => {
  return University.findByPk(id);
};

exports.create = async (data) => {
  return University.create(data);
};

exports.update = async (id, data) => {
  const uni = await University.findByPk(id);
  if (!uni) return null;

  return uni.update(data);
};

exports.remove = async (id) => {
  const uni = await University.findByPk(id);
  if (!uni) return null;

  await uni.destroy();
  return true;
};
