# API Documentation - Cipher Notes

## Base URL

```
http://localhost:3000
https://yourdomain.com  (production)
```

## Authentication

Session-based authentication using HTTP-only cookies:
- Session cookie: `sessionId` (automatically created on first request)
- Ownership verification: Your `sessionId` must match paste's `ownedBy`

## Endpoints

### 1. Create Paste

**Create a new encrypted paste**

```http
POST /api/paste
Content-Type: application/json

{
  "content": "base64_encrypted_string",
  "autoDelete": boolean,
  "expiryHours": number
}
```

**Parameters:**
- `content` (required): Base64-encoded encrypted data (AES-256-GCM format)
- `autoDelete` (optional): Delete paste after first download (default: true)
- `expiryHours` (optional): Hours until auto-expiration (default: 24)

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
  "message": "Paste created successfully"
}
```

**Status Codes:**
- `201` - Paste created successfully
- `400` - Invalid request (missing content)
- `413` - Payload too large (> 1MB)
- `500` - Server error

**Example:**
```javascript
const response = await fetch('/api/paste', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: encryptedBase64String,
    autoDelete: true,
    expiryHours: 24
  })
});
const data = await response.json();
console.log(data.id); // Use this in URL
```

---

### 2. Get Paste

**Retrieve an encrypted paste**

```http
GET /api/paste/:id
```

**Parameters:**
- `id` (path): Paste ID (UUID)

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
  "content": "base64_encrypted_string",
  "isOwner": boolean,
  "createdAt": 1637529600000
}
```

**Status Codes:**
- `200` - Paste found and returned
- `404` - Paste not found or expired
- `500` - Server error

**Notes:**
- `content` is encrypted (base64-encoded)
- `isOwner` is true if your session owns this paste
- Paste auto-deletes if `autoDelete` was true
- Returns 404 if expiration time has passed

**Example:**
```javascript
const response = await fetch(`/api/paste/${pasteId}`);
const data = await response.json();
// Decrypt data.content using the key from URL fragment
const plaintext = await decryptContent(data.content, keyFromUrl);
```

---

### 3. Update Paste

**Update an existing paste (owner only)**

```http
PUT /api/paste/:id
Content-Type: application/json

{
  "content": "base64_encrypted_string"
}
```

**Parameters:**
- `id` (path): Paste ID (UUID)
- `content` (body, required): New encrypted content

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
  "message": "Paste updated successfully"
}
```

**Status Codes:**
- `200` - Paste updated
- `400` - Invalid request
- `403` - Not authorized (not owner)
- `404` - Paste not found
- `413` - Content too large
- `500` - Server error

**Notes:**
- Only the session that created the paste can update it
- Creates new encrypted content (no plaintext conversion)
- Session cookie must match original creator

**Example:**
```javascript
const response = await fetch(`/api/paste/${pasteId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: newEncryptedBase64
  })
});
```

---

### 4. Delete Paste

**Delete a paste (owner only)**

```http
DELETE /api/paste/:id
```

**Parameters:**
- `id` (path): Paste ID (UUID)

**Response:**
```json
{
  "message": "Paste deleted successfully"
}
```

**Status Codes:**
- `200` - Paste deleted
- `403` - Not authorized (not owner)
- `404` - Paste not found
- `500` - Server error

**Notes:**
- Only the paste owner can delete it
- Immediate deletion (no soft delete)

**Example:**
```javascript
const response = await fetch(`/api/paste/${pasteId}`, {
  method: 'DELETE'
});
```

---

### 5. Health Check

**Check server status and metrics**

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "pasteCount": 42
}
```

**Status Codes:**
- `200` - Server is healthy

**Example:**
```javascript
const response = await fetch('/health');
const health = await response.json();
console.log(`Server has ${health.pasteCount} pastes`);
```

---

## Data Formats

### Encryption Format

**Client-side AES-256-GCM encryption:**

```
Binary Format:
[IV (12 bytes)] [Encrypted Data (variable)] [Auth Tag (16 bytes)]

