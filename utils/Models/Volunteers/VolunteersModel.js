const Sequelize = require('sequelize')

const VolunteersModel = global.DATA.CONNECTION.mysql.define("volunteers", {
    id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    surveyor_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
    },
    parliment: {
        type: Sequelize.STRING(200),
        allowNull: false
    },
    assembly: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    booth: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    booth_address: {
        type: Sequelize.DataTypes.STRING(500),
        allowNull: false
    },
    booth_id: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    volunteer_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
    },
    phn_no: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    emailId: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    gender: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    age: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    caste: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    occupation: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    house_no: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    volunteer_address: {
        type: Sequelize.DataTypes.STRING(500),
        allowNull: false
    },
    designation: {
        type: Sequelize.STRING(200),
        allowNull: false
    },
    file_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    photo_url: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: false
    },
}, {
    tableName: "volunteers"
});

module.exports = VolunteersModel;