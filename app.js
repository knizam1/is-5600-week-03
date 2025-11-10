const express = require('express');
const path = require('path');
const EventEmitter = require('events');

const port = process.env.PORT || 3000;
const app = express();

// Serve /public static files (chat.js lives here)
app.use(express.static(path.join(__dirname, 'public')));

// --- Chat event bus ---
const chatEmitter = new EventEmitter();

// --- Handlers (kept modular) ---

/**
 * Serves the chat UI (chat.html at project root)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function chatApp(req, res) {
  res.sendFile(path.join(__dirname, 'chat.html'));
}

/**
 * Plain text response (kept for parity with lab steps)
 */
function respondText(req, res) {
  res.set('Content-Type', 'text/plain');
  res.send('hi');
}

/**
 * JSON response (uses Express's res.json)
 */
function respondJson(req, res) {
  res.json({
    text: 'hi',
    numbers: [1, 2, 3],
  });
}

/**
 * Echo transformer (normal, shouty, charCount, backwards)
 */
function respondEcho(req, res) {
  const { input = '' } = req.query;
  res.json({
    normal: input,
    shouty: input.toUpperCase(),
    charCount: input.length,
    backwards: input.split('').reverse().join(''),
  });
}

/**
 * Accepts chat messages via query (?message=...)
 * Broadcasts them to all /sse listeners
 */
function respondChat(req, res) {
  const { message = '' } = req.query;
  // You can no-op empty messages, or still broadcast—here we ignore empties:
  if (message.trim().length > 0) {
    chatEmitter.emit('message', message.trim());
  }
  res.end();
}

/**
 * Server-Sent Events stream for chat subscribers
 */
function respondSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const onMessage = (message) => {
    // Each SSE event must end with a blank line
    res.write(`data: ${message}\n\n`);
  };

  chatEmitter.on('message', onMessage);

  // Clean up when client disconnects
  req.on('close', () => {
    chatEmitter.off('message', onMessage);
  });
}

// --- Routes ---
app.get('/', chatApp);           // serve chat.html
app.get('/json', respondJson);   // JSON demo
app.get('/echo', respondEcho);   // echo transformer
app.get('/chat', respondChat);   // chat message ingest
app.get('/sse', respondSSE);     // SSE stream

// Optional: keep the original text endpoint at /text (not /)
app.get('/text', respondText);

// 404 fallback
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});