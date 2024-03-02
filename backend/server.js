const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const options = {
    key: fs.readFileSync('192.168.1.90-key.pem'),
    cert: fs.readFileSync('192.168.1.90.pem')
};

const appHttps = express();
const appHttp = express();

// Middleware to parse JSON bodies
appHttp.use(bodyParser.json());

// Enable CORS
appHttp.use(cors());

// Handle POST requests to the /decode endpoint
appHttp.post('/decode', (req, res) => {
    const qrCode = req.body.qrCode;

    // Create a SHA256 hash of the QR code
    const hash = crypto.createHash('sha256').update(qrCode).digest('hex');

    // Load the list of already processed ticket IDs
    let hashList;
    try {
        hashList = fs.readFileSync('processed_tickets.csv', 'utf-8').split('\n');
    } catch (err) {
        console.error('Error reading processed_tickets.csv:', err);
        hashList = [];
    }

    // Check if the hash is in the list
    const isHashInList = hashList.includes(hash);

    console.log(`QR Code: ${qrCode}`);
    console.log(`Hash: ${hash}`);
    console.log(`Is hash in list: ${isHashInList}`);

    // Respond with true if the hash is in the list, false otherwise
    res.send(isHashInList.toString());
});

// Serve static files
appHttps.use((req, res, next) => {
    const filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            next();
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
});

https.createServer(options, appHttps).listen(8080, () => {
    console.log(`HTTPS server listening at https://localhost:8080`);
});

// Create an HTTPS server with your app and options
https.createServer(options, appHttp).listen(3000, () => {
    console.log('HTTPS Server running on port 3000');
});