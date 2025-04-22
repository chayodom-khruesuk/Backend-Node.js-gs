const mongoose = require("mongoose");

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    sku: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return /^[A-Z]{3}\d{3,}$/.test(value);
        },
        message: "SKU must be in the format XXX999",
      },
    },

    productName: {
      type: String,
      required: true,
    },

    productDescription: {
      type: String,
    },

    productPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
