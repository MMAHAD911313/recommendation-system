const express = require('express');
const movieRoutes = require('./routes/movieRoute');
const userRoute = require('./routes/userRoute');
const interactionsRoute = require('./routes/interactionsRoute');

const router = express.Router();

router.use('/movies', movieRoutes);
router.use('/users', userRoute);
router.use('/interactions', interactionsRoute);

module.exports = router;
