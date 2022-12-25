"use strict";
const Razorpay = require("razorpay");

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { products } = ctx.request.body;
    try {
      var totalAmount = 0;
      const uploadProducts = await Promise.all(
        products.map(async (product) => {
          const item = await strapi
            .service("api::product.product")
            .findOne(product.id);
          totalAmount += Math.round(item.price * product.quantity * 100);
          return {
            id: item.id,
            quantity: product.quantity,
            price: {
              currency: "INR",
              amount: item.price,
            },
          };
        })
      );
      var options = {
        amount: totalAmount, // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11",
      };
      const details = await instance.orders.create(options);
      await strapi
        .service("api::order.order")
        .create({ data: { products: uploadProducts, paymentId: details.id } });
      return { details };
    } catch (e) {
      ctx.response.status = 500;
      return { inside: options, e };
    }
  },
}));
