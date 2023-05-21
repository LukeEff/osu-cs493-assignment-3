const { Router } = require('express')

const { Business } = require('../models/business')
const { Photo } = require('../models/photo')
const { Review } = require('../models/review')
const { ValidationError } = require("sequelize");
const { User } = require("../models/user");
const requireAuthentication = require("../lib/authenticate");
const jsonwebtoken = require("jsonwebtoken");

const router = Router()

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userId/businesses', requireAuthentication, async function (req, res) {
  const jwt = req.jwt
  const userId = req.params.userId
  if (!jwt.admin && Number(jwt.id) !== Number(userId)) {
    res.status(403).json({
      error: `User ${jwt.id} is not authorized to access user ${userId}'s businesses.`
    })
    return
  }
  const userBusinesses = await Business.findAll({ where: { ownerId: userId }})
  res.status(200).json({
    businesses: userBusinesses
  })
})

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userId/reviews', requireAuthentication, async function (req, res) {
  const userId = req.params.userId
  const jwt = req.jwt
  if (!jwt.admin && Number(jwt.id) !== Number(userId)) {
    res.status(403).json({
      error: `User ${jwt.id} is not authorized to access user ${userId}'s reviews.`
    })
    return
  }
  const userReviews = await Review.findAll({ where: { userId: userId }})
  res.status(200).json({
    reviews: userReviews
  })
})

/*
 * Route to list all of a user's photos.
 */
router.get('/:userId/photos', requireAuthentication, async function (req, res) {
  const userId = req.params.userId
  const jwt = req.jwt
  if (!jwt.admin && Number(jwt.id) !== Number(userId)) {
    res.status(403).json({
      error: `User ${jwt.id} is not authorized to access user ${userId}'s photos.`
    })
    return
  }
  const userPhotos = await Photo.findAll({ where: { userId: userId }})
  res.status(200).json({
    photos: userPhotos
  })
})

/*
  * Route to create a new user.
 */
router.post('/', async function (req, res, next) {
  if (!isAdmin(req) && req.body.admin) {
    res.status(403).json({
      error: `Only admins can create admin users.`
    })
    return
  }
  try {
    const user = await User.create(req.body)
    res.status(201).json(user)
  } catch (err) {
    if (err instanceof ValidationError) {
      const messages = err.errors.map(e => e.message)
      res.status(400).json(messages)
    } else {
      next(err)
    }
  }
})

/*
  * Route to log in a user.
 */
router.post('/login', async function (req, res, next) {
const { email, password } = req.body
  const user = await User.findOne({ where: { email: email }})
  if (user) {
    if (user.validPassword(password)) {
      // Respond with a JWT token
      const token = user.generateJWT()
      res.status(200).json({ token: token })
    } else {
      res.status(401).json(['Invalid password'])
    }
  } else {
    res.status(401).json(['Invalid email address'])
  }
});

/*
  * Route to fetch info about a specific user.
 */
router.get('/:userId', requireAuthentication, async function (req, res, next) {
  const userId = req.params.userId
  const jwt = req.jwt
  if (!jwt.admin && Number(jwt.id) !== Number(userId)) {
    res.status(403).json({
      error: `User ${jwt.id} is not authorized to access user ${userId}.`
    })
    return
  }
  const user = await User.findByPk(userId)
  if (user) {
    res.status(200).json(user)
  } else {
    next()
  }
})

function isAuthorized(req) {
  const authHeader = req.headers.authorization
  const jwt = authHeader && authHeader.split(' ')[1]
  if (!jwt) {
    return false
  }
  try {
    req.jwt = jsonwebtoken.verify(jwt, process.env.JWT_SECRET)
    return true
  }
  catch (e) {
    return false
  }
}

function isAdmin(req) {
  return isAuthorized(req) && req.jwt.admin
}

module.exports = router
