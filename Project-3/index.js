const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');  
const faker = require('faker'); 

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/project-3', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Connect to Redis
const client = new Redis({
    host: '127.0.0.1',
    port: 6379,
});

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

client.once('connect', () => {
    console.log('Connected to Redis');
});

// Define MongoDB schema and model
const Schema = mongoose.Schema;
const BookSchema = new Schema({
    title: String,
    author: String,
});

const Book = mongoose.model('Book', BookSchema);

// Middleware to parse JSON bodies
app.use(express.json());

// Function to insert multiple books
const insertMultipleBooks = async (numBooks) => {
    const books = [];
    for (let i = 0; i < numBooks; i++) {
        const book = {
            title: faker.lorem.sentence(),
            author: faker.name.findName(),
        };
        books.push(book);
    }

    try {
        await Book.insertMany(books);
        await client.del('books');
        console.log(`${numBooks} books inserted successfully!`);
    } catch (error) {
        console.error('Error inserting books:', error);
    }
};

// Route to fetch books and cache results
app.get('/books', async (req, res) => {
    try {
        // Check cache first
        const cachedBooks = await client.get('books');
        console.log("Cached");

        if (cachedBooks) {
            try {
                const books = JSON.parse(cachedBooks);
                console.log('Books fetched from Redis cache');
                res.json(books);
            } catch (err) {
                console.error('Error parsing cachedBooks:', err);
                res.status(500).send('Error parsing cached data');
            }
        } else {
            // Fetch from MongoDB if not in cache
            const books = await Book.find();
            if (books.length === 0) return res.status(404).send('No Books Available.');
            console.log('Books fetched from MongoDB');

            // Store in Redis cache with expiry (1 hour)
            await client.set('books', JSON.stringify(books), 'EX', 3600);

            res.json(books);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Route to add a new book
app.post('/books', async (req, res) => {
    try {
        const { title, author } = req.body;

        // Create a new Book instance
        const newBook = new Book({
            title,
            author,
        });

        // Save the book to MongoDB
        const savedBook = await newBook.save();
        console.log('New book saved:', savedBook);

        // Clear Redis cache since data has changed
        await client.del('books');

        res.status(201).json(savedBook);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

insertMultipleBooks(1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

