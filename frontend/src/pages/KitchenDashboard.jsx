import React from 'react';
import PendingOrderList from '../components/PendingOrderList'; // Use PendingOrderList
import Statistics from '../components/Statistics';
import PastOrderList from '../components/PastOrderList';
import './KitchenDashboard.css'; // Import specific CSS for layout

function KitchenDashboard({ socket, apiUrl }) {
  return (
    <div className="container">
      <h1>Kitchen & Orders</h1>

      {/* New Layout Container */}
      <div className="kitchen-layout">

        {/* Left Panel: Pending Orders */}
        <div className="kitchen-panel left-panel section">
          <h2>Pending Orders</h2>
          {/* Use PendingOrderList */}
          <PendingOrderList socket={socket} apiUrl={apiUrl} />
        </div>

        {/* Right Panel */}
        <div className="kitchen-panel right-panel">
          {/* Right Top: Statistics */}
          <div className="stats-panel section">
            <h2>Statistics</h2>
            <Statistics apiUrl={apiUrl} />
          </div>

          {/* Right Bottom: Past Orders */}
          <div className="past-orders-panel section">
            <h2>Past Orders (Delivered)</h2>
            <PastOrderList socket={socket} apiUrl={apiUrl} />
          </div>
        </div>

      </div> {/* End kitchen-layout */}
    </div>
  );
}

export default KitchenDashboard;