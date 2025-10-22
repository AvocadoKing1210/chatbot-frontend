const { Pool } = require('pg');

// Your connection string
const connectionString = 'postgresql://postgres.lyevmzsrlaxlbgtlbxww:981210luA!@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

console.log('Testing connection to:', connectionString.replace(/:[^:@]*@/, ':***@'));

async function testConnection() {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 15000, // 15 seconds
    idleTimeoutMillis: 30000,
    max: 1,
  });

  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    
    try {
      console.log('✅ Connection successful!');
      
      // Test basic query
      const result = await client.query('SELECT version()');
      console.log('Database version:', result.rows[0].version);
      
      // Test current time
      const timeResult = await client.query('SELECT NOW()');
      console.log('Current database time:', timeResult.rows[0].now);
      
      // Test table count
      const tableResult = await client.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log('Tables in public schema:', tableResult.rows[0].table_count);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code) {
      switch (error.code) {
        case 'ECONNREFUSED':
          console.error('💡 The connection was refused. Check if the server is running.');
          break;
        case 'ETIMEDOUT':
          console.error('💡 Connection timed out. Check network connectivity and firewall.');
          break;
        case 'ENOTFOUND':
          console.error('💡 Host not found. Check the hostname.');
          break;
        case '28P01':
          console.error('💡 Authentication failed. Check username/password.');
          break;
        case '3D000':
          console.error('💡 Database does not exist.');
          break;
        default:
          console.error('💡 Unknown error code:', error.code);
      }
    }
  } finally {
    await pool.end();
  }
}

testConnection().catch(console.error);
