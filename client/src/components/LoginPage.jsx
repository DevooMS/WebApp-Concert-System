import React, { useState } from 'react';
import { Col, Button, Row, Container, Card, Form } from "react-bootstrap"; // Import Bootstrap components
import { useAuth } from '../App'; // Import custom hook for authentication
import MyNavbar from './Navbar'; // Import the Navbar component
// The LoginForm component handles user authentication
const LoginPage = () => {
  // Local state for storing username and password input
  const [username, setUsername] = useState('user1');
  const [password, setPassword] = useState("pwd"); // Default value set for demonstration; typically should be empty
  const { login, notification } = useAuth(); // Extract login function and notification from useAuth hook

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    const credentials = { username, password }; // Create credentials object
    await login(credentials); // Call login function with the credentials
  };


  return (
    <>
    <MyNavbar/>
    <Container>
      
      <Row className="mt-5 d-flex justify-content-center align-items-center">
        <Col md={8} lg={6} xs={12}>
          <Card className="shadow">
            <Card.Body>
              <h2 className="fw-bold mb-2 text-uppercase">Login</h2>
              <p style={{ color: 'red' }}>{notification}</p>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label>Username:</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={username}
                    onChange={(ev) => setUsername(ev.target.value)}
                    placeholder="Enter username"
                    required />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>Password:</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    placeholder="Password"
                    required />
                </Form.Group>
                
                <Button variant="primary" type="submit" className="w-100">
                  Login
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </>
  );
};

export default LoginPage;
