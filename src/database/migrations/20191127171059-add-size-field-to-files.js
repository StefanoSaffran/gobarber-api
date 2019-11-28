module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('files', 'size', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('files', 'size');
  },
};
