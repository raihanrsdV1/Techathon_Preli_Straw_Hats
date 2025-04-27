import React, { useState } from 'react';
import axios from 'axios';

function TableForm({ onTableAdded, apiUrl }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // No need to send table number in the body anymore
      const response = await axios.post(`${apiUrl}/admin/tables`);
      console.log('Table added:', response.data);
      if (onTableAdded) {
        onTableAdded(); // Trigger refresh in parent
      }
    } catch (err) {
      console.error("Error adding table:", err);
      setError(err.response?.data?.error || 'Failed to add table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      {/* Input field for table number removed */}
      <button type="submit" disabled={loading} className="primary">
        {loading ? 'Adding...' : 'Add Next Table'}
      </button>
    </form>
  );
}

export default TableForm;