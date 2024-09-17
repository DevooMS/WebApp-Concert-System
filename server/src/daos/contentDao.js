const db = require('../../db');

/**
 * Query the database and get every question
 * @returns {Promise} a Promise that resolves to the full information about the questions
 * @throws the Promise rejects if any errors are encountered
 */

function getConcerts() {
    return new Promise((resolve, reject) => {
        // SQL query to fetch all concerts and their associated theater IDs
        const sql = `
            SELECT 
                C.concert_id AS id, 
                C.name AS title, 
                T.theater_id 
            FROM 
                Concerts C
            JOIN 
                Theaters T ON C.theater_id = T.theater_id
        `;
        
        // Executing the query to get concert data
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err); // Rejects if there's an error in fetching data
            } else {
                // Formatting rows to match expected output structure
                const formattedRows = rows.map(row => ({
                    id: row.id,
                    title: row.title,
                    theater_id: row.theater_id
                }));
                
                resolve(formattedRows); // Resolves with formatted concert data
            }
        });
    });
}

function getTheater(concertID) {
    return new Promise((resolve, reject) => {
        if (!Number.isInteger(concertID)) {
            return reject(new Error('Invalid input: concert ID must be an integer'));
        }

        // SQL query to fetch theater details for a given concert ID
        const sql = `
            SELECT 
                T.theater_id AS id, 
                T.name AS name, 
                T.rows AS rows, 
                T.seats_per_row AS seatsPerRow
            FROM 
                Concerts C
            JOIN 
                Theaters T ON C.theater_id = T.theater_id
            WHERE 
                C.concert_id = ?
        `;

        // Executing the query to get theater details
        db.get(sql, [concertID], (err, theaterRow) => {
            if (err) {
                reject(err); // Rejects if there's an error in fetching theater data
            } else if (!theaterRow) {
                reject(new Error('No theater found for the given concert ID')); // Rejects if no theater is found
            } else {
                // SQL query to fetch seat details using concert_seat_id
                const seatSql = `
                    SELECT 
                        CS.concert_seat_id AS seatId, 
                        S.row_number AS rowNumber, 
                        S.seat_position AS seatPosition, 
                        CS.status AS status
                    FROM 
                        ConcertSeats CS
                    JOIN 
                        Seats S ON CS.seat_id = S.seat_id
                    WHERE 
                        CS.concert_id = ?
                `;

                // Executing the query to get seat details
                db.all(seatSql, [concertID], (seatErr, seatRows) => {
                    if (seatErr) {
                        reject(seatErr); // Rejects if there's an error in fetching seat data
                    } else {
                        // Formatting seat data for output
                        const formattedSeats = seatRows.map(seat => ({
                            seatId: seat.seatId,
                            rowNumber: seat.rowNumber,
                            seatPosition: seat.seatPosition,
                            status: seat.status
                        }));

                        // Resolving with theater and seat data
                        resolve({
                            theater: {
                                id: theaterRow.id,
                                name: theaterRow.name,
                                rows: theaterRow.rows,
                                seatsPerRow: theaterRow.seatsPerRow
                            },
                            seats: formattedSeats
                        });
                    }
                });
            }
        });
    });
}



function getReserveSeats(userID, concertID) {
    return new Promise((resolve, reject) => {
        // SQL query to fetch all reserved seats for a user and specific concert
        const query = `
            SELECT 
                s.row_number, 
                s.seat_position, 
                cs.status
            FROM 
                Reservations r
            JOIN 
                ReservationSeat rs ON r.reservation_id = rs.reservation_id
            JOIN 
                ConcertSeats cs ON rs.concert_seat_id = cs.concert_seat_id
            JOIN 
                Seats s ON cs.seat_id = s.seat_id
            WHERE 
                r.concert_id = ? AND r.user_id = ?
        `;

        // Executing the query to get reserved seats
        db.all(query, [concertID, userID], (err, rows) => {
            if (err) {
                return reject(err); // Reject if there's an error in fetching reserved seats
            }

            if (rows.length > 0) {
                // Map the result to include only row numbers
                const rowNumbers = rows.map(row => row.row_number);
                resolve(rowNumbers); // Resolve with the list of row numbers
            } else {
                resolve([]); // Resolve with an empty array if no reserved seats are found
            }
        });
    });
}

