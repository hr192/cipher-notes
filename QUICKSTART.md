# 🚀 Quick Start Guide - Cipher Notes

## One-Minute Setup

### Step 1: Install Node.js
- Download from https://nodejs.org/ (LTS version)
- Install using the wizard
- Restart your terminal

### Step 2: Install Dependencies
```powershell
cd C:\Users\Administrator\Documents\cipher-notes
npm install
```

### Step 3: Start Server
```powershell
npm run dev
```

You should see:
```
📋🔐 Cipher Notes is running!
🌐 http://localhost:3000
```

### Step 4: Open in Browser
```
http://localhost:3000
```

## Done! 🎉

You now have a fully encrypted note-sharing application running locally!

## First Steps

1. **Create a Note**
   - Type some text in the textarea
   - Click "Encrypt & Share"
   - Copy the generated link

2. **Share the Link**
   - The link contains your encrypted key (in the # part)
   - Send it to anyone
   - They can open it to view (and download) your note

3. **Decrypt on Open**
   - When a link is opened, the note auto-decrypts
   - All decryption happens in the browser
   - The server never sees the plaintext

4. **Download Your Note**
   - Click "Download" after viewing
   - Choose format: .txt, .md, or .html
   - Save to your computer

## Key Features

| Feature | How It Works |
|---------|-------------|
| **Encryption** | AES-256 in your browser (zero-knowledge) |
| **Sharing** | Copy link with key in URL (#fragment) |
| **Security** | Server sees only encrypted data |
| **Formats** | Download as .txt, .md, or .html |
| **Sessions** | Edit your pastes if you're the owner |
| **Expiry** | Auto-delete after download or time limit |

## File Locations

| File | Purpose |
|------|---------|
| `public/app.js` | All encryption/decryption logic |
| `src/server.js` | Backend API server |
| `public/index.html` | Web interface |
| `.env` | Configuration (PORT, etc.) |

## Troubleshooting

### "npm is not recognized"
- Install Node.js: https://nodejs.org/
- Restart PowerShell after installation

### "Port 3000 already in use"
- Edit `.env` and change `PORT=3001`
- Or kill the process using port 3000

### "Paste not found"
- Links expire after the time set
- Refresh the page and try again
- Create a new note if needed

## Next Steps

### Customize
- Edit `public/style.css` to change colors/styling
- Modify `public/index.html` to add features
- Update `src/server.js` for backend changes

### Deploy
- Upload to Heroku, Render, Railway, or Netlify
- Follow their deployment guides
- Set `NODE_ENV=production`

### Add Database
- Replace in-memory storage in `src/server.js`
- Use MongoDB, PostgreSQL, or similar
- Persist pastes permanently

### Add CLI
- Create a command-line tool like paste.sh has
- Allow piping: `cat file | cipher-notes`
- Support multiple output formats

## Architecture

```
┌─────────────────────────────────────────────────────┐
│             BROWSER (Client)                        │
│  ┌──────────────────────────────────────────────┐  │
│  │  1. User types content                       │  │
│  │  2. app.js encrypts with AES-256            │  │
│  │  3. Sends encrypted blob to server          │  │
│  │  4. Gets back paste ID                      │  │
│  │  5. Creates URL with ID + key in fragment   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↕ HTTPS
┌─────────────────────────────────────────────────────┐
│            SERVER (Node.js/Express)                │
│  ┌──────────────────────────────────────────────┐  │
│  │  1. Receives POST /api/paste                 │  │
│  │  2. Stores encrypted data (can't read it)    │  │
│  │  3. Returns paste ID + session cookie       │  │
│  │  4. Serves /api/paste/:id when requested    │  │
│  │  5. Never sees decryption key              │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Security Guarantees

✅ **Your data is encrypted before it leaves your computer**
✅ **The encryption key never goes to the server (stays in URL fragment)**
✅ **The server cannot decrypt or read your notes**
✅ **Even the admin can't see what you shared**
✅ **Download formats are created in your browser, not on server**

## Questions?

Check these files for more info:
- **README.md** - Full project documentation
- **SETUP.md** - Detailed setup guide
- **PROJECT_SUMMARY.md** - Complete feature list

---

**Happy encrypting!** 🔐

Inspired by [paste.sh](https://paste.sh) - The original encrypted pastebin.
