const { Router } = require('express')

const { Business } = require('../models/business')
const { Photo } = require('../models/photo')
const { Review } = require('../models/review')
const { ValidationError } = require("sequelize");
const { User } = require("../models/user");

const router = Router()

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userId/businesses', async function (req, res) {
  const userId = req.params.userId
  const userBusinesses = await Business.findAll({ where: { ownerId: userId }})
  res.status(200).json({
    businesses: userBusinesses
  })
})

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userId/reviews', async function (req, res) {
  const userId = req.params.userId
  const userReviews = await Review.findAll({ where: { userId: userId }})
  res.status(200).json({
    reviews: userReviews
  })
})

/*
 * Route to list all of a user's photos.
 */
router.get('/:userId/photos', async function (req, res) {
  const userId = req.params.userId
  const userPhotos = await Photo.findAll({ where: { userId: userId }})
  res.status(200).json({
    photos: userPhotos
  })
})

/*
  * Route to create a new user.
 */
router.post('/', async function (req, res, next) {
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

 */

module.exports = router
