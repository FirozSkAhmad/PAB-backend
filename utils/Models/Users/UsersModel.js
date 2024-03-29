const Sequelize = require('sequelize')

const UsersModel = global.DATA.CONNECTION.mysql.define("users", {
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
        allowNull: false,
        unique: true 
    },
    phn_no: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false,
        unique: true 
    },
    address: {
        type: Sequelize.DataTypes.STRING(500),
        allowNull: false
    },
    photo_url: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: false
    },
    role_type: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
    },
}, {
    tableName: "users"
});

module.exports = UsersModel;