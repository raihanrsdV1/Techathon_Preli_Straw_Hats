import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PastOrderList({ socket, apiUrl }) {
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial delivered orders
  const fetchDeliveredOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/orders?status=delivered`);
      const ordersWithItemsArray = response.data.map(order => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : []
      }));
      // Sort by delivery time, newest first
      setDeliveredOrders(ordersWithItemsArray.sort((a, b) => new Date(b.delivery_time) - new Date(a.delivery_time)));
      setError(null);
    } catch (err) {
      console.error("Error fetching delivered orders:", err);
      setError("Failed to load past orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveredOrders();
  }, [apiUrl]);

  // --- Socket Event Listener ---
  useEffect(() => {
    if (!socket) return;

    // Add newly delivered order to the top of the list
    const handleOrderDelivered = (newlyDeliveredOrder) => {
      console.log('PastOrderList: Received orderDelivered event', newlyDeliveredOrder);
      const orderToAdd = {
          ...newlyDeliveredOrder,
          items: Array.isArray(newlyDeliveredOrder.items) ? newlyDeliveredOrder.items : []
      };
      setDeliveredOrders(prev => {
          // Prevent duplicates
          if (prev.some(order => order.order_id === orderToAdd.order_id)) {
              return prev;
          }
          // Add to start of array and re-sort (or just prepend if always newest)
          return [orderToAdd, ...prev].sort((a, b) => new Date(b.delivery_time) - new Date(a.delivery_time));
      });
    };

    socket.on('orderDelivered', handleOrderDelivered);

    // Cleanup listener
    return () => {
      socket.off('orderDelivered', handleOrderDelivered);
    };
  }, [socket]);


  // --- Render Logic ---
  if (loading) return <p>Loading past orders...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="past-order-list"> {/* Container class */}
      {deliveredOrders.length === 0 ? (
        <p>No past orders found.</p>
      ) : (
        // Use class that matches refined CSS, e.g., order-card delivered-card
        deliveredOrders.map((order) => (
          <div key={order.order_id} className="order-card delivered-card">
            <div> {/* Content wrapper */}
              <h4>Order #{order.order_id} - Table {order.table_number}</h4>
              <p><strong>Status:</strong> <span className={`status-${order.status}`}>{order.status}</span></p>
              <p><strong>Ordered At:</strong> {new Date(order.order_time).toLocaleString()}</p>
              <p><strong>Delivered At:</strong> {new Date(order.delivery_time).toLocaleString()}</p>

              <h5>Items:</h5>
              {/* Use class that matches refined CSS, e.g., order-items */}
              {order.items.length > 0 ? (
                <ul className="order-items">
                  {order.items.map((item, index) => (
                    <li key={`${order.order_id}-${item.item_id}-${index}`}>
                      <strong>{item.name || `Item ID ${item.item_id}`}</strong> (x{item.quantity})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No items listed.</p>
              )}
            </div>
            {/* No actions needed for delivered orders */}
          </div>
        ))
      )}
    </div>
  );
}

export default PastOrderList;