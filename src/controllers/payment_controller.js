const express = require('express');
const router = express.Router();
const { validate, Joi } = require('express-validation');
const moment = require('moment/moment');
const Stripe = require('stripe');
const Membership = require('../models/membership');
const User = require('../models/user');
const stripe = Stripe(process.env.STRIPE_SERCRET_KEY);

router.post('/', validate({
    body: Joi.object({
        amount: Joi.number().required(),
        name: Joi.string().required(),
    })
}, {}, {allowUnknown: true, abortEarly: false}), async function (req, res, next) {
    try {
        let { amount, name } = req.body;
        console.log(amount)
        const customer = await stripe.customers.create();
        const ephemeralKey = await stripe.ephemeralKeys.create(
          {customer: customer.id},
          {apiVersion: '2020-08-27'}
        );
        amount = parseFloat(amount);

        // console.log(customer, ephemeralKey, amount)
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency : "USD",
            payment_method_types: ["card"],
            metadata: { name },
            customer: customer.id,
        });
        
        
        const clientSecret = paymentIntent.client_secret;
        console.log(clientSecret)
        
        res.json({status: "true", message: "Payment initiated", clientSecret, ephemeralKey: ephemeralKey.secret, customer: customer.id, publishableKey: ""});
    }
    catch (err) {
        console.log("here====",err);
        res.json({ status: "false", message: "Interal Server Error" });
    }
})

router.post('/stripe',  async function (req, res, next) {
    const sig = req.headers["stripe-signature"];
  let event;
  try {
    // Check if the event is sent from Stripe or a third party
    // And parse the event
    event = await Stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Handle what happens if the event is not from Stripe
    console.log(err);
    return res.json({ status: "false", message: err.message });
  }
  // Event when a payment is initiated
  if (event.type === "payment_intent.created") {
    console.log(`${event.data.object.metadata.name} initated payment!`);
  }
  // Event when a payment is succeeded
  if (event.type === "payment_intent.succeeded") {
    console.log(`${event.data.object.metadata.name} succeeded payment!`);
    // fulfilment
  }
  res.json({ status: "true", message: "Okay" });
})

router.post('/membership', async function (req, res, next) {
  const data = req.body;

  const startDate = new Date();
  const endDate = moment(startDate).add(1, "M");

  const membership = new Membership();
    membership.user_id = data.user_id;
    membership.packageType = data.packageType;
    membership.price = data.price;
    membership.quantity = data.quantity;
    membership.startAt = startDate;
    membership.endAt = endDate.toDate();
    membership.status = Membership.STATUS.ACTIVE;
  await membership.save();

  const user = await User.findByPk(data.user_id);
  console.log(user)

  if(!user) {
    return res.json({
      status: false,
        errorCode: "Error_InvalidID"
    });
  }

  user.quantity = data.quantity;
  await user.save();


  return res.json({
    status : true,
    message: "success"
  })
});

router.get('/membership/:id', async function (req, res, next) {
  const {id} = req.params;
  const membership = await Membership.findOne({
    where: {
      user_id: id
    }
  });
  console.log("membership---", membership);  
  // return
  const user = await User.findByPk(id);
  console.log("user==-0---",user);

  if(!user) {
    return res.json({
      status: false,
        errorCode: "Error_InvalidID"
    });
  }


  return res.json({
    status : true,
    message: "success",
    data: {
      membership: membership,
      user: user
    }
  })
});

module.exports = router;