const mongoose = require("mongoose");

const { Schema } = mongoose;

const orderSchema = new Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },

  userId: {
    type: String,
    ref: "User",
    required: true,
  },

  username: {
    type: String,
    required: true,
  },

  products: [
    {
      sku: {
        type: String,
        ref: "Product",
        required: true,
      },

      productName: {
        type: String,
        required: true,
      },

      productPrice: {
        type: Number,
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
      },
    },
  ],

  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },

  orderDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
