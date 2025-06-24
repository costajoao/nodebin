// index.js
const express = require('express');
const bodyParser = require('body-parser');
const { customAlphabet } = require('nanoid');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(express.static('public'));
app.use(express.text({ type: '*/*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cleanup expired bins every 5 min
setInterval(() => {
  db.run(`DELETE FROM requests WHERE bin_id IN (SELECT id FROM bins WHERE expires_at <= CURRENT_TIMESTAMP)`);
  db.run(`DELETE FROM bins WHERE expires_at <= CURRENT_TIMESTAMP`);
}, 5 * 60 * 1000);

// Home
app.get('/', (req, res) => {
  db.all('SELECT id, created_at FROM bins WHERE expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 10', (err, bins) => {
    if (err) return res.status(500).send('Error loading bins');
    res.render('index', { bins });
  });
});


app.post('/', (req, res) => {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const nanoidSafe = customAlphabet(alphabet, 12);

  const id = nanoidSafe();
  db.run('INSERT INTO bins (id) VALUES (?)', [id], err => {
    if (err) return res.status(500).send('Error creating bin');
    res.redirect(`/b/${id}`);
  });
});

app.get('/api', (req, res) => {
  res.render('api', {
    host: req.get('host'),
  });
});

app.get('/api/bin/:id/requests', (req, res) => {
  const binId = req.params.id;
  const since = req.query.since ? new Date(Number(req.query.since)).toISOString() : null;

  console.log(`[API] Bin: ${binId}, Since: ${since}`);

  const query = since
    ? `SELECT id, method, path, headers, query, body, ip, created_at FROM requests WHERE bin_id = ? AND created_at > ? ORDER BY created_at ASC`
    : `SELECT id, method, path, headers, query, body, ip, created_at FROM requests WHERE bin_id = ? ORDER BY created_at ASC`;

  const params = since ? [binId, since] : [binId];

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('[ERROR] Failed to fetch requests:', err);
      return res.status(500).json({ message: 'Error loading requests' });
    }

    console.log(`[API] Returned ${rows.length} new requests`);
    res.json(rows);
  });
});

app.get('/b/:id', (req, res) => {
  const binId = req.params.id;

  db.get('SELECT * FROM bins WHERE id = ?', [binId], (err, bin) => {
    if (err || !bin) {
      return res.status(404).send('Bin not found or expired');
    }

    res.render('bin', {
      bin,
      host: req.get('host'),
    });
  });
});


app.all('/:id', (req, res, next) => {
  if (req.path.startsWith('/b/')) return next();

  const binId = req.params.id;
  const headers = JSON.stringify(req.headers, null, 2);
  const query = JSON.stringify(req.query || {}, null, 2);
  const body = typeof req.body === 'object' ? JSON.stringify(req.body, null, 2) : req.body;
  const ip = req.ip;
  const path = req.originalUrl;

  db.get(
    'SELECT id FROM bins WHERE id = ? AND expires_at > CURRENT_TIMESTAMP',
    [binId],
    (err, bin) => {
      if (err || !bin) {
        return res.status(404).json({ message: 'Bin expired or not found' });
      }

      db.run(
        `INSERT INTO requests (bin_id, method, path, headers, body, query, ip) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [binId, req.method, path, headers, body, query, ip],
        function (err) {
          if (err) {
            console.error('DB insert error:', err);
            return res.status(500).json({ message: 'Error saving request' });
          }

          return res.status(200).json({
            message: 'Request received',
            binId,
            requestId: this.lastID,
            method: req.method,
            path,
            ip
          });
        }
      );
    }
  );
});

app.listen(PORT, () => console.log(`🚀 Listening at http://localhost:${PORT}`));