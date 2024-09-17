import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';

const Seat = ({ seat, isSelected, onClick, highlightedSeats = [], removeHighlight }) => {
  useEffect(() => {
    let timer;
    if (highlightedSeats.includes(seat.seatId)) {
      // Set a timer to remove the highlight after 5 seconds
      timer = setTimeout(() => {
        removeHighlight(seat.seatId);
      }, 5000);
    }
    // Clear the timer on unmount or before a new effect is run
    return () => clearTimeout(timer);
  }, [highlightedSeats, seat.seatId, removeHighlight]);

  const getColor = () => {
    if (highlightedSeats.includes(seat.seatId)) {
      return 'primary'; // Blue when highlighted
    }
    if (isSelected && seat.status !== 'occupied') {
      return 'warning'; // Yellow when selected
    }
    switch (seat.status) {
      case 'available':
        return 'success'; // Green when available
      case 'occupied':
        return 'danger'; // Red when occupied
      default:
        return 'secondary'; // Grey otherwise
    }
  };

  const handleClick = () => {
    if (seat.status !== 'occupied') {
      onClick(seat.seatId);
    }
  };

  return (
    <Button
      variant={getColor()}
      disabled={seat.status === 'occupied'}
      onClick={handleClick}
      className='mt-2'
    >
      {seat.rowNumber}-{seat.seatPosition}
    </Button>
  );
};

export default Seat;
