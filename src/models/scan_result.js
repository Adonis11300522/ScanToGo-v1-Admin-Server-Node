var { Sequelize, DataTypes, Model } = require('sequelize');
var sequelize = require('../common/sequelize');

class ScanResult extends Model {

  static STATUS = {
    INACTIVE: "INACTIVE",
    ACTIVE: "ACTIVE",
  };
}

ScanResult.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM([
      ScanResult.STATUS.INACTIVE,
      ScanResult.STATUS.ACTIVE,
    ]),
    allowNull: false,
    defaultValue: ScanResult.STATUS.ACTIVE
  },
}, {
  sequelize,
  tableName: "scan_results",
  modelName: "ScanResult",
  timestamps: true,
});

module.exports = ScanResult;