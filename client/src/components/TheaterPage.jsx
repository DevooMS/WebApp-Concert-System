import React, { useState, useEffect, useReducer } from 'react';
import { useLocation } from 'react-router-dom';
import Seat from './Seat';
import '../SeatPage.css';
import MyNavbar from './Navbar';
import { useData, useAuth } from '../App';
import { Button, Modal, Form, Alert } from 'react-bootstrap';

// Reducer function to manage seat highlighting logic
const seatReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_HIGHLIGHT': // Add new seats to be highlighted
      return [...new Set([...state, ...action.payload])]; // Ensure no duplicates
    case 'REMOVE_HIGHLIGHT': // Remove highlighted seats
      return state.filter(seatId => !action.payload.includes(seatId));
    default: // Return the current state if no action matches
      return state;
  }
};

const TheaterPage = () => {
  // Hooks for authentication and data management
  const { loggedIn } = useAuth(); // Check if user is logged in
  const { theaterData, handleTheater, handleAdd, handleGetAuthToken, estimationData } = useData(); // Access theater-related data and actions

  // Local state management for UI interactions
  const [error, setError] = useState(''); // Error message for seat confirmation
  const [modalError, setModalError] = useState(''); // Error message for modal interactions
  const [showModal, setShowModal] = useState(false); // Modal visibility state
  const [selectedSeats, setSelectedSeats] = useState([]); // Array of currently selected seat IDs
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Authentication state
  const [confirmationDone, setConfirmationDone] = useState(false); // Flag to check if seat selection is confirmed
  const [requestedSeatsCount, setRequestedSeatsCount] = useState(0); // Number of seats requested for random selection
  const location = useLocation(); // Get location state from React Router
  const { concertId, reservation } = location.state || {}; // Extract concert ID and reservation details from location state
  const [seats, setSeats] = useState([]); // Array to hold seats fetched from theaterData

  // UseReducer hook to manage highlighted seats state
  const [highlightedSeats, dispatch] = useReducer(seatReducer, []);

  // Effect hook to fetch theater data based on concertId
  useEffect(() => {
    if (concertId) {
      handleTheater(concertId); // Fetch theater data for the specified concert ID
      if (reservation && reservation.concert_id === concertId) {
        //console.log('Reservation found:', concertId);
        handleGetAuthToken(concertId); // Get authentication token if a reservation exists
      }
    }
  }, [handleTheater, concertId, reservation]);

  // Effect hook to update seats state when theaterData changes
  useEffect(() => {
    if (theaterData && theaterData.seats) {
      setSeats(theaterData.seats); // Update seats with the fetched data
    }
  }, [theaterData]);

  // Display a message if no theater data or seats are found
  if (!theaterData || !theaterData.theater || seats.length === 0) {
    return <div>Theater not found</div>;
  }

  const { theater } = theaterData; // Extract theater details from theaterData
  const hasAlreadyBooked = reservation && reservation.concert_id === concertId; // Check if the user has already booked for this concert

  // Handles user logout action
  const handleLogout = () => {
    setIsAuthenticated(false); // Set authentication state to false
  };

  // Handles the selection or deselection of a seat
  const handleSeatClick = (seatId) => {
    // Do nothing if user is not logged in, has already booked, or confirmation is done
    if (!loggedIn || hasAlreadyBooked || confirmationDone) return;

    // Remove any existing highlights if they exist
    if (highlightedSeats.length > 0) {
      dispatch({ type: 'REMOVE_HIGHLIGHT', payload: highlightedSeats });
    }

    // Toggle seat selection: remove if already selected, add if not
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId)); // Remove the seat from selectedSeats
    } else {
      setSelectedSeats([...selectedSeats, seatId]); // Add the seat to selectedSeats
    }
  };

  // Highlights seats for a short period (e.g., to indicate unavailable seats)
  const highlightSeats = (seatIds) => {
    dispatch({ type: 'ADD_HIGHLIGHT', payload: seatIds }); // Add seats to be highlighted

    setTimeout(() => {
      dispatch({ type: 'REMOVE_HIGHLIGHT', payload: seatIds }); // Remove highlights after 5 seconds
    }, 5000);
  };

  // Confirms the selection of seats, updates their status, and handles any errors
  const handleConfirmSelection = async (selectedSeatsList = selectedSeats) => {
    if (hasAlreadyBooked) return; // Exit if the user has already booked
    try {
      await handleAdd(selectedSeatsList); // Add the selected seats via handleAdd function
      //console.log('Seats added:', selectedSeatsList);
      await handleGetAuthToken(concertId); // Refresh authentication token

      dispatch({ type: 'REMOVE_HIGHLIGHT', payload: [] }); // Clear any highlights

      // Update seat status to 'occupied' for the selected seats
      const updatedSeats = seats.map((seat) => {
        if (selectedSeatsList.includes(seat.seatId)) {
          return { ...seat, status: 'occupied' }; // Mark seat as occupied
        }
        return { ...seat };
      });
      setSeats(updatedSeats); // Update seats state with new statuses
      setSelectedSeats([]); // Clear selected seats after confirmation
      setConfirmationDone(true); // Mark confirmation as done
    } catch (err) {
      console.error(err);
      if (err.message.includes("One or more seats are not available")) {
        const occupiedSeatIds = err.message.match(/not available: (.*)/)[1];
        const occupiedSeatsArray = occupiedSeatIds.split(',').map((id) => parseInt(id));
        highlightSeats(occupiedSeatsArray); // Highlight seats that are already occupied
        await handleTheater(concertId); // Refresh seat data after an error
        setSelectedSeats([]); // Clear selected seats after an error
        setConfirmationDone(false); // Reset confirmation state
      }
      setError("An error occurred during seat confirmation."); // Display an error message
      setTimeout(() => setError(''), 5000); // Clear error message after 5 seconds
    }
  };

  // Opens the modal for random seat selection
  const handleRandomSelection = () => {
    setShowModal(true); // Show the modal
  };

  // Renders the seat layout based on rows
  const renderSeats = () => {
    const rows = [...new Set(seats.map((seat) => seat.rowNumber))]; // Get unique row numbers
    return rows.map((row) => (
      <div key={row} className="seat-row">
        <div className="row-label">{`Row ${row}`}</div> {/* Display row label */}
        <div className="seats-container">
          {seats.filter((seat) => seat.rowNumber === row).map((seat) => (
            <Seat
              key={seat.seatId}
              seat={seat}
              isSelected={selectedSeats.includes(seat.seatId)} // Highlight if selected
              highlightedSeats={highlightedSeats} // Pass highlighted seats to the Seat component
              onClick={() => handleSeatClick(seat.seatId)} // Handle seat click
              disabled={hasAlreadyBooked || confirmationDone} // Disable if booked or confirmed
              removeHighlight={(seatId) => dispatch({ type: 'REMOVE_HIGHLIGHT', payload: [seatId] })} // Remove highlight from seat
            />
          ))}
        </div>
      </div>
    ));
  };

  // Closes the modal and resets related state
  const handleModalClose = () => {
    setShowModal(false); // Hide the modal
    setModalError(''); // Clear modal error message
    setRequestedSeatsCount(0); // Reset requested seats count
  };

  // Confirms the random selection of seats based on user input
  const handleRandomSelectConfirm = () => {
    if (requestedSeatsCount === 0) {
      setModalError('Error: Please select at least one seat.'); // Show error if no seats requested
      return;
    }

    // Filter out seats that are available and not already selected
    const availableSeats = seats
      .filter(seat => seat.status === 'available' && !selectedSeats.includes(seat.seatId))
      .map(seat => seat.seatId);

    // Check if enough seats are available
    if (requestedSeatsCount > availableSeats.length) {
      setModalError(`Error: Not enough available seats. Maximum available: ${availableSeats.length}.`);
      return;
    }

    // Randomly select seats from the available seats
    const randomSelection = [];
    while (randomSelection.length < requestedSeatsCount && availableSeats.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableSeats.length);
      randomSelection.push(availableSeats[randomIndex]); // Add random seat to selection
      availableSeats.splice(randomIndex, 1); // Remove the selected seat from availableSeats
    }

    const newSelectedSeats = [...selectedSeats, ...randomSelection]; // Combine existing and new selections
    setSelectedSeats(newSelectedSeats); // Update selectedSeats state
    setShowModal(false); // Close the modal
    setRequestedSeatsCount(0); // Reset requested seats count

    handleConfirmSelection(newSelectedSeats); // Confirm the random selection
  };

  // Prevents the default form submission behavior when the form is submitted
  const handleFormSubmit = (e) => {
    e.preventDefault(); // Prevents form submission refresh
  };

  // Counts the number of available seats
  const availableSeatsCount = seats.filter(seat => seat.status === 'available').length;

  return (
    <>
      {/* Render the Navbar with authentication state */}
      <MyNavbar isAuthenticated={isAuthenticated} handleLogout={handleLogout} />
      <div className="container my-5">
        <h2>Seat Availability for {theater.name}</h2> {/* Display theater name */}
        <div className="row">
          <div className="col-md-6">
            <h4>Total Seats: {seats.length}</h4> {/* Total number of seats */}
            <h4>Occupied Seats: {seats.filter(seat => seat.status === 'occupied').length}</h4> {/* Number of occupied seats */}
            <h4>Available Seats: {availableSeatsCount}</h4> {/* Number of available seats */}

            {loggedIn && (
              <div className="selected-seats">
                <h4>Selected Seats: {selectedSeats.length}</h4> {/* Display number of selected seats */}
              </div>
            )}
            {loggedIn && (hasAlreadyBooked || confirmationDone) && (
              <div className="selected-seats">
                <h4>Estimated Discount: {estimationData ? `${estimationData}` : 'Loading...'}</h4> {/* Display estimated discount */}
              </div>
            )}
          </div>
          <div className="col-md-6">
            {/* Additional content can be added here */}
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>} {/* Display error if present */}
        <div className="seat-actions">
          {/* Display seat action buttons if booking is not already done */}
          {!hasAlreadyBooked && !confirmationDone && (
            <>
              <Button
                className="btn btn-primary ml-2"
                onClick={() => handleConfirmSelection()} // Trigger seat confirmation
                disabled={selectedSeats.length === 0 || !loggedIn || hasAlreadyBooked} // Disable button based on conditions
                style={{ display: loggedIn ? 'inline-block' : 'none' }} // Show only if logged in
              >
                Confirm
              </Button>
              <Button
                className="btn btn-secondary m-2"
                onClick={handleRandomSelection} // Open random selection modal
                disabled={!loggedIn || hasAlreadyBooked} // Disable if not logged in or already booked
                style={{ display: loggedIn ? 'inline-block' : 'none' }} // Show only if logged in
              >
                Select Randomly
              </Button>
            </>
          )}
        </div>
        <div className="card">{renderSeats()}</div> {/* Render seat layout */}
      </div>

      {/* Modal for selecting a random number of seats */}
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Select Number of Seats</Modal.Title> {/* Modal title */}
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>} {/* Display modal error if present */}
          <Form onSubmit={handleFormSubmit}> {/* Prevents default form submission */}
            <Form.Group controlId="requestedSeats">
              <Form.Label>How many seats would you like to select?</Form.Label>
              <Form.Control
                type="number"
                min="0"
                max={seats.filter(seat => seat.status === 'available').length} // Limit max to available seats
                value={requestedSeatsCount} // Bind to state
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value)); // Ensure no negative numbers
                  setRequestedSeatsCount(isNaN(value) ? 0 : Math.max(0, value)); // Update state with new value
                  setModalError(''); // Clear any existing modal errors
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRandomSelectConfirm}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TheaterPage;
