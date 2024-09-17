'use strict';

// imports
const express = require('express'); // web server
const morgan = require('morgan');   // logging middleware
const { check, validationResult } = require('express-validator'); // validation library
const cors = require('cors'); // CORS middleware
const contentDao = require('./src/daos/contentDao'); // DAO for content-related database operations
const userDao = require('./src/daos/access'); // DAO for user-related database operations
const jsonwebtoken = require('jsonwebtoken'); // JWT for token-based authentication

// JWT configuration
const jwtSecret = '47e5edcecab2e23c8545f66fca6f3aec8796aee5d830567cc362bb7fb31adafc';
const expireTime = 35; // token expiration time in seconds

/*** Initialize express and set up middlewares ***/
const app = express();
app.use(morgan('dev')); // logging middleware
app.use(express.json()); // middleware to parse JSON request bodies

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173', // allowed origin
  credentials: true, // allow credentials (cookies, authorization headers, etc.)
};
app.use(cors(corsOptions)); // applying CORS middleware

/*** Passport ***/

// Authentication-related imports
const passport = require('passport'); // authentication middleware
const LocalStrategy = require('passport-local'); // authentication strategy (username and password)

// Set up authentication strategy to find a user with matching credentials in the DB
passport.use(new LocalStrategy(async function(username, password, callback) {
  const user = await userDao.getLogin(username, password); // fetch user by username and password
  if (!user)
    return callback(null, false, 'Incorrect username or password'); // return error if no user found

  return callback(null, user); // user info stored in the session
}));

// Serialize user object into the session
passport.serializeUser(function(user, callback) {
  callback(null, user);
});

// Deserialize user object from session data
passport.deserializeUser(function(user, callback) {
  callback(null, user); // makes user available in req.user
});

/** Create session **/
const session = require('express-session');

app.use(session({
  secret: "586e60fdeb6f34186ae165a0cea7ee1dfa4105354e8c74610671de0ef9662191", // session secret
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // cookie accessible only by web server
    secure: app.get('env') === 'production' // use secure cookies only in production with HTTPS
  }
}));

app.use(passport.authenticate('session')); // use passport session middleware

/** Define authentication verification middleware **/
// Middleware to check if the user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // proceed if user is authenticated
  }
  return res.status(401).json({ error: 'Not authorized' }); // otherwise, send unauthorized error
};

/*** Utility Functions ***/

// Maximum length for title
const maxTitleLength = 160;

// Custom error formatter for express-validator
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};

/*** APIs CALL ***/

