import React, { useState, useEffect } from 'react';
import { Nav, Navbar, NavDropdown, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import logo from '../assets/img/logo192.png';

import { useAuth } from '../App'; // Adjust the import path accordingly

const MyNavbar = () => {
  const [showElement, setShowElement] = useState(false);
  const { loggedIn, username, logout, role } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    setShowElement(loggedIn); // This will handle showing or hiding elements based on login status
  }, [loggedIn, username]); // Add username as a dependency if you plan to display or use it

  const getRoleLabel = (role) => {
    if (role === 0) return "User";
    if (role === 1) return "VIP";
    return "User"; // Default case for any other role value
  };

  const userShow = () => {
    if (showElement) {
      return (
        <Nav className='fw-bold'>
          <NavDropdown style={{ width: '3w' }} title={username || "User"} id='my-nav'>
            <NavDropdown.Header>Role: {getRoleLabel(role)}</NavDropdown.Header>
            <NavDropdown.Divider />
            <NavDropdown.Item
              href='#'
              className="bi bi-box-arrow-left"
              onClick={() => {
                logout();
                navigate('/'); // Redirect to Home after logging out
              }}
            >
              Esci
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      );
    } else {
      return (
        <Navbar.Text>
          <Nav.Link as={Link} to={'/LoginPage'}>
            <Navbar.Text className='fw-bold'>Sign In Here </Navbar.Text> Login
          </Nav.Link>
        </Navbar.Text>
      );
    }
  };

  return (
    <Navbar className='navbar' variant='dark' bg='dark' expand='md'>
      <Container>
        <Navbar.Brand href='#'>
          <img
            src={logo}
            height='30'
            width='30'
            className='d-inline-block align-top'
            alt='Logo'
          />
          &nbsp;
          Project by MING
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id='my-nav'>
          <Nav className='me-auto fw-bold'>
            <Nav.Link as={Link} to={'/'}>Concert</Nav.Link>
          </Nav>
          {userShow()}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MyNavbar;
