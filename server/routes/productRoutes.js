const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Get all products
router.get("/", productController.getAllProducts);

// Get orders for a product
router.get("/allOrderByProductId/:id", productController.allOrderByProductId);

// Create product
router.post("/create", productController.createProduct);

// Update product
router.post("/update", productController.updateProduct);

// Delete product
router.delete("/delete/:id", productController.deleteProduct);

// Get product by ID - KEEP THIS LAST
router.get("/:id", productController.getProductDetailsById);

module.exports = router;