// Get token API endpoint
// Generates a JWT token for authenticated users with concert reservations
app.get('/api/auth-token', isLoggedIn, async (req, res) => {  
  const role = req.user.role; // get the role of the authenticated user
  const concertID = req.query.concertID; // concert ID from query parameters
  const userID = req.user.user_id; // user ID from session
  
  // Validate concertID
  if (!concertID || isNaN(parseInt(concertID))) {
    return res.status(400).json({ error: 'Invalid or missing concertID' });
  }
  
  try {
    const reservations = await contentDao.getReserveSeats(userID, concertID); // fetch reservations for the user
    // Create a JWT token with the reservation data and user role
    const payloadToSign = { reservations, role };

    const jwtToken = jsonwebtoken.sign(payloadToSign, jwtSecret, { expiresIn: expireTime }); // sign JWT token
    
    return res.json({ token: jwtToken }); // return the JWT token

  } catch (err) {
    console.error('Error fetching reservations:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Manage block API endpoint
// Adds seats for a user to a specified concert
app.post('/api/addUserSeat', isLoggedIn, (req, res) => {
  const concertID = req.session.concertID; // concert ID from session
  const theaterID = req.session.theaterID; // theater ID from session
  const userID = req.user.user_id; // user ID 
  let addSeatBody = req.body; // seats to add, expected as an array of seat IDs

  // Call DAO function to add user seat
  contentDao.addUserSeat(concertID, addSeatBody, theaterID, userID)
    .then(data => {
      res.json(data); // return the response data
    })
    .catch(err => {
      console.error('Error in addUserSeat:', err); // log error for debugging
      res.status(500).json({ error: 'Internal Server Error', details: err.message });
    });
});

// Delete User Seat API endpoint
// Deletes a reservation and associated seats for the logged-in user
app.delete('/api/deleteUserSeat', isLoggedIn, async (req, res) => {
  try {
    const user_id = req.user.user_id; // get user ID 
    const reservationId = parseInt(req.query.reservationId); // parse reservation ID from query

    // Validate user ID and reservation ID
    if (!Number.isInteger(user_id) || !Number.isInteger(reservationId)) {
      return res.status(400).json({ message: 'User ID and Reservation ID must be valid integers and are required.' });
    }

    // Call DAO to delete user seat
    await contentDao.deleteUserSeat(user_id, reservationId);

    res.status(204).send(); // send no content response on successful deletion
  } catch (error) {
    console.error('Error in deleteUserSeat:', error); // log error for debugging
    res.status(500).json({
      message: `An error occurred during reservation deletion: ${error.message}`,
      error
    });
  }
});

// Get public concert API endpoint
// Fetches a list of concerts and optionally includes reservations for the logged-in user
app.get('/api/getConcerts', (req, res) => {
  const user_id = req.user && req.user.user_id ? req.user.user_id : "NA"; // get user ID if logged in
  contentDao.getConcerts() // fetch all concerts
    .then(data => {
      if (user_id !== "NA") {
        // Fetch reservations if user is logged in
        contentDao.getReservations(user_id)
          .then(reservation => {
            // Include reservation data with concert data
            res.json({
              ...data,
              reservation
            });
          })
          .catch(err => {
            console.error('Error fetching reservation data:', err);
            res.status(500).json({ error: 'Error fetching reservation data', details: err.message });
          });
      } else {
        // Return only concert data if no user is logged in
        res.json(data);
      }
    })
    .catch(err => {
      console.error('Error fetching concert data:', err);
      res.status(500).json({ error: 'Internal Server Error', details: err.message });
    });
});

// Get public theater API endpoint
// Fetches theater information for a specific concert
app.get('/api/getTheater', (req, res) => {
  const concertID = parseInt(req.query.concertID); // parse concert ID from query

  // Validate concert ID
  if (!Number.isInteger(concertID)) {
    return res.status(400).json({
      message: 'Invalid concertID provided. A valid integer is required.'
    });
  }

  contentDao.getTheater(concertID) // fetch theater data for the concert
    .then(data => {
      if (!data || !data.theater) {
        // If no theater found, return 404
        return res.status(404).json({
          message: 'No theater found for the provided concertID.'
        });
      }

      // Store concertID and theaterID in the session
      req.session.concertID = concertID;
      req.session.theaterID = data.theater.id;

      // Send the retrieved theater data
      res.json(data);
    })
    .catch(err => {
      console.error('Error fetching theater:', err); // log error for debugging
      res.status(500).json({
        message: 'An error occurred while fetching theater information.',
        error: err.message
      });
    });
});

// POST /api/sessions - login route
// Authenticates a user and creates a session
app.post('/api/sessions', [
  check('username').notEmpty().withMessage('Username is required'), // validation check for username
  check('password').notEmpty().withMessage('Password is required')  // validation check for password
], (req, res, next) => {
  const errors = validationResult(req).formatWith(errorFormatter); // format validation errors
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // return validation errors
  }

  passport.authenticate('local', (err, user, info) => { // authenticate using local strategy
    if (err)
      return next(err);
    if (!user) {
      return res.status(401).json({ error: info }); // return unauthorized if authentication fails
    }
    req.login(user, (err) => { // log in the user and create a session
      if (err)
        return next(err);
      return res.json(req.user); // return user data on successful login
    });
  })(req, res, next);
});

// GET /api/sessions/current - check current session
// Checks if a user is currently authenticated
app.post('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user); // return user data if authenticated
  } else {
    res.status(401).json({ error: 'Not authenticated' }); // otherwise, return not authenticated
  }
});

// DELETE /api/session/current - logout route
// Logs out the user and destroys the session
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({}); // return success response on logout
  });
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`)); // start the server on port 3001
