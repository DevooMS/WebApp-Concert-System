'use strict';

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { expressjwt: jwt } = require('express-jwt');

const jwtSecret = '47e5edcecab2e23c8545f66fca6f3aec8796aee5d830567cc362bb7fb31adafc';

// Initialize Express
const app = express();
const port = 3002;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json()); // Automatically parse JSON

// JWT Middleware
app.use(jwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
}));

// Error Handling Middleware
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ errors: [{ 'param': 'Server', 'msg': 'Authorization error', 'path': err.code }] });
  } else {
    next();
  }
});

// Function to calculate a random number within a range
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Extract and sum seat numbers from reservations
function sumSeatNumbers(reservations, isLoyal) {
  let sum = reservations.reduce((acc, seatNumber) => acc + seatNumber, 0);
  return isLoyal ? sum : sum / 3;
}

// Calculate discount based on the sum of seat numbers
function calculateDiscount(seatSum) {
  let randomAddition = getRandomNumber(5, 20);
  let discount = Math.round(seatSum + randomAddition);
  discount = Math.max(5, Math.min(discount, 50)); // Constrain between 5 and 50
  return discount;
}

// API Endpoint to get estimation and calculate discount
app.get('/api/get-estimation', (req, res) => {
  // Check if the necessary auth data exists and meets the expected format
  //console.log('Received request to calculate discount:', req.auth);
  if (!req.auth || !Array.isArray(req.auth.reservations) || req.auth.reservations.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing reservations data.' });
  }
  if (typeof req.auth.role !== 'number' || (req.auth.role !== 0 && req.auth.role !== 1)) {
    return res.status(400).json({ error: 'Invalid Role.' });
  }

  const { reservations, role } = req.auth;
  const isLoyal = role === 1; // Assuming role 1 is for loyal users
  // xconsole.log(`Calculating discount for ${isLoyal ? 'loyal' : 'regular'} user with reservations:`, reservations);
  try {
    const seatSum = sumSeatNumbers(reservations, isLoyal);
    const discount = calculateDiscount(seatSum);
    //console.log(`Calculated discount: ${discount}%`);
    res.json(`${discount}%`);
  } catch (error) {
    console.error('Failed to calculate discount:', error);
    res.status(500).json({ error: 'Server error while calculating discount.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
