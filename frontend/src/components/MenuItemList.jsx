import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './components.css'

function MenuItemList({items, setItems}) {

  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editAvailability, setEditAvailability] = useState(true);
  const [error, setError] = useState(null);


  const handleEdit = (item) => {
    setEditingItem(item.item_id);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditAvailability(item.availability);
  };

  const handleUpdate = async (itemId) => {
    setError(null);
    try {
      await axios.put(`http://localhost:3000/api/admin/menu-items/${itemId}`, {
        name: editName,
        price: parseFloat(editPrice),
        availability: editAvailability,
      });
      alert('Menu item updated successfully!');
      setEditingItem(null);
      // fetchItems();
      setItems((prevItems) => prevItems.map(item => item.item_id === itemId ? { ...item, name: editName, price: parseFloat(editPrice), availability: editAvailability } : item));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update menu item');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setError(null);
    try {
      await axios.delete(`http://localhost:3000/api/admin/menu-items/${itemId}`);
      alert('Menu item deleted successfully!');
      // fetchItems();
      setItems((prevItems) => prevItems.filter(item => item.item_id !== itemId));

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete menu item');
    }
  };

  return (
    <div>
      <h3>Menu Items</h3>
      {error && <p className="error">{error}</p>}
      {items.length === 0 ? (
        <p>No menu items available.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.item_id}>
              {editingItem === item.item_id ? (
                <div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                  <input
                    type="checkbox"
                    checked={editAvailability}
                    onChange={(e) => setEditAvailability(e.target.checked)}
                  />
                  <span>{editAvailability ? 'Available' : 'Unavailable'}</span>
                  <button onClick={() => handleUpdate(item.item_id)} className="save">Save</button>
                  <button onClick={() => setEditingItem(null)} className="cancel">Cancel</button>
                </div>
              ) : (
                <div>
                  <span>{item.name} - ${item.price} - {item.availability ? 'Available' : 'Unavailable'}</span>
                  <div>
                    <button onClick={() => handleEdit(item)} className="edit">Edit</button>
                    <button onClick={() => handleDelete(item.item_id)} className="delete">Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MenuItemList;