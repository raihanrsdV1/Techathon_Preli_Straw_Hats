import React, { useState } from 'react';
import axios from 'axios';

function MenuItemForm({ onItemAdded }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [availability, setAvailability] = useState(true);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post('http://localhost:3000/api/admin/menu-items', {
        name,
        price: parseFloat(price),
        availability,
      });
      alert('Menu item added successfully!');
      setName('');
      setPrice('');
      setAvailability(true);
      if (onItemAdded) onItemAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add menu item');
    }
  };

  return (
    <div>
      <h3>Add Menu Item</h3>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Price</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Availability</label>
          <input
            type="checkbox"
            checked={availability}
            onChange={(e) => setAvailability(e.target.checked)}
          />
          <span>{availability ? 'Available' : 'Unavailable'}</span>
        </div>
        <button type="submit" className="primary">Add Item</button>
      </form>
    </div>
  );
}

export default MenuItemForm;