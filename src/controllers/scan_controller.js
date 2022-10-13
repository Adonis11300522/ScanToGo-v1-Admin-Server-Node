const express = require('express');
const router = express.Router();
const { validate, Joi } = require('express-validation');
const { Op, fn, where, col } = require('sequelize');

const ScanResult = require('../models/scan_result');
const User = require('../models/user');

router.post('/', validate({
    body: Joi.object({
        userId: Joi.number().required(),
        imagePath: Joi.string().required(),
        filePath: Joi.string().required()
    })
}, {}, {allowUnknown: true, abortEarly: false}), async function (req, res, next) {
    const data = req.body;
    let scan_result = new ScanResult();
    scan_result.userId = data.userId;
    scan_result.imagePath = data.imagePath;
    scan_result.filePath = data.filePath;
    scan_result.content = data.content;
    scan_result.status = ScanResult.STATUS.ACTIVE;
    await scan_result.save();

    const user = await User.findByPk(data.userId);

    if (!user) {
        return res.json({
          status: false,
          errorCode: "Error_InvalidID"
        });
    }

    if(user.quantity == 0) return res.json({
        status: false,
        message: "quantity = 0"
    })

    user.quantity = (user.quantity - 1);

    await user.save();

    console.log(user.quantity)

    return res.json({
        status: true,
        message: "Saved file"
    })
})

module.exports = router;