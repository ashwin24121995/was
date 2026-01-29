import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [tables] = await connection.query('SHOW TABLES');
console.log('Existing tables:', tables);
await connection.end();
