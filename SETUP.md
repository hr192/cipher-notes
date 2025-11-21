# Setup Instructions for Cipher Notes

## Prerequisites

You need to have **Node.js 16+** and **npm** installed on your system.

### Download and Install Node.js

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS (Long-Term Support) version for Windows
3. Run the installer and follow the setup wizard
4. Node.js and npm will be installed in your PATH

To verify installation, open PowerShell and run:
```powershell
node --version
npm --version
```

## Installation & Setup

Once Node.js is installed, follow these steps:

### 1. Install Dependencies

Navigate to the project directory and install dependencies:

```powershell
cd C:\Users\Administrator\Documents\cipher-notes
npm install
```

This will install:
- **express** - Web framework
- **uuid** - Unique ID generation
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

### 2. Start Development Server

Run the development server:

```powershell
npm run dev
```

Or start the server:

```powershell
npm start
```

You should see output like:

```
📋🔐 Cipher Notes is running!
🌐 http://localhost:3000
📊 Health check: http://localhost:3000/health

💡 Start typing or paste content to encrypt and share.
```

### 3. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## Project Structure

```
cipher-notes/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML
│   ├── style.css          # Styling
│   └── app.js             # Client-side encryption logic
├── src/
│   └── server.js          # Express backend server
├── .env                   # Environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies
└── README.md              # Project documentation
```

## How to Use

### Creating an Encrypted Note

1. Paste or type content in the textarea
2. Click "Encrypt & Share"
3. Copy the generated link (contains encrypted key in URL fragment)
4. Share the link with others

### Viewing an Encrypted Note

1. Open the shared link
2. The note is automatically decrypted in your browser
3. Copy, download, or edit the note

### Download Formats

After decryption, you can download the note as:
- **.txt** - Plain text
- **.md** - Markdown
- **.html** - HTML document

## Security Features

✅ **Client-side AES-256 encryption** - All encryption happens in your browser  
✅ **URL fragments** - Encryption key never sent to server (stays after #)  
✅ **Zero-knowledge architecture** - Server never sees plaintext  
✅ **No account required** - Anonymous and instant sharing  
✅ **Automatic expiration** - Pastes can auto-delete after download  

## Troubleshooting

### "npm: The term 'npm' is not recognized"

**Solution:** Node.js is not installed or not in PATH. 
- Download and install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal/PowerShell after installation

### Port 3000 is already in use

**Solution:** Either stop the other process or change the PORT in `.env`:

```
PORT=3001
```

Then restart the server.

### Browser shows "Cannot GET /"

**Solution:** Make sure the server is running and accessible at `http://localhost:3000`

### Encryption fails

**Solution:** Your browser may not support Web Crypto API. Ensure you're using:
- Chrome/Edge 37+
- Firefox 34+
- Safari 11+
- Opera 24+

## Environment Variables

Edit `.env` to customize:

```env
# Server port
PORT=3000

# Environment (development or production)
NODE_ENV=development
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/paste` | Create encrypted paste |
| GET    | `/api/paste/:id` | Retrieve encrypted paste |
| PUT    | `/api/paste/:id` | Update paste (owner only) |
| DELETE | `/api/paste/:id` | Delete paste (owner only) |
| GET    | `/health` | Health check |

## Next Steps

- ✅ Install Node.js and dependencies
- ✅ Start the development server
- ✅ Test creating and sharing encrypted notes
- 🎯 Deploy to production (Heroku, Railway, Render, etc.)
- 🎯 Add database persistence (MongoDB, PostgreSQL)
- 🎯 Implement additional formats or features

## Support

For issues or questions, check:
1. Browser console (F12) for client-side errors
2. Terminal output for server errors
3. This setup guide for common issues

Happy encrypting! 🔐
