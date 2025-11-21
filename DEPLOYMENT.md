# Deployment Guide - Cipher Notes

## Local Development

### Prerequisites
- Node.js 16+ and npm
- Git (optional)
- Any modern web browser

### Quick Start
```powershell
npm install
npm run dev
```

Then open `http://localhost:3000`

---

## Production Deployment

### Option 1: Railway.app (Recommended - Easiest)

Railway is a modern PaaS that makes deployment super simple.

**Steps:**

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Fork this repository to your GitHub
   - In Railway: Click "New Project" → "Deploy from GitHub repo"
   - Select the fork
   - Railway auto-detects Node.js
   - Sets `NODE_ENV=production`

3. **Configure Domain**
   - Railway provides a free subdomain
   - Optional: Add custom domain in Railway dashboard

4. **Database (Optional)**
   - In Railway dashboard: Add PostgreSQL service
   - Get connection string from Railway environment
   - Update `src/server.js` to use database instead of in-memory storage

**Cost:** Free tier includes:
- 5 GB storage
- $5 credit monthly
- Perfect for small deployments

**Estimated monthly cost:** $0-5 (free tier usually sufficient)

---

### Option 2: Heroku (Legacy)

Heroku is phasing out free tier but still works well.

**Steps:**

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   heroku create cipher-notes
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **View Logs**
   ```bash
   heroku logs --tail
   ```

**Cost:** $7/month minimum (no free tier)

---

### Option 3: Render.com (Free with Limits)

Render is another excellent alternative.

**Steps:**

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create New Service**
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub repository
   - Render auto-detects Node.js

4. **Configure**
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: Select "Node"

**Cost:** 
- Free tier with $7 monthly credit
- Paid plans from $7/month

---

### Option 4: AWS (Scalable)

For high-traffic production environments.

**Using AWS Elastic Beanstalk:**

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize**
   ```bash
   eb init -p node.js-16 cipher-notes
   ```

3. **Create Environment**
   ```bash
   eb create cipher-notes-prod
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

**Cost:** 
- EC2: ~$0.01/hour for micro instance
- ~$7/month for always-on
- RDS database: ~$12/month

---

### Option 5: Self-Hosted (Full Control)

Deploy to your own VPS/server.

**Prerequisites:**
- VPS (DigitalOcean, Linode, Vultr, etc.)
- Domain name
- SSH access

**Setup:**

1. **SSH into Server**
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone Repository**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/cipher-notes.git
   cd cipher-notes
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Setup PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   pm2 start src/server.js --name cipher-notes
   pm2 startup
   pm2 save
   ```

6. **Setup Nginx (Reverse Proxy)**
   ```bash
   sudo apt-get install nginx
   ```

   Create `/etc/nginx/sites-available/cipher-notes`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/cipher-notes /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup HTTPS with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

8. **Setup Firewall**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

**Cost:** 
- DigitalOcean: $4-6/month for basic droplet
- Domain: $10-15/year
- Total: ~$60-80/year

---

## Database Setup

### Replace In-Memory Storage with PostgreSQL

The current implementation uses in-memory storage (lost on restart).

**Installation:**

1. **Update package.json**
   ```bash
   npm install pg dotenv
   ```

2. **Create Database Connection** (`src/db.js`):
   ```javascript
   const { Pool } = require('pg');
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL
   });
   
   module.exports = pool;
   ```

3. **Create Schema** (SQL):
   ```sql
   CREATE TABLE pastes (
     id UUID PRIMARY KEY,
     content TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     expiry_time TIMESTAMP,
     auto_delete BOOLEAN DEFAULT true,
     owned_by VARCHAR(36) NOT NULL,
     ip_address VARCHAR(45),
     user_agent TEXT
   );
   
   CREATE INDEX idx_expiry ON pastes(expiry_time);
   CREATE INDEX idx_owner ON pastes(owned_by);
   ```

4. **Update src/server.js** to use database instead of Map

5. **Set DATABASE_URL in .env**
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/cipher_notes
   ```

---

## Environment Variables

### Production Configuration

Create `.env` file:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://...

# Security
SESSION_SECRET=your-secret-key-here

# Limits
MAX_PASTE_SIZE=1048576
SESSION_TIMEOUT=86400000

# Logging
LOG_LEVEL=info
```

