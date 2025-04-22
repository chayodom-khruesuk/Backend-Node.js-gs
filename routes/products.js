var express = require("express");

var router = express.Router();
const product = require("../model/model_product");

router.get("/", async function (req, res, next) {
  try {
    const products = await product.find();
    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:identifier", async function (req, res, next) {
  try {
    const identifier = req.params.identifier;
    let products;

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    if (isValidObjectId) {
      products = await product.findById(identifier);
    } else {
      products = await product.find({
        $or: [{ sku: identifier }, { productName: identifier }],
      });
    }
    if (!products || (Array.isArray(products) && products.length === 0)) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/create", async function (req, res, next) {
  try {
    const { sku, productName, productDescription, productPrice, quantity } =
      req.body;

    const existingSKU = await product.findOne({ sku });
    if (existingSKU) {
      return res.status(400).json({ message: "SKU already exists" });
    }

    const newProduct = new product({
      sku,
      productName,
      productDescription,
      productPrice,
      quantity,
    });

    await newProduct.save();
    return res.status(201).json({ message: "Product created successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/update/:id", async function (req, res, next) {
  try {
    const { sku, productName, productDescription, productPrice, quantity } =
      req.body;
    const { id } = req.params;

    const updateProduct = await product.findByIdAndUpdate(
      id,
      {
        sku,
        productName,
        productDescription,
        productPrice,
        quantity,
      },
      { new: true }
    );
    res.status(200).json(updateProduct);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/delete/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const deleteProduct = await product.findByIdAndDelete(id);
    res.status(200).json(deleteProduct);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
