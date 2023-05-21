const { DataTypes } = require('sequelize');

// hash function
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

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

User.prototype.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password)
}

User.prototype.generateJWT = function () {

  // expires in 1 day
  return jwt.sign({
    id: this.id,
    name: this.name,
    email: this.email,
    admin: this.admin,
  }, process.env.JWT_SECRET, { expiresIn: '1d' })
}

User.prototype.authenticateJWT = function (token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

exports.User = User
exports.UserClientFields = [
  'name',
  'email',
  'password',
  'admin'
]
