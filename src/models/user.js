var { Sequelize, DataTypes, Model } = require('sequelize');
var sequelize = require('../common/sequelize');

class User extends Model {

  isAdmin() {
    return (this.role === User.ROLE.ADMIN);
  }

  isNormalUser() {
    return this.role === User.ROLE.USER;
  }

  static ROLE = {
    USER: "USER",
    ADMIN: "ADMIN",
  };

  static STATUS = {
    BLOCKED: "BLOCKED",
    PENDDING: "PENDDING",
    ACTIVE: "ACTIVE",
  };
}

User.init({
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apiToken: {
    type: DataTypes.STRING(500),
    allowNull: false,
    defaultValue: ""
  },
  verifyCode: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ""
  },
  birth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ""
  },
  photo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM([
      User.ROLE.USER,
      User.ROLE.ADMIN,
    ]),
    allowNull: false,
    defaultValue: User.ROLE.USER
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM([
      User.STATUS.BLOCKED,
      User.STATUS.PENDDING,
      User.STATUS.ACTIVE,
    ]),
    allowNull: false,
    defaultValue: User.STATUS.PENDDING
  },
}, {
  sequelize,
  tableName: "users",
  modelName: "User",
  timestamps: true,
});

module.exports = User;