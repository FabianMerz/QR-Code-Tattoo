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

function logMessage(message) {
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
    const logMessage = `${formattedTime}: ${message}\n`;
    fs.appendFileSync('server.log', logMessage);
}

try {
    fs.unlinkSync('server.log');
    logMessage('Log file cleared');
} catch (err) {
    logMessage('Error clearing log file: ' + err);

}

appHttp.post('/decode', (req, res) => {
    const qrCode = req.body.qrCode;
    const hash = crypto.createHash('sha256').update(qrCode).digest('hex');

    let checkedHashList;
    try {
        const checkedTicketsData = fs.readFileSync('checked_tickets.csv', 'utf-8');
        checkedHashList = checkedTicketsData.split('\n').map(line => line.split(','));
    } catch (err) {
        logMessage('Error reading checked_tickets.csv: ' + err);
        checkedHashList = [];
    }

    const checkedTicket = checkedHashList.find(line => line[0] === hash);

    if (checkedTicket) {
        const checkedDate = checkedTicket[1];
        const checkedTime = checkedTicket[2];
        logMessage(`Ticket already checked on ${checkedDate} at ${checkedTime}`);
        res.json({ status: "alreadyChecked", checkedDate, checkedTime });
    } else {
        let processedHashList;
        try {
            processedHashList = fs.readFileSync('processed_tickets.csv', 'utf-8').split('\n');
        } catch (err) {
            logMessage('Error reading processed_tickets.csv: ' + err);
            processedHashList = [];
        }

        const isHashInProcessedList = processedHashList.includes(hash);

        logMessage(`QR Code: ${qrCode}`);
        logMessage(`Hash: ${hash}`);
        logMessage(`Is hash in processed list: ${isHashInProcessedList}`);

        if (isHashInProcessedList) {
            const currentTime = new Date();
            const formattedTime = currentTime.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
            fs.appendFileSync('checked_tickets.csv', `${hash},${formattedTime}\n`);
            res.send("true");
        } else {
            res.send("false");
        }
    }
});

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
    logMessage(`HTTPS server listening at https://localhost:8080`);
});

https.createServer(options, appHttp).listen(3000, () => {
    logMessage('HTTPS Server running on port 3000');
});