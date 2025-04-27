import React, { useState, useEffect } from 'react';
import axios from 'axios';

function OrderList({ apiUrl, refreshTrigger }) { // Receive apiUrl and refreshTrigger
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    // setLoading(true); // Optional: show loading state on each refresh
    try {
      const response = await axios.get(`${apiUrl}/orders`); // Use apiUrl prop
      // Ensure items is always an array, even if backend sends null/undefined
      const ordersWithItemsArray = response.data.map(order => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : []
      }));
      setOrders(ordersWithItemsArray);
      setError(null); // Clear previous errors on success
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again later."); // User-friendly error
    } finally {
      setLoading(false);
    }
  };

  // Effect for initial fetch and interval refresh
  useEffect(() => {
    fetchOrders(); // Initial fetch

    // Set up interval to refresh orders every 30 seconds
    const intervalId = setInterval(fetchOrders, 30000); // 30000 ms = 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [apiUrl]); // Depend on apiUrl (though unlikely to change)

  // Effect to refresh when the parent trigger changes (e.g., after notification)
  useEffect(() => {
    if (refreshTrigger > 0) { // Check if trigger has been activated
        console.log("OrderList: Refresh triggered by parent.");
        fetchOrders();
    }
  }, [refreshTrigger]); // Depend on the trigger from parent

  const handleAcceptOrder = async (orderId) => {
    try {
      await axios.put(`${apiUrl}/orders/${orderId}/accept`);
      fetchOrders(); // Refresh list immediately after action
    } catch (err) {
      console.error("Error accepting order:", err);
      // Display specific error from backend if available
      alert(`Failed to accept order: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeclineOrder = async (orderId) => {
    try {
      await axios.put(`${apiUrl}/orders/${orderId}/decline`);
      fetchOrders(); // Refresh list immediately after action
    } catch (err) {
      console.error("Error declining order:", err);
       alert(`Failed to decline order: ${err.response?.data?.error || err.message}`);
    }
  };

  // --- Render Logic ---
  if (loading) return <p>Loading orders...</p>;
  if (error) return <p className="error">{error}</p>; // Use an error class for styling
  if (orders.length === 0) return <p>No orders found.</p>;

  return (
    <div className="order-list">
      {orders.map((order) => (
        <div key={order.order_id} className="order-card">
          {/* Use table_number from backend response */}
          <h4>Order #{order.order_id} - Table {order.table_number}</h4>
          <p>Status: <span className={`status-${order.status}`}>{order.status}</span></p>
          <p>Time: {new Date(order.order_time).toLocaleString()}</p>
          {/* Use delivery_time from backend response */}
          {order.delivery_time && <p>Fulfilled: {new Date(order.delivery_time).toLocaleString()}</p>}

          <h5>Items:</h5>
          {order.items.length > 0 ? (
            <ul className="order-items-list">
              {order.items.map((item, index) => (
                // Use a more robust key if possible, index is fallback
                <li key={`${order.order_id}-${item.item_id}-${index}`}>
                  {item.name} (x{item.quantity})
                  {/* Display price if available */}
                  {item.price != null ? ` - $${item.price.toFixed(2)} each` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items listed for this order.</p>
          )}

          {/* Action Buttons for Pending Orders */}
          {order.status === 'pending' && (
            <div className="order-actions">
              {/* Use 'save' class for Accept, 'delete' for Decline */}
              <button onClick={() => handleAcceptOrder(order.order_id)} className="save">Accept</button>
              <button onClick={() => handleDeclineOrder(order.order_id)} className="delete">Decline</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default OrderList;