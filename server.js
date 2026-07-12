const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const CryptoJS = require('crypto-js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// This serves the HTML directly from this file, 
// so we don't have to worry about 'public' folder issues on Railway.
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Encrypted Chat</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
        #messages { list-style: none; padding: 10px; background: white; height: 300px; overflow-y: auto; border: 1px solid #ccc; margin-bottom: 10px; }
        .controls { display: flex; gap: 5px; }
        input { padding: 10px; }
    </style>
</head>
<body>
    <h2>🔐 Encrypted Chat</h2>
    <input type="text" id="key" placeholder="Secret Key" value="my-secret">
    <ul id="messages"></ul>
    <div class="controls">
        <input type="text" id="msg" style="flex-grow:1" placeholder="Message...">
        <button onclick="send()">Send</button>
    </div>

    <script>
        const socket = io();
        function send() {
            const msg = document.getElementById('msg').value;
            const key = document.getElementById('key').value;
            if(!msg || !key) return;
            // ENCRYPT
            const encrypted = CryptoJS.AES.encrypt(msg, key).toString();
            socket.emit('chat message', { data: encrypted });
            document.getElementById('msg').value = '';
        }

        socket.on('chat message', (obj) => {
            const key = document.getElementById('key').value;
            let decrypted = "[Decryption Failed - Wrong Key]";
            try {
                const bytes = CryptoJS.AES.decrypt(obj.data, key);
                decrypted = bytes.toString(CryptoJS.enc.Utf8) || "[Decryption Failed]";
            } catch(e) {}
            
            const li = document.createElement('li');
            li.textContent = "Peer: " + decrypted;
            document.getElementById('messages').appendChild(li);
        });
    </script>
</body>
</html>
    `);
});

io.on('connection', (socket) => {
    console.log('User connected');
    socket.on('chat message', (data) => {
        socket.broadcast.emit('chat message', data);
    });
});

// THE MOST IMPORTANT PART FOR RAILWAY:
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

