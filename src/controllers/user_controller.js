const express = require('express');
const router = express.Router();
const { validate, Joi } = require('express-validation');
const { Op, fn, where, col } = require('sequelize');

const User = require('../models/user');

/**
 * API: /user
 * Type: POST
 * 
 * Returns list of users which specific filters are applied in
 * 
 * Data: {
 *   pageIndex: number,
 *   pageSize: number
 * }
 */
 router.post('/', validate({
  body: Joi.object({
    pageSize: Joi.number().required(),
    pageIndex: Joi.number().greater(0).required(),
    searchName: Joi.string().allow(null, ""),
    filters: Joi.object().allow(null),
    sorters: Joi.object().allow(null)
  })
}, {}, {allowUnknown: true, abortEarly: false}), async function (req, res, next) {
  if (!req.auth || req.auth.role !== User.ROLE.ADMIN) {
    return res.json({
      status: false,
      errorCode: "Error_AccessDenied",
      auth: req.auth ? req.auth : "not authenticated",
    });
  }
  
  const {
    pageSize,
    pageIndex,
    searchName,
    searchEmail,
    filters,
    sorters,
  } = req.body;

  let whereQuery = {};
  if (filters) {
    if (filters.status) {
      whereQuery.status = { [Op.in]: filters.status };
    }
  }
  if (searchEmail) {
    whereQuery.email = {
      [Op.like]: `%${searchEmail}%`
    };
  }
  let sortQuery = [];
  if (sorters && (sorters.order == "ascend" || sorters.order == "descend")) {
    if (sorters.field == 'firstName') {
      sortQuery.push(['firstName', sorters.order === 'ascend' ? 'ASC' : 'DESC']);
      sortQuery.push(['lastName', sorters.order === 'ascend' ? 'ASC' : 'DESC']);
    }
    // if (sorter.field == 'createdAt') {
    //   sortQuery.push(['createdAt', sorter.order === 'ascend' ? 'ASC' : 'DESC']);
    // }
  }

  const result = await User.findAndCountAll({
    attributes: [
      'id', 'firstName', 'lastName', 'address', 'phoneNumber', 'email', 'createdAt', 'status'
    ],
    include: [
      {
        model: Family,
        attributes: [
          'id', 'name'
        ]
      }
    ],
    where: searchName ? where(
      fn("concat", col("firstName"), " ", col("lastName")),
      { [Op.like]: `%${searchName}%` }
    ) : whereQuery,
    order: sortQuery,
    offset: (pageIndex - 1) * pageSize,
    limit: +pageSize,
  });

  res.json({
    status: true,
    data: {
      list: result.rows,
      pageSize: +pageSize,
      pageIndex: +pageIndex,
      pageTotal: result.count
    }
  });
});

/**
 * API: /user/detail/:id
 * Type: GET
 * 
 * Returns user account details with given ID
 */
router.get('/detail/:id', 
validate({
  params: Joi.object({
    id: Joi.number().integer().required()
  })
}),
 async function (req, res, next) {
   // if (!req.auth || req.auth.role !== User.ROLE.ADMIN) {
     //   return res.json({
       //     status: false,
       //     errorCode: "Error_AccessDenied",
       //     auth: req.auth ? req.auth : "not authenticated",
       //   });
       // }
       
       const { id } = req.params;
       
       const user = await User.findByPk(id, {
         include: [
           
        ]
      });
      console.log("user----------------------------------------------------------------------------------" + user)

  if (user) {
    res.json({
      status: true,
      data: user
    });
  }
  else {
    res.json({
      status: false,
      errorCode: "Error_InvalidID"
    });
  }
});

/**
 * API: /user/update
 * Type: POST
 * 
 * Update user details with given ID or create a new user
 * 
 * Data: {
 *   id: 'new' | number,
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phoneNumber: string,
 *   birth: string,
 *   address: string,
 *   role: string,
 *   status: string
 * }
 * 
 * Error Codes: Error_InvalidID
 */
 router.post('/update', 
 validate({
  body: Joi.object({
    id: Joi.number().integer().allow('new').required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    birth: Joi.string().allow("", null),
    address: Joi.string().allow("", null),
    status: Joi.string().allow(User.STATUS.ACTIVE, User.STATUS.BLOCKED, User.STATUS.PENDDING).only().required(),
    role: Joi.string().allow(User.ROLE.ADMIN,User.ROLE.USER).only().required()
  })
}, {}, {}),
 async function (req, res, next) {
    
  const body = req.body;
  
  let user = null;
    
  if (body.id != 'new') {
    user = await User.findByPk(body.id);

    if (!user) {
      return res.json({
        status: false,
        errorCode: "Error_InvalidID"
      });
    }
  }
  else {
    user = new User();
  }

  user.firstName = body.firstName;
  user.lastName = body.lastName;
  user.email = body.email;
  user.phoneNumber = body.phoneNumber;
  if (body.birth) {
    user.birth = new Date(body.birth);
  }
  user.address = body.address;
  user.role = body.role;
  user.status = body.status;

  await user.save();

  res.json({
    status: true,
    data: user.id
  });
});

module.exports = router;