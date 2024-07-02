const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/auth_demo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once('open', () => {
  console.log('Connected to MongoDB');
});


const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);


app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create a new user
  const newUser = new User({
    username,
    password: hashedPassword,
  });

  await newUser.save();
  res.status(201).json({ message: 'User registered successfully' });
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Validate password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user._id }, 'secretkey', { expiresIn: '1h' });

  res.json({ token });
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, 'secretkey', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    req.user = user;
    next();
  });
}

// Protected route example
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Profile accessed successfully', user: req.user });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
