const { Pool } = require('pg');

// Reuse a single pool per invocation (Vercel best practice)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
      const { content, autoDelete, expiryHours } = req.body;
      if (!content) return res.status(400).json({ error: 'Content is required' });

      const id = require('crypto').randomUUID();
      const createdAt = new Date().toISOString();
      const expiryTime = expiryHours ? new Date(Date.now() + expiryHours * 3600 * 1000).toISOString() : null;

      await pool.query(
        'INSERT INTO pastes(id, content, created_at, expiry_time, auto_delete, owned_by, ip_address, user_agent) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          id,
          content,
          createdAt,
          expiryTime,
          autoDelete || false,
          req.headers['x-session-id'] || null,
          req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
          req.headers['user-agent'] || null
        ]
      );

      return res.status(201).json({ id, message: 'Paste created successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('api/paste error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
