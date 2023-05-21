const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { Business, BusinessClientFields } = require('../models/business')
const { Photo } = require('../models/photo')
const { Review } = require('../models/review')
const requireAuthentication = require('../lib/authenticate')

const router = Router()

/*
 * Route to return a list of businesses.
 */
router.get('/', async function (req, res) {
  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
  let page = parseInt(req.query.page) || 1
  page = page < 1 ? 1 : page
  const numPerPage = 10
  const offset = (page - 1) * numPerPage

  const result = await Business.findAndCountAll({
    limit: numPerPage,
    offset: offset
  })

  /*
   * Generate HATEOAS links for surrounding pages.
   */
  const lastPage = Math.ceil(result.count / numPerPage)
  const links = {}
  if (page < lastPage) {
    links.nextPage = `/businesses?page=${page + 1}`
    links.lastPage = `/businesses?page=${lastPage}`
  }
  if (page > 1) {
    links.prevPage = `/businesses?page=${page - 1}`
    links.firstPage = '/businesses?page=1'
  }

  /*
   * Construct and send response.
   */
  res.status(200).json({
    businesses: result.rows,
    pageNumber: page,
    totalPages: lastPage,
    pageSize: numPerPage,
    totalCount: result.count,
    links: links
  })
})

/*
 * Route to create a new business.
 */
router.post('/', requireAuthentication, async function (req, res, next) {
  // OwnerId must be the same as the authenticated user or the authenticated user must be an admin
  if (req.jwt.admin || Number(req.jwt.id) === Number(req.body.ownerId)) {
    try {
      const business = await Business.create(req.body, BusinessClientFields)
      res.status(201).send({id: business.id})
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({error: e.message})
      } else {
        throw e
      }
    }
  } else {
    res.status(403).send({
      error: `User ${req.jwt.id} is not authorized to create a business owned by ${req.body.ownerId}.`
    })
  }
})

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessId', async function (req, res, next) {
  const businessId = req.params.businessId
  const business = await Business.findByPk(businessId, {
    include: [ Photo, Review ]
  })
  if (business) {
    res.status(200).send(business)
  } else {
    next()
  }
})

/*
 * Route to update data for a business.
 */
router.patch('/:businessId', requireAuthentication, ownsBusiness, async function (req, res, next) {
  const businessId = req.params.businessId
  const result = await Business.update(req.body, {
    where: { id: businessId },
    fields: BusinessClientFields
  })
  if (result[0] > 0) {
    res.status(204).send()
  } else {
    next()
  }
})

/*
 * Route to delete a business.
 */
router.delete('/:businessId', requireAuthentication, ownsBusiness, async function (req, res, next) {
  const businessId = req.params.businessId
  const result = await Business.destroy({ where: { id: businessId }})
  if (result > 0) {
    res.status(204).send()
  } else {
    next()
  }
})

function ownsBusiness (req, res, next) {
  // The business corresponding to the businessId must be owned by the authenticated user or the authenticated user must be an admin
  const businessId = req.params.businessId
  if (!businessId) {
    res.status(400).send({
      error: 'Business ID is required.'
    })
    return
  }
  if (req.jwt.admin) {
    next()
  }
  Business.findByPk(businessId).then(business => {
    if (business.ownerId === req.jwt.id || req.jwt.admin) {
      next()
    } else {
      res.status(403).send({
        error: `User ${req.jwt.id} is not authorized to modify the business ${businessId}.`
      })
    }
  })
}

module.exports = router
