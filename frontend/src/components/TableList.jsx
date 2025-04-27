import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TableList({ apiUrl, refreshTrigger }) {
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false); // Loading state for delete

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/admin/tables`);
      setTables(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tables');
      console.error("Error fetching tables:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when apiUrl changes
  useEffect(() => {
    fetchTables();
  }, [apiUrl]);

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("TableList: Refresh triggered.");
      fetchTables();
    }
  }, [refreshTrigger]); // Dependency array includes refreshTrigger

  // Handler for removing the last table
  const handleRemoveLastTable = async () => {
    if (!tables || tables.length === 0) {
        alert("No tables to remove.");
        return;
    }
    // Optional: Confirm before deleting
    if (!window.confirm(`Are you sure you want to remove the last table (Table ${tables[tables.length - 1]?.table_no})?`)) {
        return;
    }

    setDeleteLoading(true);
    setError(null); // Clear previous errors
    try {
        const response = await axios.delete(`${apiUrl}/admin/tables/last`);
        console.log('Table removed:', response.data);
        // Trigger refetch after successful deletion by calling fetchTables directly
        // Or rely on parent triggering refresh via onTableRemoved callback if needed
        fetchTables();
    } catch (err) {
        console.error("Error removing last table:", err);
        setError(err.response?.data?.error || 'Failed to remove table');
    } finally {
        setDeleteLoading(false);
    }
  };


  return (
    <div>
      {/* Button to remove last table */}
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-end' }}>
         <button
            onClick={handleRemoveLastTable}
            disabled={deleteLoading || loading || tables.length === 0} // Disable if loading or no tables
            className="delete small" // Use small delete button style
         >
            {deleteLoading ? 'Removing...' : 'Remove Last Table'}
         </button>
      </div>

      {/* Display loading/error/table list */}
      {loading && <p>Loading tables...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && tables.length === 0 ? (
        <p>No tables available.</p>
      ) : !loading && (
        <table>
           <thead>
             <tr>
               <th>Table Number</th>
             </tr>
           </thead>
           <tbody>
            {tables.map((table) => (
              <tr key={table.table_no}>
                <td>{table.table_no}</td>
              </tr>
            ))}
           </tbody>
        </table>
      )}
    </div>
  );
}

export default TableList;