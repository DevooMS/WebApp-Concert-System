import React, { useState, createContext, useContext, useCallback } from 'react';
import { Routes, Route, BrowserRouter, useNavigate, Navigate } from 'react-router-dom'; 
import ConcertListPage from './components/ConcertListPage'; 
import API from './api/ApiServices'; 
import Login_page from './components/LoginPage'; 
import TheaterPage from './components/TheaterPage'; 
import Home_page from './views/css/homepage'; 

// Creating contexts for authentication and data
const AuthContext = createContext(); 
const DataContext = createContext(); 

// Custom hook to access the authentication context
export function useAuth() {
  return useContext(AuthContext); 
}

// Custom hook to access the data context
export function useData() {
  return useContext(DataContext); 
}

// Authentication provider component
function AuthProvider({ children }) {
  // States for managing authentication, username, notifications, and role
  const [loggedIn, setLoggedIn] = useState(false); 
  const [username, setUsername] = useState(''); 
  const [notification, setNotification] = useState(''); 
  const [role, setRole] = useState(0); 
  const navigate = useNavigate(); 

  // Function to handle login
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials); // API call to log in
      setLoggedIn(true); // Update authentication state
      setRole(user.role); // Set user's role
      setNotification('Authenticated!'); // Success notification
      setUsername(credentials.username); // Save username
      navigate('/'); // Navigate to the main page
    } catch (err) {
      console.error("Error:", err.message); // Error handling
      if (err.message.includes("Network Error")) {
        setNotification('Network Error!'); // Network error message
      } else if (err.message.includes("401")) {
        setNotification('Username or password incorrect!'); // Incorrect credentials message
      }
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await API.LogOut(); // API call to log out
      setLoggedIn(false); // Reset authentication state
      setUsername(''); // Remove username
      setNotification(''); // Reset notification
      navigate('/Home'); // Navigate to the Home page
    } catch (err) {
      console.error(err); // Error handling
    }
  };

  // Providing the authentication context to child components
  return (
    <AuthContext.Provider value={{ loggedIn, username, role, notification, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Data provider component
function DataProvider({ children }) {
  const { loggedIn } = useAuth(); // Use the authentication context to check if the user is logged in
  const [concertData, setConcertData] = useState([]); // State for concert data
  const [theaterData, setTheaterData] = useState([]); // State for theater data
  const [estimationData, setEstimation] = useState(undefined); // State for estimation data

  // Function to fetch concert data
  const handlegetConcerts = useCallback(async () => {
    const fetchedData = await API.getConcerts(); // API call to fetch concerts
    setConcertData(prevData => {   //Avoid Unnecessary State Updates
      if (JSON.stringify(prevData) !== JSON.stringify(fetchedData)) { 
        return fetchedData; // Update data if it has changed
      }
      return prevData; // Otherwise, keep the current data
    });
  }, [loggedIn]);

  // Function to fetch theater data based on concert ID
  const handleTheater = useCallback(async (concertId) => {
    try {
      const seat = await API.getTheater(concertId); // API call to fetch theater seats
      setTheaterData(seat); // Set theater data
    } catch (error) {
      // Handle errors (could be improved)
    }
  }, [loggedIn]);

  // Function to delete a seat reservation
  const handleDelete = useCallback(async (reservationId) => {
    if (!loggedIn) return; // Prevent execution if not logged in
    try {
      await API.deleteUserSeat(reservationId); // API call to delete a reservation
    } catch (err) {
      throw new Error("Error on Delete a Seat", err); // Error handling
    }
  }, [loggedIn]);

  // Function to add a seat reservation
  const handleAdd = useCallback(async (addSeat) => {
    if (!loggedIn) return; // Prevent execution if not logged in
    try {
      const Seat = await API.addUserSeat(addSeat); // API call to add a seat
    } catch (err) {
      if (err.message.includes("One or more seats are not available")) {
        throw new Error(err); // Error if one or more seats are unavailable
      } else {
        throw new Error("Error on Add a Seat", err); // Handle other errors
      }
    }
  }, [loggedIn]);

  // Function to get an estimation (e.g., discounts) based on a token
  const handleGetEstimation = useCallback(async (token) => {
    if (!loggedIn) return; // Prevent execution if not logged in
    try {
      const discount = await API.getEstimation(token); // API call to get estimation
      setEstimation(discount); // Update state with the fetched estimation
    } catch (err) {
      console.error(err); // Error handling
    }
  }, [loggedIn]);

  // Function to get an authentication token and request an estimation
  const handleGetAuthToken = useCallback(async (data) => {
    if (!loggedIn) return; // Prevent execution if not logged in
    try {
      const token = await API.getAuthToken(data); // API call to get an authentication token
      if (token) {
        handleGetEstimation(token); // Request estimation using the obtained token
      }  
    } catch (err) {
      console.error(err); // Error handling
    }
  }, [handleGetEstimation, loggedIn]);

  // Providing the data context to child components
  return (
    <DataContext.Provider value={{ concertData, theaterData, estimationData, handleTheater, handlegetConcerts, handleDelete, handleAdd, handleGetEstimation, handleGetAuthToken }}>
      {children}
    </DataContext.Provider>
  );
}

// Main application component
function App() {
  return (
    <BrowserRouter> 
      <AuthProvider> 
        <DataProvider> 
          <Routes> 
            <Route path="/" element={<ConcertListPage />} /> 
            <Route path="/theater" element={<TheaterPage />} /> 
            <Route path='/LoginPage' element={<Login_page />} /> 
            <Route path='/Home' element={<Home_page />} /> 
            <Route path='*' element={<Navigate to="/Home" />} />  {/* Redirect to Home for unknown routes */}
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
