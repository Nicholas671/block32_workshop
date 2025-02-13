const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const pg = require('pg');
const app = express();
const port = process.env.PG_PORT || 3000;

const client = new pg.Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
});

app.use(express.json());

const init = async () => {
    try {
        await client.connect();
        console.log('Connected to database');
    } catch (err) {
        console.error(err);
    }

    let SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE IF NOT EXISTS flavors (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            is_favorite BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
    await client.query(SQL);
    console.log('Tables created');
    SQL = `
        INSERT INTO flavors (name, is_favorite) VALUES
        ('Vanilla', true),
        ('Chocolate', false),
        ('Strawberry', false),
        ('Mint', true)`;
    await client.query(SQL);
    console.log('Tables seeded');
}

app.get('/api/flavors', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM flavors');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/api/flavors/:id', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM flavors WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            res.status(404).send('Flavor not found');
        } else {
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.post('/api/flavors', async (req, res) => {
    try {
        const { name, is_favorite } = req.body;

        // Validate request body
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const result = await client.query('INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *', [name, is_favorite]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.put('/api/flavors/:id', async (req, res) => {
    try {
        const { name, is_favorite } = req.body;
        const result = await client.query('UPDATE flavors SET name = $1, is_favorite = $2 WHERE id = $3 RETURNING *', [name, is_favorite, req.params.id]);
        if (result.rows.length === 0) {
            res.status(404).send('Flavor not found');
        } else {
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.delete('/api/flavors/:id', async (req, res) => {
    try {
        const result = await client.query('DELETE FROM flavors WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            res.status(404).send('Flavor not found');
        } else {
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

init();