Then Base64-encoded for transmission:
base64(iv || ciphertext || authtag)
```

**Encryption Parameters:**
- Algorithm: AES-256-GCM (Advanced Encryption Standard, 256-bit, Galois/Counter Mode)
- IV Size: 12 bytes (96 bits) - random for each encryption
- Key Derivation: Direct (32 bytes from crypto.getRandomValues())
- Authentication: Included in GCM (prevents tampering)

**Example Encrypted Content:**
```
AgICAgICAgICAgICAi...MzMzMzMzMzMzMzMzMzMzMzMzMzMz
```

### URL Format

**Share URL structure:**

```
http://localhost:3000/#paste_id_key_in_hex
                      ↑
                      Never sent to server
                      (URL fragment)

Example:
http://localhost:3000/#a1b2c3d4-e5f6-g7h8_abcdef1234567890...
```

**Format:**
- `paste_id`: UUID returned from POST /api/paste
- Underscore separator: `_`
- `key_in_hex`: 32-byte key converted to 64-character hex string

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Content is required"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized"
}
```

### 404 Not Found
```json
{
  "error": "Paste not found"
}
```

### 413 Payload Too Large
```json
{
  "error": "Paste exceeds 1MB limit"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "(only in development mode)"
}
```

---

## Rate Limiting

Currently **not implemented**. Recommended additions:
- 100 pastes per hour per IP
- 10 downloads per minute per IP
- 1000 total pastes per server

---

## CORS

CORS is enabled for all origins. For production, restrict to specific domains:

```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

---

## Security Headers

Recommended headers (add to `src/server.js`):

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

---

## Limits

- **Maximum paste size**: 1 MB (1,048,576 bytes)
- **Maximum pastes in memory**: Limited by available RAM
- **Session timeout**: 24 hours (can be configured)
- **Default expiration**: 24 hours
- **URL fragment length**: ~16KB (browser limit)

---

## Examples

### JavaScript (Fetch API)

```javascript
// Create paste
async function createPaste(plaintext) {
  const key = await generateKey();
  const encrypted = await encryptContent(plaintext, key);
  const keyHex = arrayBufferToHex(key);
  
  const response = await fetch('/api/paste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: encrypted,
      autoDelete: true,
      expiryHours: 24
    })
  });
  
  const data = await response.json();
  const shareUrl = `${window.location.origin}/#${data.id}_${keyHex}`;
  return shareUrl;
}

// Retrieve and decrypt paste
async function viewPaste(pasteId, keyHex) {
  const response = await fetch(`/api/paste/${pasteId}`);
  const data = await response.json();
  const plaintext = await decryptContent(data.content, keyHex);
  return plaintext;
}
```

### cURL

```bash
# Create paste
curl -X POST http://localhost:3000/api/paste \
  -H "Content-Type: application/json" \
  -d '{"content":"AgICAgIC...","autoDelete":true,"expiryHours":24}'

# Get paste
curl http://localhost:3000/api/paste/a1b2c3d4-e5f6-g7h8

# Health check
curl http://localhost:3000/health
```

### Python

```python
import requests
import json

# Create paste
response = requests.post(
    'http://localhost:3000/api/paste',
    json={
        'content': encrypted_base64_string,
        'autoDelete': True,
        'expiryHours': 24
    }
)
paste_id = response.json()['id']

# Get paste
response = requests.get(f'http://localhost:3000/api/paste/{paste_id}')
encrypted_content = response.json()['content']
```

---

## Webhooks

**Not currently implemented.** Future enhancement:
- Notify external service when paste is created
- Notify when paste expires
- Notify on download (if autoDelete is false)

---

## WebSockets

**Not currently implemented.** Future enhancement for real-time updates.

---

## GraphQL

**Not currently implemented.** RESTful API is preferred for simplicity.

---

## Versioning

Current API version: **1.0.0**

All endpoints are at `/api/` path. Version pinning via headers not yet supported.

---

## Support

For issues:
1. Check server logs (terminal output)
2. Check browser console (F12)
3. Review QUICKSTART.md
4. Check this API documentation

---

**Last Updated**: November 21, 2025
**Maintained by**: Cipher Notes Team
