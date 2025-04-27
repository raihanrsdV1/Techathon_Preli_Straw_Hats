// test/test-db-connection.js
const sql = require('../src/db/db.js');

async function testConnection() {
  try {
    // Test the connection by running a simple query
    const result = await sql`SELECT NOW()`;
    console.log('Successfully connected to Supabase PostgreSQL database!');
    console.log('Current timestamp from database:', result[0].now);

    // Close the connection
    await sql.end();
  } catch (err) {
    console.error('Error connecting to the database:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    if (err.routine) {
      console.error('Error routine:', err.routine);
    }
  }
}

testConnection();