var { Sequelize, DataTypes, Model } = require('sequelize');
var sequelize = require('../common/sequelize');

class Membership extends Model {

  static PACKAGETYPE = {
    FREE: "FREE",
    PRO: "PRO",
    ULTRA: "ULTRA",
    MEGA: "MEGA",
  };

  static STATUS = {
    INACTIVE: "INACTIVE",
    PENDDING: "PENDDING",
    ACTIVE: "ACTIVE",
  };
}

Membership.init({
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  packageType: {
    type: DataTypes.ENUM([
      Membership.PACKAGETYPE.FREE,
      Membership.PACKAGETYPE.PRO,
      Membership.PACKAGETYPE.ULTRA,
      Membership.PACKAGETYPE.MEGA,
    ]),
    allowNull: false,
    defaultValue: Membership.PACKAGETYPE.FREE
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  startAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM([
      Membership.STATUS.INACTIVE,
      Membership.STATUS.PENDDING,
      Membership.STATUS.ACTIVE,
    ]),
    allowNull: false,
    defaultValue: Membership.STATUS.ACTIVE,
  },
}, {
  sequelize,
  tableName: "memberships",
  modelName: "Membership",
  timestamps: true,
});

module.exports = Membership;