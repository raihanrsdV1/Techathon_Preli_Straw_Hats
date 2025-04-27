const express = require('express');
const adminRoutes = require('./admin');
const createOrderRouter = require('./order');
const statisticsRoutes = require('./statistics');
const sql = require('../db/db.js'); // Import sql

module.exports = (io) => {
  const router = express.Router();

  // --- NEW: Public Menu Endpoint for Devices ---
  router.get('/api/menu', async (req, res, next) => {
    console.log('Device fetching available menu...');
    try {
      const availableItems = await sql`
        SELECT item_id, name
        FROM public.MenuItems
        WHERE availability = TRUE
        ORDER BY item_id; -- Or order by name
      `;
      console.log(`Sending ${availableItems.length} available menu items to device.`);
      res.json(availableItems); // Send only id and name
    } catch (err) {
      console.error('Error fetching available menu for device:', err);
      next(err);
    }
  });
  // --- End of New Endpoint ---

  router.use('/api/admin', adminRoutes);
  const orderRouter = createOrderRouter(io);
  router.use('/api', orderRouter); // Mounts /api/notify-order, /api/orders, etc.
  router.use('/api', statisticsRoutes);

  return router;
};