---

## Monitoring & Logging

### Basic Monitoring

Add to `src/server.js`:

```javascript
const fs = require('fs');
const path = require('path');

// Simple file-based logging
const logFile = path.join(__dirname, '../logs/app.log');

function log(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level}: ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

// Log requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    log('INFO', `${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Error logging
app.use((err, req, res, next) => {
  log('ERROR', err.message);
  res.status(500).json({ error: 'Internal server error' });
});
```

### Advanced Monitoring (Production)

Use services like:
- **New Relic** - Application Performance Monitoring
- **DataDog** - Infrastructure monitoring
- **LogRocket** - Frontend error tracking
- **Sentry** - Error reporting

---

## Security Checklist

- [ ] Enable HTTPS/SSL (Let's Encrypt)
- [ ] Set `NODE_ENV=production`
- [ ] Use environment variables for secrets
- [ ] Add rate limiting
- [ ] Implement CORS properly
- [ ] Add security headers (CSP, HSTS)
- [ ] Setup database backups
- [ ] Monitor error logs
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Setup DDoS protection (Cloudflare)
- [ ] Configure firewall rules
- [ ] Regular security audits

---

## Performance Optimization

### Caching

```javascript
// Cache static files
app.use(express.static('public', {
  maxAge: '1d',
  etag: false
}));
```

### Compression

```javascript
const compression = require('compression');
app.use(compression());
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Connection Pooling

```javascript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Backup Strategy

### Automated Backups

```bash
# Daily PostgreSQL backup
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/cipher-notes-$(date +\%Y\%m\%d).sql.gz

# Weekly S3 upload
0 3 * * 0 aws s3 cp /backups/cipher-notes-*.sql.gz s3://your-backup-bucket/
```

### Disaster Recovery

1. Keep 30 days of daily backups
2. Keep 12 monthly backups
3. Test restore monthly
4. Document recovery procedure
5. Store backups in multiple regions

---

## Rollback Procedure

If deployment fails:

```bash
# For Railway/Render
# Use built-in rollback in dashboard

# For Heroku
heroku releases
heroku rollback v123

# For self-hosted
pm2 restart cipher-notes
```

---

## Cost Comparison

| Platform | Estimated Monthly Cost | Setup Time | Scaling |
|----------|----------------------|-----------|---------|
| Railway | $0-5 | 5 min | Automatic |
| Render | $0-7 | 10 min | Automatic |
| Heroku | $7+ | 10 min | Manual |
| DigitalOcean VPS | $4-6 | 30 min | Manual |
| AWS | $7-20 | 1 hour | Automatic |
| Self-hosted | $0 | 2+ hours | Manual |

---

## Recommended Setup

**For Small Projects (< 1K users/month):**
- **Platform:** Railway.app
- **Database:** PostgreSQL (free tier in Railway)
- **Domain:** Your custom domain ($10/year)
- **Cost:** $0-5/month

**For Growing Projects (1K-100K users/month):**
- **Platform:** AWS ECS or Railway paid tier
- **Database:** AWS RDS PostgreSQL
- **CDN:** CloudFront
- **Cost:** $20-50/month

**For Large Projects (> 100K users/month):**
- **Platform:** AWS ECS/Lambda or Kubernetes
- **Database:** Multi-region PostgreSQL
- **Cache:** Redis/ElastiCache
- **CDN:** CloudFront
- **Cost:** $100+/month

---

## Troubleshooting Deployment

### Port Issues
```bash
# Railway/Render auto-assign PORT env var
PORT="${PORT:-3000}" in start script
```

### Database Connection
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Memory Issues
```bash
# Node memory limit
NODE_OPTIONS="--max-old-space-size=512"
```

### File Permissions
```bash
# Allow writes to logs directory
chmod 755 logs/
```

---

## Next Steps

1. Choose deployment platform
2. Create account and project
3. Deploy application
4. Setup database (optional but recommended)
5. Monitor logs and metrics
6. Setup automated backups
7. Configure monitoring and alerts

---

**Happy deploying!** 🚀

For deployment support, check the specific platform documentation:
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Heroku Docs](https://devcenter.heroku.com)
- [AWS Docs](https://docs.aws.amazon.com)
