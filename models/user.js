const { DataTypes } = require('sequelize');

// hash function
const bcrypt = require("bcrypt")

const sequelize = require('../lib/sequelize');

const User = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false, set(password) {
    const salt = bcrypt.genSaltSync()
    const hash = bcrypt.hashSync(password, salt)
    this.setDataValue('password', hash)
    }
  },
  admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
})

exports.User = User
exports.UserClientFields = [
  'name',
  'email',
  'password',
  'admin'
]
