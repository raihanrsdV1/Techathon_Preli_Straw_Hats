import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Renamed component
function PendingOrderList({ socket, apiUrl }) {
  const [pendingOrders, setPendingOrders] = useState([]); // State holds pending orders
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial PENDING orders
  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/orders?status=pending`); // Fetch pending
      const ordersWithItemsArray = response.data.map(order => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : []
      }));
      // Sort by order time, oldest first
      setPendingOrders(ordersWithItemsArray.sort((a, b) => new Date(a.order_time) - new Date(b.order_time)));
      setError(null);
    } catch (err) {
      console.error("Error fetching pending orders:", err);
      setError("Failed to load pending orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, [apiUrl]);

  // --- Socket Event Listeners ---
  useEffect(() => {
    if (!socket) return;

    // Add newly created pending order
    const handleNewPendingOrder = (newOrder) => {
      console.log('PendingOrderList: Received newPendingOrder event', newOrder);
      const orderToAdd = {
          ...newOrder,
          items: Array.isArray(newOrder.items) ? newOrder.items : []
      };
      setPendingOrders(prev => {
          // Prevent duplicates
          if (prev.some(order => order.order_id === orderToAdd.order_id)) {
              return prev;
          }
          // Add to end and re-sort
          return [...prev, orderToAdd].sort((a, b) => new Date(a.order_time) - new Date(b.order_time));
      });
    };

    // Remove order from pending list when it's delivered
    const handleOrderDelivered = (deliveredOrder) => {
        console.log(`PendingOrderList: Received orderDelivered event for Order ${deliveredOrder.order_id}`);
        setPendingOrders(prev => prev.filter(order => order.order_id !== deliveredOrder.order_id));
    };

    socket.on('newPendingOrder', handleNewPendingOrder);
    socket.on('orderDelivered', handleOrderDelivered); // Listen for delivered event

    // Cleanup listeners
    return () => {
      socket.off('newPendingOrder', handleNewPendingOrder);
      socket.off('orderDelivered', handleOrderDelivered);
    };
  }, [socket]);

  // --- Action Handler ---
  const handleDeliverOrder = async (orderId) => {
    console.log(`PendingOrderList: Delivering order ${orderId}`);
    try {
      await axios.put(`${apiUrl}/orders/${orderId}/deliver`);
      // Removal from list is handled by the 'orderDelivered' socket listener
    } catch (err) {
      console.error(`Error delivering order ${orderId}:`, err);
      alert(`Failed to deliver order: ${err.response?.data?.error || err.message}`);
    }
  };

  // --- Render Logic ---
  if (loading) return <p>Loading pending orders...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    // Use a class that matches the refined CSS, e.g., kitchen-order-list for the container
    <div className="kitchen-order-list">
      {pendingOrders.length === 0 ? (
        <p>No orders currently pending.</p>
      ) : (
        // Use class that matches refined CSS, e.g., kitchen-order-card or pending-card
        pendingOrders.map((order) => (
          <div key={order.order_id} className="order-card pending-card">
            <div> {/* Content wrapper */}
              <h4>Order #{order.order_id} - Table {order.table_number}</h4>
              <p><strong>Status:</strong> <span className={`status-${order.status}`}>{order.status}</span></p>
              <p><strong>Received At:</strong> {new Date(order.order_time).toLocaleString()}</p>
              <h5>Items:</h5>
              {/* Use class that matches refined CSS, e.g., kitchen-order-items or order-items */}
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
            {/* Deliver Button */}
            <div className="order-actions">
              <button
                onClick={() => handleDeliverOrder(order.order_id)}
                className="save" // Use 'save' style for deliver button
              >
                Deliver Order
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default PendingOrderList;