//nodemon server.js to start the server with nodemon
// const nodemon = require('nodemon');
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();




app.use(cors({ origin: '*' }));
app.use(express.json());

// Database configuration
const db = {
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "1234",
    port: 5432
};

const dbConnection = new Pool(db);

// Handle unexpected database errors
dbConnection.on('error', (err) => {
    console.error("Unexpected database error:", err);
});

// GET all students
app.get('/students', async (req, res) => {
    try {
        const result = await dbConnection.query(
            "SELECT * FROM students ORDER BY id ASC"
        );

        return res.status(200).json({
            message: "Students fetched successful",
            data: result.rows
        });

    } catch (err) {
        console.error("Error fetching students:", err);

        return res.status(500).json({
            message: "Failed to fetch students"
        });
    }
});

// GET a single student
app.get('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await dbConnection.query(
            "SELECT * FROM students WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        return res.status(200).json({
            message: "Student fetched successful",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("Error fetching student:", err);

        return res.status(500).json({
            message: "Failed to fetch student"
        });
    }
});

// POST a new student
app.post('/students', async (req, res) => {
    try {
        const { name, age, email } = req.body;

        if (!name || age === undefined || age === null || !email) {
            return res.status(400).json({
                message: "Please provide all the required fields"
            });
        }

        const result = await dbConnection.query(
            `INSERT INTO students (name, age, email)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, age, email]
        );

        return res.status(201).json({
            message: "Student created successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("Error inserting student:", err);

        return res.status(500).json({
            message: "Failed to insert student"
        });
    }
});

// Start server only after confirming database connection
async function startServer() {
    try {
        await dbConnection.query('SELECT 1');

        console.log("Database connection established successfully");

        app.listen(3112, () => {
            console.log("Server running on port 3112");
        });

    } catch (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    }
}



// PUT: Update an entire student record
app.put('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, age, email } = req.body;

        if (!name || age === undefined || age === null || !email) {
            return res.status(400).json({
                message: "Please provide all the required fields"
            });
        }

        const result = await dbConnection.query(
            `UPDATE students
             SET name = $1, age = $2, email = $3
             WHERE id = $4
             RETURNING *`,
            [name, age, email, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        return res.status(200).json({
            message: "Student updated successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("Error updating student:", err);

        return res.status(500).json({
            message: "Failed to update student"
        });
    }
});

// PATCH: Update specific student fields
app.patch('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, age, email } = req.body;

        const fields = [];
        const values = [];

        if (name !== undefined) {
            values.push(name);
            fields.push(`name = $${values.length}`);
        }

        if (age !== undefined) {
            values.push(age);
            fields.push(`age = $${values.length}`);
        }

        if (email !== undefined) {
            values.push(email);
            fields.push(`email = $${values.length}`);
        }

        if (fields.length === 0) {
            return res.status(400).json({
                message: "Please provide at least one field to update"
            });
        }

        values.push(id);

        const query = `
            UPDATE students
            SET ${fields.join(', ')}
            WHERE id = $${values.length}
            RETURNING *
        `;

        const result = await dbConnection.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        return res.status(200).json({
            message: "Student updated successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("Error updating student:", err);

        return res.status(500).json({
            message: "Failed to update student"
        });
    }
});


// DELETE: Delete a student
app.delete('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await dbConnection.query(
            "DELETE FROM students WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        return res.status(200).json({
            message: "Student deleted successfully",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("Error deleting student:", err);

        return res.status(500).json({
            message: "Failed to delete student"
        });
    }
});

startServer();