function getReservations(userID) {
    return new Promise((resolve, reject) => {
        // SQL query to fetch all reservation IDs and their associated concert IDs for a given user
        const query = `
            SELECT 
                r.reservation_id, 
                r.concert_id
            FROM 
                Reservations r
            WHERE 
                r.user_id = ?
        `;

        // Executing the query to get reservations
        db.all(query, [userID], (err, rows) => {
            if (err) {
                return reject(err); // Reject if there's an error in fetching reservations
            }

            if (rows.length > 0) {
                // Map the result to include reservation_id and concert_id
                const reservations = rows.map(row => ({
                    reservation_id: row.reservation_id,
                    concert_id: row.concert_id,
                }));

                resolve(reservations); // Resolve with the list of reservations
            } else {
                resolve([]); // Resolve with an empty array if no reservations are found
            }
        });
    });
}
function addUserSeat(concertID, addSeatBody, theaterID, userID) {
    return new Promise((resolve, reject) => {
        // Input validation
        if (!Number.isInteger(concertID) || !Number.isInteger(theaterID) || !Number.isInteger(userID)) {
            return reject(new Error('Invalid input: IDs must be integers'));
        }

        if (!Array.isArray(addSeatBody) || !addSeatBody.every(Number.isInteger) || addSeatBody.length === 0) {
            return reject(new Error('Invalid input: addSeatBody must be a non-empty array of integers'));
        }

        db.serialize(() => {
            db.run('BEGIN TRANSACTION;'); // Begin a new transaction

            // Check if the user already has a reservation for the same concert
            const checkExistingReservationQuery = `
                SELECT reservation_id 
                FROM Reservations 
                WHERE user_id = ? AND concert_id = ?
            `;
            db.get(checkExistingReservationQuery, [userID, concertID], (err, existingReservation) => {
                if (err) {
                    db.run('ROLLBACK;'); // Rollback if there's an error checking for existing reservations
                    return reject(err);
                }

                if (existingReservation) {
                    db.run('ROLLBACK;'); // Rollback if a reservation already exists
                    return reject(new Error('User already has a reservation for this concert.'));
                }

                // Check if the concert exists
                const checkConcertQuery = `
                    SELECT concert_id, theater_id FROM Concerts WHERE concert_id = ?
                `;
                db.get(checkConcertQuery, [concertID], (err, concert) => {
                    if (err || !concert) {
                        db.run('ROLLBACK;'); // Rollback transaction if concert does not exist
                        return reject(new Error('Concert does not exist.'));
                    }

                    // Check if the theater ID matches the concert's theater
                    if (concert.theater_id !== theaterID) {
                        db.run('ROLLBACK;'); // Rollback if theater ID does not match
                        return reject(new Error('Theater ID does not match the concert\'s theater.'));
                    }

                    // Check seat availability using concert_seat_id
                    const placeholders = addSeatBody.map(() => '?').join(',');
                    const checkConcertSeatsQuery = `
                        SELECT concert_seat_id, status
                        FROM ConcertSeats
                        WHERE concert_id = ? AND concert_seat_id IN (${placeholders})
                    `;
                    db.all(checkConcertSeatsQuery, [concertID, ...addSeatBody], (err, seats) => {
                        if (err) {
                            db.run('ROLLBACK;'); // Rollback transaction in case of error
                            return reject(err);
                        }

                        // Check for unavailable seats
                        const unavailableSeats = seats.filter(seat => seat.status !== 'available');
                        if (unavailableSeats.length > 0) {
                            const occupiedSeatIDs = unavailableSeats.map(seat => seat.concert_seat_id);
                            const errorMsg = `One or more seats are not available. Occupied seat IDs: ${occupiedSeatIDs.join(', ')}`;
                            db.run('ROLLBACK;'); // Rollback transaction if any seat is unavailable
                            return reject(new Error(errorMsg));
                        }

                        // SQL query to insert a new reservation
                        const insertReservation = `
                            INSERT INTO Reservations (user_id, concert_id)
                            VALUES (?, ?)
                        `;
                        db.run(insertReservation, [userID, concertID], function(err) {
                            if (err) {
                                db.run('ROLLBACK;'); // Rollback transaction if there's an error inserting reservation
                                return reject(err);
                            }

                            const reservationID = this.lastID; // Get the newly inserted reservation ID

                            // Update seats to 'occupied' and link to reservation
                            const updates = seats.map(seat => new Promise((resolve, reject) => {
                                const updateQuery = `
                                    UPDATE ConcertSeats
                                    SET status = 'occupied'
                                    WHERE concert_seat_id = ?
                                `;
                                db.run(updateQuery, [seat.concert_seat_id], err => {
                                    if (err) {
                                        return reject(err); // Reject if there's an error updating seat status
                                    }

                                    // SQL query to link reservation to seat
                                    const linkQuery = `
                                        INSERT INTO ReservationSeat (reservation_id, concert_seat_id)
                                        VALUES (?, ?)
                                    `;
                                    db.run(linkQuery, [reservationID, seat.concert_seat_id], err => {
                                        if (err) {
                                            return reject(err); // Reject if there's an error linking reservation to seat
                                        }
                                        resolve(); // Resolve when the seat is successfully updated and linked
                                    });
                                });
                            }));

                            // Completing the transaction
                            Promise.all(updates)
                                .then(() => {
                                    db.run('COMMIT;', err => { // Commit the transaction
                                        if (err) {
                                            db.run('ROLLBACK;'); // Rollback if commit fails
                                            return reject(err);
                                        }
                                        resolve('Seats added to reservation successfully.'); // Resolve on successful commit
                                    });
                                })
                                .catch(err => {
                                    db.run('ROLLBACK;'); // Rollback if there's an error during seat update or linking
                                    reject(err);
                                });
                        });
                    });
                });
            });
        });
    });
}

