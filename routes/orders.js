var express = require("express");
const mongoose = require("mongoose");

var router = express.Router();
const Order = require("../model/model_order");
const Product = require("../model/model_product");
const User = require("../model/model_user");
const tokenMiddleware = require("../middleware/token_middleware");
const Counter = require("../model/model_counter");

router.get("/", async function (req, res, next) {
  try {
    const orders = await Order.find();
    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    const orders = await Order.findById(req.params.id);

    if (!orders) {
      return res
        .status(404)
        .json({ message: `Order ${req.params.id} not found` });
    }
    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/create", tokenMiddleware, async function (req, res, next) {
  try {
    const userId = req.user.user_id;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    console.log("req.user:", userId);

    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: "Products are required and must be a non-empty array",
      });
    }

    const user = await User.findOne({ user_id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found:", user);

    const orderItems = [];
    let totalPrice = 0;
    const productUpdates = [];
    const stockErrors = [];

    for (const item of products) {
      if (!item.sku || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          error: "Each product must have a valid SKU and positive quantity",
        });
      }

      const product = await Product.findOne({ sku: item.sku });
      if (!product) {
        return res.status(404).json({
          error: `Product with SKU ${item.sku} not found`,
        });
      }

      if (product.quantity < item.quantity) {
        stockErrors.push({
          sku: item.sku,
          productName: product.productName,
          available: product.quantity,
          requested: item.quantity,
        });
        continue;
      }

      orderItems.push({
        sku: product.sku,
        productName: product.productName,
        productPrice: product.productPrice,
        quantity: item.quantity,
      });

      totalPrice += product.productPrice * item.quantity;

      productUpdates.push({
        productId: product._id,
        quantity: item.quantity,
      });
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        error: "Insufficient stock for some products",
        details: stockErrors.map(
          (err) =>
            `Not enough stock for ${err.productName}. Available: ${err.available}, Requested: ${err.requested}`
        ),
      });
    }

    const generateOrderId = async () => {
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear().toString();

      let counter = await Counter.findOne({ name: "orderId" });
      if (!counter) {
        counter = new Counter({ name: "orderId", value: 0 });
      }

      counter.value += 1;
      await counter.save();

      const sequence = counter.value.toString().padStart(4, "0");

      return `ORD${day}${month}${year}${sequence}`;
    };

    const orderId = await generateOrderId();

    const newOrder = new Order({
      orderId: orderId,
      userId: userId,
      username: user.username,
      products: orderItems,
      totalPrice: totalPrice,
    });

    const savedOrder = await newOrder.save();

    for (const update of productUpdates) {
      await Product.findByIdAndUpdate(update.productId, {
        $inc: { quantity: -update.quantity },
      });
    }

    return res.status(201).json({
      username: savedOrder.username,
      userId: savedOrder.userId,
      orderId: savedOrder.orderId,
      products: savedOrder.products.map((p) => ({
        productName: p.productName,
        quantity: p.quantity,
        price: p.productPrice,
        result: p.productPrice * p.quantity,
      })),
      totalPrice: savedOrder.totalPrice,
      orderDate: savedOrder.orderDate,
    });
  } catch (err) {
    console.error("Error creating order:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
