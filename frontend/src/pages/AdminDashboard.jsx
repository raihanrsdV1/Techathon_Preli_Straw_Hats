import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Removed axios as it's not directly used here anymore
import MenuItemForm from '../components/MenuItemForm';
import MenuItemList from '../components/MenuItemList';
import TableForm from '../components/TableForm';
import TableList from '../components/TableList';
// Statistics component is removed from Admin

function AdminDashboard({ apiUrl }) { // Removed socket prop
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [availability, setAvailability] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  // Callback for child components to trigger refresh
  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.post('http://localhost:3000/api/admin/menu-items', {
        name,
        price: parseFloat(price),
        availability,
      });
      console.log(response);
      console.log(response.data);
      // if data isn't null
      if (response.data) {
        setItems(prevItems => [...prevItems, response.data.item]);
      }
      alert('Menu item added successfully!');
      setName('');
      setPrice('');
      setAvailability(true);
    } catch (err) {
      // console.log("Comes here");
      setError(err.response?.data?.error || 'Failed to add menu item');
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/menu-items');
      setItems(response.data);
    } catch (err) {
      setError('Failed to fetch menu items');
    }
  };

  useEffect(() => {
      fetchItems();
    }, []);

  // --- Render ---
  return (
    <div className="container admin-dashboard"> {/* Added class for potential specific styling */}
      <h1>Admin Dashboard</h1>

      {/* Simplified Menu & Table Management using Grid */}
      <div className="section grid"> {/* Use the existing grid class */}
        <div className="grid-item"> {/* Wrap each management section */}
          <h2>Menu Management</h2>
          <MenuItemForm 
            apiUrl={apiUrl} 
            handleSubmit={handleSubmit} 
            error={error} 
            name={name}
            price={price}
            setName={setName}
            setPrice={setPrice}
            availability={availability}
            setAvailability={setAvailability}
          />
          <MenuItemList
             apiUrl={apiUrl}
             // Assuming MenuItemList fetches its own data or uses refreshTrigger
            refreshTrigger={refreshTrigger}
            items={items} 
            setItems={setItems}
           />
        </div>
        <div className="grid-item"> {/* Wrap each management section */}
          <h2>Table Management</h2>
          <TableForm onTableAdded={handleDataUpdate} apiUrl={apiUrl} />
          <TableList
            apiUrl={apiUrl}
            refreshTrigger={refreshTrigger} // Pass trigger to TableList
          />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;