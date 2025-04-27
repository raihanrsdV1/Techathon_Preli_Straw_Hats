const express = require('express');
const sql = require('../db/db.js');
const router = express.Router();

// GET /api/statistics
router.get('/statistics', async (req, res, next) => {
    console.log('Attempting to fetch statistics (last hour)...');
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // --- MODIFIED: Calculate Average Fulfillment Time (Delivered in last hour) ---
        const avgTimeQuery = await sql`
            SELECT AVG(EXTRACT(EPOCH FROM (delivery_time - order_time)) / 60.0) as average_fulfillment_minutes
            FROM public.Orders
            WHERE status = 'delivered'
              AND delivery_time >= ${oneHourAgo}; -- Filter by delivery time
        `;
        const avgMinutesResult = avgTimeQuery[0]?.average_fulfillment_minutes;
        const averageFulfillmentMinutes = avgMinutesResult === null || avgMinutesResult === undefined
            ? 0
            : parseFloat(avgMinutesResult);

        // --- MODIFIED: Calculate Total Sales (Delivered in last hour) ---
        const totalSalesQuery = await sql`
            SELECT SUM(oi.quantity * mi.price) as total_sales
            FROM public.Orders o
            JOIN public.OrderItems oi ON o.order_id = oi.order_id
            JOIN public.MenuItems mi ON oi.item_id = mi.item_id
            WHERE o.status = 'delivered'
              AND o.delivery_time >= ${oneHourAgo}; -- Filter by delivery time
        `;
        const totalSalesResult = totalSalesQuery[0]?.total_sales;
        const totalSales = totalSalesResult === null || totalSalesResult === undefined
            ? 0
            : parseFloat(totalSalesResult);

        // --- NEW: Get Order Delivery Counts Per Minute (Last Hour) ---
        const deliveryCountsQuery = await sql`
            SELECT
                -- Extract minute from timestamp, ensuring distinct minutes within the hour
                date_trunc('minute', delivery_time) as delivery_minute,
                COUNT(*) as delivery_count
            FROM public.Orders
            WHERE status = 'delivered'
              AND delivery_time >= ${oneHourAgo}
            GROUP BY delivery_minute
            ORDER BY delivery_minute ASC;
        `;
        const deliveryCounts = deliveryCountsQuery.map(row => ({
            minute: row.delivery_minute.toISOString(), // Send as ISO string
            count: parseInt(row.delivery_count, 10)
        }));


        console.log(`Successfully fetched statistics (last hour): Avg Time=${averageFulfillmentMinutes.toFixed(2)} min, Total Sales=$${totalSales.toFixed(2)}, DeliveryPoints=${deliveryCounts.length}`);
        res.json({
            averageFulfillmentMinutesPastHour: parseFloat(averageFulfillmentMinutes.toFixed(2)), // Renamed for clarity
            totalSalesPastHour: parseFloat(totalSales.toFixed(2)), // Renamed for clarity
            deliveriesPerMinutePastHour: deliveryCounts // Added chart data
        });
    } catch (err) {
        console.error('Error fetching statistics:', err);
        next(err);
    }
});

module.exports = router;