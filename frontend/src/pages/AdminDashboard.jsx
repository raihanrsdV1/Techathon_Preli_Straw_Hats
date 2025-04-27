import React, { useState } from 'react';
// Removed axios as it's not directly used here anymore
import MenuItemForm from '../components/MenuItemForm';
import MenuItemList from '../components/MenuItemList';
import TableForm from '../components/TableForm';
import TableList from '../components/TableList';
// Statistics component is removed from Admin

function AdminDashboard({ apiUrl }) { // Removed socket prop
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Callback for child components to trigger refresh
  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // --- Render ---
  return (
    <div className="container admin-dashboard"> {/* Added class for potential specific styling */}
      <h1>Admin Dashboard</h1>

      {/* Simplified Menu & Table Management using Grid */}
      <div className="section grid"> {/* Use the existing grid class */}
        <div className="grid-item"> {/* Wrap each management section */}
          <h2>Menu Management</h2>
          <MenuItemForm onItemAdded={handleDataUpdate} apiUrl={apiUrl} />
          <MenuItemList
             apiUrl={apiUrl}
             // Assuming MenuItemList fetches its own data or uses refreshTrigger
             refreshTrigger={refreshTrigger}
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