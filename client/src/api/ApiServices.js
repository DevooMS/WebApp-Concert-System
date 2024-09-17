import axios from 'axios';

const APIURL = 'http://localhost:3001';
const APIURL2 = 'http://localhost:3002';
// Configurazione di Axios con le opzioni globali
const API = axios.create({
  baseURL: APIURL,
  withCredentials: true, // Per inviare i cookie durante le richieste (importante per l'autenticazione)
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Header consigliato per prevenire CSRF
  }
});
const API2 = axios.create({
  baseURL: APIURL2,
  withCredentials: true, // Per inviare i cookie durante le richieste (importante per l'autenticazione)
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Header consigliato per prevenire CSRF
  }
});

// Funzioni per chiamate API

const logIn = async (credentials) => {
  try {
    const response = await API.post('/api/sessions', credentials);
    return response.data;
  } catch (error) {
    throw new Error(`An error occurred during login: ${error.message}`, { cause: error });
  }
};



const getConcerts = async () => {
  try {
    const response = await API.get('/api/getConcerts');
    return response.data;
  } catch (error) {
    throw new Error(`An error occurred while fetching initial data: ${error.message}`, { cause: error });
  }
};

const getTheater = async (concertID) => {
  concertID = { concertID: concertID };
  try {
    const response = await API.get('/api/getTheater', { params: concertID }); // Data should be in the params
    return response.data;
  } catch (error) {
    throw new Error(`An error occurred while fetching initial data: ${error.message}`, { cause: error });
  }
};


const addUserSeat = async (sendSeat) => {
  try {
    const response = await API.post('/api/addUserSeat', sendSeat);
    return response.data;
  } catch (error) {
    console.error('Error from backend:', error.response.data.details);
    if (error.response.data.details.includes("One or more seats are not available")) {
      const occupiedSeats = error.response.data.details.match(/Occupied seat IDs: (.*)/)[1];
      throw new Error(`One or more seats are not available: ${occupiedSeats}`);
    } else {
      throw new Error(`An error occurred during concert management: ${error.message}`, { cause: error });
    }
  }
};

const deleteUserSeat = async (reservationId) => {
  try {
    const response = await API.delete(`/api/deleteUserSeat?reservationId=${reservationId}`);
    return response.data;
  } catch (error) {
    throw new Error(`An error occurred during concert management: ${error.message}`, { cause: error });
  }
};



const getAuthToken = async (concertID) => {
  concertID = { concertID: concertID };
  try {
    const response = await API.get('/api/auth-token', { params: concertID });
    return response.data;
  } catch (error) {
    throw new Error(`An error occurred: ${error.message}`, { cause: error });
  }
};

const getEstimation = async (authToken) => {
  //console.log("Attempting to fetch estimation with authToken:", authToken);
  if (!authToken || !authToken.token) {
    console.error("Auth token is missing or invalid");
    return;
  }
  try {
    const response = await API2.post('/api/get-estimation',{}, {
      headers: {
        "Authorization": `Bearer ${authToken.token}`
      }
    });
    //console.log("Response received:", response.data);
    return response.data;
  } catch (error) {
    console.error(`An error occurred while fetching user data: ${error.message}`);
    throw new Error(`An error occurred while fetching user data: ${error.message}`, { cause: error });
  }
};


const LogOut = async () => {
  try {
    const response = await API.delete('/api/sessions/current');
    return response.status === 200; // Ritorna true se il logout è stato eseguito con successo
  } catch (error) {
    throw new Error(`An error occurred during logout: ${error.message}`, { cause: error });
  }
};

// Esportazione delle funzioni API
const APIFunctions = {
  logIn,
  LogOut,
  getConcerts, //OK
  getTheater, //OK
  addUserSeat, //OK
  deleteUserSeat, //OK
  getAuthToken,
  getEstimation,
};

export default APIFunctions;
