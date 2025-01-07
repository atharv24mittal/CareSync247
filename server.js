const express = require('express'); //middleware
const mongoose = require('mongoose'); //for client-server connection 
const multer = require('multer'); //middleware for uploads
const cors = require('cors'); //cross origin, so that webserver can be req from other domains
const nodemailer = require('nodemailer'); //for mailing purposes
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); //to encrypt password for privacy  purpose
const authRoutes = require('./routes/auth'); //tp handle authentication and authorization
const User = require('./models/User');
require('dotenv').config(); // To load environment variables from a .env file

const app = express();

const Message = require('./models/Message'); // A Mongoose model for storing messages

app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    try {
        const newMessage = new Message({ name, email, message });
        await newMessage.save();

        res.status(200).json({ message: 'Message saved successfully' });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Failed to save message' });
    }
});


// Middlewares
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use('/upload', express.static(path.join(__dirname, 'my-new-app', 'upload')));

const uploadPath = path.join(__dirname, 'my-new-app', 'upload');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
// Config multer
const storage = multer.diskStorage({ //to store uploaded files
  destination: (req, file, cb) => {
      cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9); // to make files unique
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage,
  // limits: { fileSize: 5 *1024*1024 }, // 5MB limit
 });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  console.log('File uploaded:', req.file);
  res.status(200).json({
    message: 'File uploaded successfully',
    filePath: `/my-new-app/upload/${req.file.filename}`,
  });
});

// Nodemailer Transporter (use environment variables for security)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Use environment variable
    pass: process.env.EMAIL_PASS, // Use environment variable
  },
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes for http POST requests
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('File upload request received:', req.file);
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(200).json({ 
    message: 'File uploaded successfully', 
    filePath: `/uploads/${req.file.filename}`
  });
});

app.use('/api/auth', authRoutes); // Backend API for authentication

//sign-up
app.post('/api/auth/signup', async (req, res) => {
  const { email, name, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists. Please log in.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(200).json({ message: 'Signup successful. Please log in.' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});


//contact-us
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
      const newMessage = new Message({ name, email, message });
      await newMessage.save();

      res.status(201).json({ message: 'Your message has been sent successfully!' });
  } catch (error) {
      console.error('Error saving message:', error);
      res.status(500).json({ message: 'Failed to send the message. Please try again.' });
  }
});


// Serve static files from React build directory
app.use(express.static(path.join(__dirname, 'build')));

// React app fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error Logging Middleware (for debugging)
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// Uncaught Exception Handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Exit to avoid inconsistent state
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
