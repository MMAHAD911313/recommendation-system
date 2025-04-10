const express = require("express");
const router = express.Router();
const { logInteraction, getUserInteractions } = require("../controllers/interactionController");

// Route to log interaction
router.post("/log", logInteraction);

// Route to get user interactions
router.get("/:userId", getUserInteractions);

module.exports = router;
