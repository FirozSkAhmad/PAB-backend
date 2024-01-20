const Sequelize = require('sequelize')

const RejectedUsersModel = global.DATA.CONNECTION.mysql.define("rejectedusers", {
    id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    user_name: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: true
    },
    password: {
        type: Sequelize.STRING(200),
        allowNull: false
    },
    emailId: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    role_type: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    phn_no: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
    address: {
        type: Sequelize.DataTypes.STRING(500),
        allowNull: false
    },
    photo_url: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: false
    }
}, {
    tableName: "rejectedusers"
});

module.exports = RejectedUsersModel;