function deleteUserSeat(user_id, reservationId) {
    return new Promise((resolve, reject) => {
        if (!Number.isInteger(reservationId)) {
            return reject(new Error('Invalid input: reservation ID must be an integer'));
        }
        db.serialize(() => {
            db.run('BEGIN TRANSACTION', (err) => { // Begin a new transaction
                if (err) {
                    return reject(new Error('Error starting transaction: ' + err.message)); // Reject if there's an error starting transaction
                }

                // SQL query to check if reservation exists for the given user and reservation ID
                const getReservationSql = `
                    SELECT reservation_id
                    FROM Reservations
                    WHERE user_id = ? AND reservation_id = ?
                `;
                // Executing the query to check reservation
                db.get(getReservationSql, [user_id, reservationId], (err, row) => {
                    if (err) {
                        db.run('ROLLBACK'); // Rollback transaction if there's an error checking reservation
                        return reject(new Error('Error checking reservation: ' + err.message));
                    }

                    if (!row) {
                        db.run('COMMIT'); // Commit if no reservation is found
                        return resolve('No reservation found for this user with the provided reservation ID.');
                    }

                    // SQL query to retrieve reserved seats for the reservation
                    const getSeatsSql = `
                        SELECT concert_seat_id
                        FROM ReservationSeat
                        WHERE reservation_id = ?
                    `;
                    // Executing the query to get reserved seats
                    db.all(getSeatsSql, [reservationId], (err, seats) => {
                        if (err) {
                            db.run('ROLLBACK'); // Rollback transaction if there's an error retrieving reserved seats
                            return reject(new Error('Error retrieving reserved seats: ' + err.message));
                        }

                        const concertSeatIDs = seats.map(seat => seat.concert_seat_id);

                        if (concertSeatIDs.length > 0) {
                            // SQL query to update seat status to 'available'
                            const updateSeatsSql = `
                                UPDATE ConcertSeats
                                SET status = 'available'
                                WHERE concert_seat_id IN (${concertSeatIDs.map(() => '?').join(',')})
                            `;
                            // Executing the query to update seat status
                            db.run(updateSeatsSql, concertSeatIDs, (err) => {
                                if (err) {
                                    db.run('ROLLBACK'); // Rollback transaction if there's an error updating seat status
                                    return reject(new Error('Error updating seat status: ' + err.message));
                                }

                                // SQL query to delete seats from ReservationSeat table
                                const deleteReservationSeatSql = `
                                    DELETE FROM ReservationSeat
                                    WHERE reservation_id = ?
                                `;
                                // Executing the query to delete reserved seats
                                db.run(deleteReservationSeatSql, [reservationId], (err) => {
                                    if (err) {
                                        db.run('ROLLBACK'); // Rollback transaction if there's an error deleting reserved seats
                                        return reject(new Error('Error deleting reserved seats: ' + err.message));
                                    }

                                    // SQL query to delete the reservation
                                    const deleteReservationSql = `
                                        DELETE FROM Reservations
                                        WHERE reservation_id = ?
                                    `;
                                    // Executing the query to delete reservation
                                    db.run(deleteReservationSql, [reservationId], (err) => {
                                        if (err) {
                                            db.run('ROLLBACK'); // Rollback transaction if there's an error deleting reservation
                                            return reject(new Error('Error deleting reservation: ' + err.message));
                                        }

                                        db.run('COMMIT', (err) => { // Commit the transaction
                                            if (err) {
                                                return reject(new Error('Error committing transaction: ' + err.message)); // Reject if commit fails
                                            }

                                            resolve('Reservation and associated seats deleted successfully, and seats have been freed.'); // Resolve on successful commit
                                        });
                                    });
                                });
                            });
                        } else {
                            db.run('COMMIT', (err) => { // Commit if no seats to free
                                if (err) {
                                    return reject(new Error('Error committing transaction: ' + err.message)); // Reject if commit fails
                                }
                                resolve('No reserved seats to free.');
                            });
                        }
                    });
                });
            });
        });
    });
}

exports.getConcerts = getConcerts;
exports.getTheater = getTheater;
exports.getReservations = getReservations;
exports.getReserveSeats = getReserveSeats;
exports.deleteUserSeat = deleteUserSeat;
exports.addUserSeat = addUserSeat;
