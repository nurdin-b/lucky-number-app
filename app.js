require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mysql = require('mysql');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'eventforth',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Define the /listluckynumber route
app.get('/listluckynumber', (req, res) => {
  // Fetch lucky numbers from the database
  db.query('SELECT * FROM tbluckydraw', (err, results) => {
    if (err) {
      console.error('Error fetching lucky numbers:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.render('listluckynumber', { luckyNumbers: results });
    }
  });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // You can add more WebSocket logic here

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Function to fetch and broadcast updated lucky numbers
const fetchAndBroadcastLuckyNumbers = () => {
  db.query('SELECT * FROM tbluckydraw', (err, results) => {
    if (err) {
      console.error('Error fetching lucky numbers:', err);
    } else {
      io.emit('luckyNumbersUpdated', results);
    }
  });
};

// Set up a periodic task to fetch and broadcast updates
setInterval(fetchAndBroadcastLuckyNumbers, 5000); // Fetch every 5 seconds (adjust as needed)

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
