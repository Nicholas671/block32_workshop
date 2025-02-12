const express = require('express');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,

})

client.connect();
console.log('Connected to database');

app.get('/flavors', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM flavors');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})