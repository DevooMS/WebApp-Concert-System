
## Table of Contents

1. [React Client Application Routes](#react-client-application-routes)
2. [API Servers](#api-servers)
    1. [API Server 1](#api-server-1)
        - [POST /api/sessions](#post-apisessions)
        - [GET /api/sessions/current](#get-apisessionscurrent)
        - [DELETE /api/sessions/current](#delete-apisessionscurrent)
        - [GET /api/auth-token](#get-apiauth-token)
        - [POST /api/addUserSeat](#post-apiadduserseat)
        - [DELETE /api/deleteUserSeat](#delete-apideleteuserseat)
        - [GET /api/getConcerts](#get-apigetconcerts)
        - [GET /api/getTheater](#get-apigetteter)
    2. [API Server 2](#api-server-2)
        - [GET /api/get-estimation](#post-apiget-estimation)
3. [Database Tables](#database-tables)
    1. [Table: Users](#table-users)
    2. [Table: Theaters](#table-theaters)
    3. [Table: Concerts](#table-concerts)
    4. [Table: Seats](#table-seats)
    5. [Table: ConcertSeats](#table-concertseats)
    6. [Table: Reservations](#table-reservations)
    7. [Table: ReservationSeat](#table-reservationseat)
4. [Main React Components](#main-react-components)
5. [Screenshot](#screenshot)
6. [Users Credentials](#users-credentials)

## React Client Application Routes

- **Concert List Page Route (`'/'`)**:
    - **Path**: `/`
    - **Component**: `<ConcertListPage />`
    - **Description**: This is the main entry point of the application, where all available concerts are displayed. Users can select a concert to view details and book seats.

- **Theater Page Route (`'/theater'`)**:
    - **Path**: `/theater`
    - **Component**: `<TheaterPage />`
    - **Description**: This route allows users to view the seating layout for a specific concert and select available seats.

- **Login Page Route (`'/LoginPage'`)**:
    - **Path**: `/LoginPage`
    - **Component**: `<LoginPage />`
    - **Description**: This route is for the login page, where users can authenticate themselves to access the application features.

- **Home Route (`'/Home'`)**:
    - **Path**: `/Home`
    - **Component**: `<Home_page />`
    - **Description**: The initial home page of the application, accessible after logout or via redirection.

- **Catch-All Redirect Route (`'*'`)**:
    - **Path**: `*`
    - **Component**: `<Navigate to="/Home" />`
    - **Description**: This route catches any undefined URLs and redirects the user to the Home page (`/Home`).

## API Servers

### API Server 1

API Server 1 handles authentication, session management, and concert and reservation management operations.

#### Authentication

1. #### POST /api/sessions

   Authenticate and log in the user.
   
   **Request:**
   - **Body**: JSON object with user's credentials.
     ```json
     {
       "username": "user1",
       "password": "password"
     }
     ```
   **Response:**
   - **Status Codes**:
     - `200 OK`: Successfully authenticated.
     - `400 Bad Request`: Invalid request body.
     - `401 Unauthorized`: Incorrect credentials.
     - `500 Internal Server Error`: Server error.

2. #### GET /api/sessions/current

   Check the current session status.

   **Response:**
   - **Status Codes**:
     - `200 OK`: User is authenticated.
     - `401 Unauthorized`: No active session.

3. #### DELETE /api/sessions/current

   Log out the current user.

   **Response:**
   - **Status Codes**:
     - `200 OK`: Successfully logged out.
     - `500 Internal Server Error`: Server error.

#### JWT Token

1. #### GET /api/auth-token

   Generate a JWT token for the logged-in user with concert reservations.

   **Request:**
   - **Headers**: Requires authentication via session.
   - **Response**: Returns a JWT token with reservation data and the user's role.

#### Content Management

1. #### POST /api/addUserSeat

   Adds seats for a user to a specified concert.

   **Request:**
   - **Body**: JSON object with seat IDs to add.
   
   **Response:**
   - **Status Codes**:
     - `200 OK`: Seats added successfully.
     - `500 Internal Server Error`: Error adding seats.

2. #### DELETE /api/deleteUserSeat

   Deletes a reservation and associated seats for the authenticated user.

   **Request:**
   - **Query**: Requires the reservation ID.
   
   **Response:**
   - **Status Codes**:
     - `204 No Content`: Reservation deleted successfully.
     - `400 Bad Request`: Missing or invalid parameters.
     - `500 Internal Server Error`: Error during deletion.

3. #### GET /api/getConcerts

   Fetches a list of concerts and, if the user is authenticated, includes reservations.

   **Response:**
   - **Status Codes**:
     - `200 OK`: Data retrieved successfully.
     - `500 Internal Server Error`: Error retrieving data.

4. #### GET /api/getTheater

   Fetches theater information for a specific concert.

   **Request:**
   - **Query**: Requires the concert ID.
   
   **Response:**
   - **Status Codes**:
     - `200 OK`: Theater data retrieved successfully.
     - `404 Not Found`: Theater not found.
     - `500 Internal Server Error`: Error retrieving data.

### API Server 2

API Server 2 manages estimation calculations and related discounts based on seat reservations.

#### Estimation Calculation

1. #### GET /api/get-estimation

   Calculate the discount based on seat reservations and the user's role.

   **Request:**
   - **Headers**: Requires a valid JWT token.
   - **Body**: Not required.
   
   **Response:**
   - **Status Codes**:
     - `200 OK`: Discount calculated successfully.
     - `400 Bad Request`: Missing or invalid reservation data.
     - `500 Internal Server Error`: Error calculating discount.

## Database Tables

### 1. Table: Users

- **user_id**: Unique identifier for each user (auto-incremented).
- **username**: Unique username.
- **hash**: Hashed password for secure storage.
- **salt**: Salt used in password hashing.
- **is_loyal_customer**: Indicates if the user is a loyal customer (0 for no, 1 for yes).

### 2. Table: Theaters

- **theater_id**: Unique identifier for each theater (auto-incremented).
- **name**: Name of the theater.
- **rows**: Number of rows in the theater.
- **seats_per_row**: Number of seats per row.

### 3. Table: Concerts

- **concert_id**: Unique identifier for each concert (auto-incremented).
- **name**: Name of the concert.
- **theater_id**: Associated theater ID (linked to the **Theaters** table).

### 4. Table: Seats

- **seat_id**: Unique identifier for each seat (auto-incremented).
- **theater_id**: Associated theater ID (linked to the **Theaters** table).
- **row_number**: Row number of the seat.
- **seat_position**: Position of the seat within the row.

### 5. Table: ConcertSeats

- **concert_seat_id**: Unique identifier for each seat in a concert (auto-incremented).
- **concert_id**: Associated concert ID (linked to the **Concerts** table).
- **seat_id**: Associated seat ID (linked to the **Seats** table).
- **status**: Status of the seat (available, occupied, etc.).

### 6. Table: Reservations

- **reservation_id**: Unique identifier for each reservation (auto-incremented).
- **user_id**: User ID who made the reservation (linked to the **Users** table).
- **concert_id**: Associated concert ID (linked to the **Concerts** table).
- **reserved_at**: Timestamp of the reservation.

### 7. Table: ReservationSeat

- **reservation_id**: Associated reservation ID (linked to the **Reservations** table).
- **concert_seat_id**: Reserved seat ID (linked to the **ConcertSeats** table).

## Main React Components

- **App Component**:
  - Root component rendered inside `BrowserRouter`, maintains state via `AuthProvider` and `DataProvider`, and defines main routes. `"App.jsx"`

- **Login Component**:
  - `LoginPage`: A component for user login, using `useAuth` to handle authentication and display notifications. It includes a form with fields for username and password. `"LoginPage.jsx"`

- **Concert List Component**:
  - `ConcertListPage`: A React component that displays a list of available concerts with options to view details and book seats. `"ConcertListPage.jsx"`

- **Theater Component**:
  - `TheaterPage`: A React component that shows the seating layout for a specific concert and allows users to select available seats. `"TheaterPage.jsx"`

- **Navbar Component**:
  - `MyNavbar`: A React component that renders a responsive navigation bar (`Navbar`) using `react-bootstrap`. It includes a logo, navigation links, and user-specific elements based on login status (`loggedIn`, `username`, `role`). `"Navbar.jsx"`

## Screenshot

![Screenshot](./img/showconcerts.PNG)
![Screenshot](./img/showtheater.PNG)

## Users Credentials

| Username | Password | Role |
|----------|----------|------|
| user1    | pwd      | user |
| user2    | pwd      | user |
| user3    | pwd      | vip  |
| user4    | pwd      | vip  |
| user5    | pwd      | user |
