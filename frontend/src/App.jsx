import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, NavLink } from 'react-router-dom'; // Import NavLink
import io from 'socket.io-client';
import AdminDashboard from './pages/AdminDashboard';
import KitchenDashboard from './pages/KitchenDashboard'; // Import the new page
import './App.css';
import './index.css';

const BACKEND_URL = 'http://localhost:3000';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // Track connection status

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5, // Optional: Limit reconnection attempts
        reconnectionDelay: 1000, // Optional: Delay between attempts
    });
    setSocket(newSocket);
    console.log('Attempting to connect socket...');

    newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true); // Update connection status
    });

    newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false); // Update connection status
        if (reason === 'io server disconnect') {
          // The server intentionally disconnected the socket
          newSocket.connect(); // Attempt to reconnect manually if needed
        }
        // else the socket will automatically try to reconnect based on options
    });

    newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false); // Update connection status
    });

    // Add listeners for new backend events
    newSocket.on('orderAccepted', (order) => console.log('Global listener: Order Accepted', order.order_id));
    newSocket.on('orderDeclined', (order) => console.log('Global listener: Order Declined', order.order_id));
    newSocket.on('orderDelivered', (order) => console.log('Global listener: Order Delivered', order.order_id));


    return () => {
      console.log('Disconnecting socket...');
      // Remove specific listeners if added globally, otherwise just disconnect
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('orderAccepted');
      newSocket.off('orderDeclined');
      newSocket.off('orderDelivered');
      newSocket.disconnect();
    };
  }, []);

  return (
    <Router>
      <div>
        {/* Improved Navbar with NavLink for active styling */}
        <nav className="navbar">
          <div className="navbar-brand">Bistro92</div>
          <div className="navbar-links">
            {/* Use NavLink for active class styling */}
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Admin
            </NavLink>
            <NavLink
              to="/kitchen"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Kitchen Queue
            </NavLink>
          </div>
           {/* Connection Status Indicator */}
           <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
             {isConnected ? '● Connected' : '○ Disconnected'}
           </div>
        </nav>

        <Routes>
          {/* Pass socket and API URL to both dashboards */}
          <Route path="/admin" element={<AdminDashboard socket={socket} apiUrl={BACKEND_URL + '/api'} />} />
          <Route path="/kitchen" element={<KitchenDashboard socket={socket} apiUrl={BACKEND_URL + '/api'} />} />
          {/* Optional: Redirect base path or add a home page */}
          <Route path="/" element={<AdminDashboard socket={socket} apiUrl={BACKEND_URL + '/api'} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;