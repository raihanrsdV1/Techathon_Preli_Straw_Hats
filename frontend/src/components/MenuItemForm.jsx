import React, { useState } from 'react';

function MenuItemForm({ handleSubmit, error, name, price, setName, setPrice, availability, setAvailability }) {
  

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