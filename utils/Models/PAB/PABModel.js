const Sequelize = require('sequelize')

const PABModel = global.DATA.CONNECTION.mysql.define("pabs", {
    id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    parliment: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "Lok Sabha"
    },
    assembly: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    taluka: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    booth: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    address: {
        type: Sequelize.DataTypes.STRING(500),
        allowNull: false
    },
    president: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "NOT FILLED"
    },
    agent_1: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "NOT FILLED"
    },
    agent_2: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "NOT FILLED"
    },
    no_volunteers: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: "pabs",
    timestamps: true
});

module.exports = PABModel;