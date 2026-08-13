const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Get all orders
router.get("/", orderController.getAllOrders);

// Get products belonging to an order
router.get("/getProductsByOrder/:id", orderController.getProductsByOrder);

// Update order
router.put("/update/:id", orderController.updateOrder);

// Get customer's past orders
router.get("/myPastOrders/:id", orderController.getPastOrdersByCustomerID);

// Get order by ID - KEEP THIS LAST
router.get("/:id", orderController.getOrderById);

module.exports = router;
