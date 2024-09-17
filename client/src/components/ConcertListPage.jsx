import React, { useEffect, useState } from 'react';
import { ListGroup, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import MyNavbar from './Navbar';
import { useAuth, useData } from '../App';

// Component for displaying a list of concerts
const ConcertListPage = () => {
  // State for managing authentication status
  const { loggedIn } = useAuth(); // Get authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  // Custom hook to fetch and manage concert data and actions
  const { concertData, handlegetConcerts, handleDelete } = useData();
  // Hook for navigation actions
  const navigate = useNavigate();

  // Local state for transforming concert data into an array, managing reservations, and handling messages
  const [concertList, setConcertList] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  // Effect to fetch concert data when the component mounts
  useEffect(() => {
    handlegetConcerts();
  }, [handlegetConcerts]);

  // Effect to transform concert data into an array and store reservations if they exist
  useEffect(() => {
    if (concertData && typeof concertData === 'object') {
      // Filter only numerical keys and convert them to an array
      const concertsArray = Object.values(concertData).filter(item => typeof item === 'object' && item.id);
      setConcertList(concertsArray);
      // Store reservations if they exist
      if (Array.isArray(concertData.reservation)) {
        setReservations(concertData.reservation);
      }
    }
  }, [concertData]);

  // Function for logging out
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Function to handle clicking on a concert, navigating to a detailed view
  const handleConcertClick = (concertId) => {
    const reservation = reservations.find(res => res.concert_id === concertId);
    navigate('/theater', { state: { concertId, reservation } });
  };

  // Function to handle deleting a reservation
  const handleDeleteReservation = async (reservationId) => {
    try {
      await handleDelete(reservationId);
      // Remove reservation from state after deletion
      setReservations(prevReservations =>
        prevReservations.filter(res => res.reservation_id !== reservationId)
      );
      // Show success message
      setShowSuccessMessage(true);
      // Hide the success message after 2 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      // Show error message
      setShowErrorMessage(true);
      // Hide the error message after 2 seconds
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 2000);
    }
  };

  return (
    <>
      <MyNavbar isAuthenticated={isAuthenticated} handleLogout={handleLogout} />
      <div className="container my-5 d-flex flex-column align-items-center">
        <h1 className="mb-4">Concert List</h1>

        {/* Show success message if deletion is successful */}
        {showSuccessMessage && (
          <Alert variant="success" className="w-100 text-center">
            Reservation successfully cancelled!
          </Alert>
        )}

        {/* Show error message if deletion fails */}
        {showErrorMessage && (
          <Alert variant="danger" className="w-100 text-center">
            Error cancelling reservation. Please try again later.
          </Alert>
        )}

        <ListGroup className="w-100">
          {concertList.map((concert) => {
            // Find current concert reservation
            const reservation = reservations.find(res => res.concert_id === concert.id);
            return (
              <ListGroup.Item 
                key={concert.id}
                className="d-flex justify-content-between align-items-center flex-wrap"
              >
                <Button 
                  onClick={() => handleConcertClick(concert.id)} 
                  variant="primary" 
                  className="nav-item text-white flex-grow-1 text-center"
                >
                  {concert.title}
                </Button>
                {/* Correctly check the loggedIn state to conditionally render the Delete Reservation button */}
                {reservation && loggedIn && (
                  <Button 
                    onClick={() => handleDeleteReservation(reservation.reservation_id)} 
                    variant="danger" 
                    className="ml-3"
                  >
                    Delete Reservation
                  </Button>
                )}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </div>
    </>
  );
};

export default ConcertListPage;
