const fs = require('fs').promises;
const path = require('path'); // Import the path module
const sql = require('./db.js');

async function initializeDatabase() {
  try {
    // Construct the absolute path to init.sql
    const initSqlPath = path.join(__dirname, 'init.sql'); 
    // Read the SQL queries from init.sql
    const initSql = await fs.readFile(initSqlPath, 'utf8');

    // Execute the SQL queries
    console.log('Executing database initialization queries...');
    await sql.unsafe(initSql);
    console.log('Database initialized successfully!');

    // Close the connection
    await sql.end();
  } catch (err) {
    console.error('Error initializing database:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    if (err.routine) {
      console.error('Error routine:', err.routine);
    }
    process.exit(1);
  }
}

initializeDatabase();