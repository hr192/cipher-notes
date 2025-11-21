const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = async (req, res) => {
  try {
    const id = req.query.id || req.url.split('/').pop();

    if (req.method === 'GET') {
      const r = await pool.query('SELECT id, content, created_at, expiry_time, auto_delete, owned_by FROM pastes WHERE id=$1', [id]);
      if (r.rowCount === 0) return res.status(404).json({ error: 'Paste not found' });

      const paste = r.rows[0];
      // check expiry
      if (paste.expiry_time && new Date(paste.expiry_time) < new Date()) {
        await pool.query('DELETE FROM pastes WHERE id=$1', [id]);
        return res.status(404).json({ error: 'Paste has expired' });
      }

      return res.json({ id: paste.id, content: paste.content, isOwner: false, createdAt: paste.created_at });
    }

    if (req.method === 'PUT') {
      const { content } = req.body;
      if (!content) return res.status(400).json({ error: 'Content is required' });

      await pool.query('UPDATE pastes SET content=$1, updated_at=now() WHERE id=$2', [content, id]);
      return res.json({ id, message: 'Paste updated successfully' });
    }

    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM pastes WHERE id=$1', [id]);
      return res.json({ message: 'Paste deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('api/paste/[id] error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
