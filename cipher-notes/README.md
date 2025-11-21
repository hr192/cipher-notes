# Cipher Notes - Encrypted Pastebin Clone

A secure, client-side encrypted note sharing application inspired by [paste.sh](https://paste.sh). Share sensitive information with confidence knowing that encryption happens entirely in your browser.

## Features

✅ **Client-side AES-256 encryption** - Your data never reaches the server in plaintext  
✅ **URL fragment-based key sharing** - Encryption key stays in the URL fragment (never sent to server)  
✅ **Simple, distraction-free interface** - Just textarea and minimal UI  
✅ **Session-based editing** - Edit your paste for some time after creation  
✅ **No account required** - Start sharing immediately  
✅ **Download support** - Export notes in multiple formats (.txt, .md, .html)  
✅ **Paste history** - Access previous pastes in this session  

## How It Works

1. **Create**: Type or paste content in the textarea
2. **Encrypt**: Click "Encrypt & Share" - content is encrypted client-side using AES-256
3. **Share**: A unique URL with the encryption key in the fragment is generated
4. **Decrypt**: Recipients open the link; the key in the URL decrypts the content in their browser
5. **Edit**: You can edit the paste for a limited time using a session cookie
6. **Download**: Export your decrypted note in your preferred format

## Security

- **Zero-knowledge architecture**: The server never sees plaintext data
- **AES-256 encryption**: Industry-standard symmetric encryption
- **URL fragments**: The encryption key (after #) is never sent to the server
- **Client-side processing**: All formatting and file generation happens locally
- **No plaintext storage**: Only encrypted data is stored on the server
- **Optional expiration**: Pastes can be deleted after download

## Technology Stack

**Frontend:**
- Vanilla JavaScript (no dependencies)
- TweetNaCl.js for encryption
- HTML5 Blob API for downloads

**Backend:**
- Node.js + Express
- In-memory storage (can be replaced with database)
- UUID for unique paste IDs
- CORS support

## Installation

```bash
npm install
```

## Usage

### Development

```bash
npm run dev
```

The application will start on `http://localhost:3000`

### Production

```bash
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/paste` | Create a new encrypted paste |
| GET    | `/api/paste/:id` | Retrieve encrypted paste content |
| PUT    | `/api/paste/:id` | Update a paste (with session auth) |
| DELETE | `/api/paste/:id` | Delete a paste (with session auth) |
| GET    | `/paste/:id` | Web interface (returns HTML) |

## Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
MAX_PASTE_SIZE=1048576
```

## File Structure

```
cipher-notes/
├── public/
│   ├── index.html          # Main web interface
│   ├── style.css           # Styling
│   └── app.js              # Client-side encryption & UI logic
├── src/
│   ├── server.js           # Express server
│   ├── routes/
│   │   └── paste.js        # Paste API routes
│   ├── middleware/
│   │   └── auth.js         # Session authentication
│   └── utils/
│       └── crypto.js       # Encryption utilities
├── package.json
└── README.md
```

## Browser Support

Requires a modern browser with Web Crypto API support:
- Chrome/Edge 37+
- Firefox 34+
- Safari 11+
- Opera 24+

## Limitations

- Maximum 1 MB of encrypted data per paste
- Pastes are stored in-memory (lost on server restart)
- Session cookies required for editing (can use command-line client instead)

## Privacy

- Source IP, User-Agent, and creation timestamp are logged for abuse prevention
- No analytics or tracking
- No third-party services
- Optional auto-deletion after download

## License

0BSD - This project is released under the Zero Clause BSD license, allowing unrestricted use.

## References

- [paste.sh](https://paste.sh) - Original inspiration
- [paste.sh source code](https://github.com/dgl/paste.sh)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

## Contributing

Contributions welcome! This is a reference implementation for secure note sharing.
