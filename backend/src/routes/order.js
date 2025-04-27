const express = require('express');
const sql = require('../db/db.js');

module.exports = (io) => {
  const router = express.Router();

  // --- REVERTED: Create an order (Back to 'pending' status) ---
  router.post('/orders', async (req, res, next) => {
    const { tableNumber, items } = req.body;
    console.log('Attempting to CREATE order (status: pending):', { tableNumber, items }); // Log pending status
    const tableNumberInt = parseInt(tableNumber, 10);

    // --- Validation (same as before) ---
    if (isNaN(tableNumberInt)) {
      console.error(`Invalid table number format for order: ${tableNumber}`);
      return res.status(400).json({ error: 'Table number must be a valid integer' });
    }
    if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      console.error('Missing required fields for order creation:', { tableNumber, items });
      return res.status(400).json({ error: 'Table number and items array are required' });
    }

    try {
      let createdOrder;
      let orderId;

      await sql.begin(async (sql) => {
        // --- Insert the order with status 'pending' ---
        const orderResult = await sql`
          INSERT INTO public.Orders (table_id, status, order_time)
          VALUES (${tableNumberInt}, 'pending', NOW())
          RETURNING order_id, table_id, order_time, status
        `;
        const newOrderHeader = orderResult[0];
        orderId = newOrderHeader.order_id;
        console.log(`Inserted PENDING order header with ID: ${orderId} for table: ${tableNumberInt}`); // Log pending status

        // Insert order items (same as before)
        const itemInsertPromises = items.map(item => {
          if (!item.itemId || !item.quantity || item.quantity <= 0) {
             throw new Error(`Invalid item data in order: ${JSON.stringify(item)}`);
          }
          console.log(`Inserting item ${item.itemId} (qty: ${item.quantity}) for order ${orderId}`);
          return sql`
            INSERT INTO public.OrderItems (order_id, item_id, quantity)
            VALUES (${orderId}, ${item.itemId}, ${item.quantity})
          `;
        });
        await Promise.all(itemInsertPromises);
        console.log(`Successfully inserted all items for order ${orderId}`);

        // Fetch item details for the event payload (same as before)
        const itemDetailsQuery = await sql`
            SELECT oi.item_id, mi.name, oi.quantity, mi.price
            FROM public.OrderItems oi
            JOIN public.MenuItems mi ON oi.item_id = mi.item_id
            WHERE oi.order_id = ${orderId}
        `;
        createdOrder = {
            ...newOrderHeader,
            items: itemDetailsQuery
        };
      }); // End transaction

      // --- Emit 'newPendingOrder' event ---
      if (createdOrder) {
        io.emit('newPendingOrder', createdOrder); // Notify relevant frontend components
        console.log(`Emitted newPendingOrder event for newly created Order ID: ${createdOrder.order_id}`);
      } else {
         console.error(`Transaction completed but createdOrder details were not captured for Order ID: ${orderId || 'UNKNOWN'}`);
      }

      console.log(`Successfully CREATED PENDING order ${createdOrder?.order_id} for table ${tableNumberInt}`);
      // Return 201 Created status
      res.status(201).json({ message: `Order for table ${tableNumberInt} created successfully with ID ${createdOrder?.order_id}`, order: createdOrder });

    } catch (err) { // --- Error Handling (same as before) ---
        if (err.code === '23503') {
            console.error(`Error creating order: Invalid table number (${tableNumberInt}) or item ID found in items.`, err);
            return res.status(400).json({ error: 'Invalid table number or item ID' });
        }
        if (err.message.startsWith('Invalid item data')) {
            console.error(`Error creating order: ${err.message}`);
            return res.status(400).json({ error: err.message });
        }
        console.error(`Error creating order transaction for table ${tableNumberInt}:`, err);
        next(err);
    }
  });


  // --- GET /orders (Remains the same, filtering is useful) ---
  router.get('/orders', async (req, res, next) => {
    console.log('Attempting to fetch orders...');
    const { status } = req.query;
    let filterCondition = sql``;
    if (status) {
        console.log(`Filtering orders by status: ${status}`);
        filterCondition = sql`WHERE o.status = ${status}`;
    } else {
        console.log('Fetching all orders (no status filter).');
    }
    try {
      const orders = await sql`
        SELECT
          o.order_id, o.table_id AS table_number, o.order_time, o.status, o.delivery_time,
          COALESCE(
            (SELECT json_agg(json_build_object('item_id', oi.item_id, 'quantity', oi.quantity, 'name', mi.name, 'price', mi.price))
             FROM public.OrderItems oi JOIN public.MenuItems mi ON oi.item_id = mi.item_id
             WHERE oi.order_id = o.order_id), '[]'::json ) AS items
        FROM public.Orders o ${filterCondition} ORDER BY o.order_time DESC; `;
      console.log(`Successfully fetched ${orders.length} orders ${status ? `with status ${status}` : ''}.`);
      res.json(orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      next(err);
    }
  });


  // --- REMOVED: Accept a pending order ---
  // router.put('/orders/:orderId/accept', ...);


  // --- REMOVED: Decline a pending order ---
  // router.put('/orders/:orderId/decline', ...);


  // --- MODIFIED: Deliver an order (Acts on 'pending' orders now) ---
  router.put('/orders/:orderId/deliver', async (req, res, next) => {
    const { orderId } = req.params;
    console.log(`Attempting to mark PENDING order ID: ${orderId} as delivered`);
    try {
      const result = await sql`
        UPDATE public.Orders
        SET status = 'delivered', delivery_time = NOW()
        WHERE order_id = ${orderId} AND status = 'pending' -- Changed from 'accepted'
        RETURNING *
      `;
      if (result.count === 0) {
        const checkOrder = await sql`SELECT status FROM public.Orders WHERE order_id = ${orderId}`;
        if (checkOrder.count === 0) {
          console.warn(`Order ID ${orderId} not found for delivery.`);
          return res.status(404).json({ error: 'Order not found' });
        } else if (checkOrder[0].status !== 'pending') { // Check if not pending
           console.warn(`Order ID ${orderId} has status ${checkOrder[0].status}, cannot mark as delivered.`);
           return res.status(409).json({ error: `Order must be in 'pending' status to be delivered (current: ${checkOrder[0].status})` });
        } else {
            console.warn(`Order ID ${orderId} could not be updated to delivered for an unknown reason.`);
            return res.status(500).json({ error: 'Failed to update order status' });
        }
      }
      console.log(`Successfully marked order ID: ${orderId} as delivered.`);
      io.emit('orderDelivered', result[0]); // Notify Past Orders list
      res.json(result[0]);
    } catch (err) {
      console.error(`Error marking order ID ${orderId} as delivered:`, err);
      next(err);
    }
  });

  return router;
};