const express = require('express');
const sql = require('../db/db.js');
const router = express.Router();

// --- Menu Item Routes ---

// GET /api/admin/menu-items
router.get('/menu-items', async (req, res, next) => {
    console.log('Fetching all menu items for admin...');
    try {
        const menuItems = await sql`
            SELECT item_id, name, price, availability
            FROM public.MenuItems
            ORDER BY item_id ASC
        `;
        console.log(`Successfully fetched ${menuItems.length} menu items.`);
        res.json(menuItems);
    } catch (err) {
        console.error('Error fetching menu items:', err);
        next(err);
    }
});

// POST /api/admin/menu-items
router.post('/menu-items', async (req, res, next) => {
    const { name, price, availability } = req.body;
    console.log('Attempting to add menu item:', { name, price, availability });

    // Basic Validation
    if (!name || price === undefined || price === null || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        console.error('Invalid data for adding menu item:', req.body);
        return res.status(400).json({ error: 'Invalid input: Name and a non-negative price are required.' });
    }
    const isAvailable = availability === undefined ? true : Boolean(availability); // Default to true if not provided

    try {
        const result = await sql`
            INSERT INTO public.MenuItems (name, price, availability)
            VALUES (${name}, ${parseFloat(price)}, ${isAvailable})
            RETURNING item_id, name, price, availability
        `;
        console.log(`Successfully added menu item ID: ${result[0].item_id}`);
        res.status(201).json({item: result[0]}); // Return the newly created item
    } catch (err) {
        console.error('Error adding menu item:', err);
        next(err);
    }
});

// PUT /api/admin/menu-items/:itemId
router.put('/menu-items/:itemId', async (req, res, next) => {
    const { itemId } = req.params;
    const { name, price, availability } = req.body;
    console.log(`Attempting to update menu item ID ${itemId}:`, { name, price, availability });
    const itemIdInt = parseInt(itemId, 10);

    if (isNaN(itemIdInt)) {
        return res.status(400).json({ error: 'Invalid item ID format' });
    }

    // Basic Validation for provided fields
    if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
        return res.status(400).json({ error: 'Invalid input: Price must be a non-negative number.' });
    }
    if (name !== undefined && typeof name !== 'string') {
         return res.status(400).json({ error: 'Invalid input: Name must be a string.' });
    }

    try {
        // Build the update query dynamically based on provided fields
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (price !== undefined) updates.price = parseFloat(price);
        if (availability !== undefined) updates.availability = Boolean(availability);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No update fields provided.' });
        }

        const result = await sql`
            UPDATE public.MenuItems
            SET ${sql(updates)}
            WHERE item_id = ${itemIdInt}
            RETURNING item_id, name, price, availability
        `;

        if (result.count === 0) {
            console.warn(`Menu item ID ${itemIdInt} not found for update.`);
            return res.status(404).json({ error: 'Menu item not found' });
        }

        console.log(`Successfully updated menu item ID: ${result[0].item_id}`);
        res.json(result[0]); // Return the updated item
    } catch (err) {
        console.error(`Error updating menu item ID ${itemIdInt}:`, err);
        next(err);
    }
});

// DELETE /api/admin/menu-items/:itemId
router.delete('/menu-items/:itemId', async (req, res, next) => {
    const { itemId } = req.params;
    console.log(`Attempting to delete menu item ID: ${itemId}`);
    const itemIdInt = parseInt(itemId, 10);

    if (isNaN(itemIdInt)) {
        return res.status(400).json({ error: 'Invalid item ID format' });
    }

    try {
        const result = await sql`
            DELETE FROM public.MenuItems
            WHERE item_id = ${itemIdInt}
            RETURNING item_id
        `;

        if (result.count === 0) {
            console.warn(`Menu item ID ${itemIdInt} not found for deletion.`);
            return res.status(404).json({ error: 'Menu item not found' });
        }

        console.log(`Successfully deleted menu item ID: ${result[0].item_id}`);
        res.status(200).json({ message: `Menu item ${result[0].item_id} deleted successfully`, deletedItemId: result[0].item_id });
    } catch (err) {
         // Handle potential foreign key constraints if order items reference the menu item
        if (err.code === '23503') { // foreign_key_violation
            console.error(`Error deleting menu item ${itemIdInt}: It might be referenced by existing orders.`, err);
            return res.status(409).json({ error: `Cannot delete menu item ${itemIdInt} as it may be part of existing orders.` });
        }
        console.error(`Error deleting menu item ID ${itemIdInt}:`, err);
        next(err);
    }
});


// --- Table Routes (Modified - Keep as is) ---

// GET /api/admin/tables
router.get('/tables', async (req, res, next) => {
    console.log('Fetching all tables for admin...');
    try {
        const tables = await sql`SELECT table_no FROM public.Tables ORDER BY table_no ASC`;
        console.log(`Successfully fetched ${tables.length} tables.`);
        res.json(tables);
    } catch (err) {
        console.error('Error fetching tables:', err);
        next(err);
    }
});

// POST /api/admin/tables (Auto-increment logic)
router.post('/tables', async (req, res, next) => {
    console.log('Attempting to add a new table automatically...');
    try {
        const maxTableResult = await sql`SELECT MAX(table_no) as max_num FROM public.Tables`;
        const nextTableNumber = (maxTableResult[0]?.max_num || 0) + 1;
        console.log(`Determined next table number: ${nextTableNumber}`);
        const result = await sql`
            INSERT INTO public.Tables (table_no)
            VALUES (${nextTableNumber})
            RETURNING table_no
        `;
        console.log(`Successfully added table number ${result[0].table_no}`);
        res.status(201).json(result[0]);
    } catch (err) {
        if (err.code === '23505') {
             console.error(`Error adding table: Table number ${err.detail?.match(/\((\d+)\)/)?.[1] || 'unknown'} likely already exists.`, err);
             return res.status(409).json({ error: 'Table number conflict, please try again.' });
        }
        console.error('Error adding new table:', err);
        next(err);
    }
});


// DELETE /api/admin/tables/last
router.delete('/tables/last', async (req, res, next) => {
    console.log('Attempting to delete the last (highest numbered) table...');
    try {
        const maxTableResult = await sql`SELECT MAX(table_no) as max_num FROM public.Tables`;
        const lastTableNumber = maxTableResult[0]?.max_num;
        if (lastTableNumber === null || lastTableNumber === undefined) {
            console.log('No tables found to delete.');
            return res.status(404).json({ error: 'No tables exist to delete' });
        }
        console.log(`Attempting to delete table number: ${lastTableNumber}`);
        const result = await sql`
            DELETE FROM public.Tables
            WHERE table_no = ${lastTableNumber}
            RETURNING table_no
        `;
        if (result.count === 0) {
            console.warn(`Could not find table number ${lastTableNumber} to delete.`);
            return res.status(404).json({ error: `Table ${lastTableNumber} not found.` });
        }
        console.log(`Successfully deleted table number ${result[0].table_no}`);
        res.status(200).json({ message: `Table ${result[0].table_no} deleted successfully`, deletedTableNo: result[0].table_no });
    } catch (err) {
        if (err.code === '23503') {
            console.error(`Error deleting last table: Table ${lastTableNumber} might have associated orders.`, err);
            return res.status(409).json({ error: `Cannot delete table ${lastTableNumber} as it may have existing orders associated with it.` });
        }
        console.error('Error deleting last table:', err);
        next(err);
    }
});


module.exports = router;