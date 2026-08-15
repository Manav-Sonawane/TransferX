# TransferX Download Architecture - Integration Guide

## Quick Summary

You have two problems:
1. **Streaming issue**: Node.js server corrupts PDF MIME types when piping from Cloudinary
2. **Mixed concerns**: Same architecture trying to handle both public guests and authenticated users with encryption

**Solution**: Use HTTP 302 redirects to Cloudinary instead of streaming. Separate public and private flows completely.

---

## What Changed

### Before (Broken)
```
User → Request → Node.js Server → Download Manager → Stream from Cloudinary
                                     ↓
                           Corrupts Content-Type headers
                                     ↓
                           PDF downloads as raw file
```

### After (Fixed)
```
Public User:
  User → Request → Node.js Validate → HTTP 302 Redirect → Cloudinary
                   (Expiry check)                      (Client downloads)

Authenticated User (Password Protected):
  User → Request → Node.js Auth → Validate Password → Node.js Generate Token → HTTP 302 Redirect → Cloudinary
         (Enter password)       (against DB)           (15 min expiry)         (Client downloads)
```

**Key insight**: Let Cloudinary handle the download. Node.js only validates access.

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install bcrypt jsonwebtoken
```

### Step 2: Create Directory Structure

```
server/src/
├── controllers/
│   └── download/
│       ├── publicDownload.controller.js
│       └── privateDownload.controller.js
├── services/
│   ├── storage.service.js
│   ├── accessToken.service.js
│   └── password.service.js
├── models/
│   └── Download.js (contains Share, PrivateFile, File models)
└── routes/
    └── download.routes.js
```

### Step 3: Update Database Models

Replace your existing file models with the new schema that separates:
- `Share` - Public shares (guest downloads)
- `PrivateFile` - Authenticated files (user downloads, optional password)
- `File` - Base file metadata
- `FailedAttempt` - Rate limiting for password attempts

See `models.js` for complete schema.

### Step 4: Update Express Server

```javascript
// server/src/index.js

const downloadRouter = require('./routes/download.routes');

// ... other middleware ...

// Mount download routes
app.use('/api/download', downloadRouter);
```

### Step 5: Implement Services

Copy these three files:
- `storage.service.js` - Generates signed Cloudinary URLs
- `accessToken.service.js` - Creates/verifies JWT tokens for temporary access
- `password.service.js` - Bcrypt password hashing/comparison

### Step 6: Implement Controllers

Copy these two files:
- `publicDownload.controller.js` - Handles guest downloads
- `privateDownload.controller.js` - Handles authenticated downloads with optional password

### Step 7: Add Routes

```javascript
// server/src/routes/index.js

const downloadRouter = require('./download/download.routes');

router.use('/download', downloadRouter);
```

### Step 8: Update Frontend

See frontend integration examples below.

---

## Frontend Integration Examples

### Public File Download (Logged-Out)

```jsx
// components/PublicDownload.jsx

import { useState } from 'react';
import axios from 'axios';

export function PublicDownload({ shareCode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);

  // Step 1: Get file metadata (optional, for display)
  const fetchMetadata = async () => {
    try {
      const res = await axios.get(`/api/download/public/${shareCode}`);
      setMetadata(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load file');
    }
  };

  // Step 2: Download file
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      // Option 1: Direct redirect (simplest)
      // Browser handles the download automatically
      window.location.href = `/api/download/public/${shareCode}/download`;

      // Option 2: Get URL and handle download manually
      // const res = await axios.get(`/api/download/public/${shareCode}/url`);
      // const link = document.createElement('a');
      // link.href = res.data.downloadUrl;
      // link.download = res.data.fileName;
      // link.click();
    } catch (err) {
      setError(err.response?.data?.error || 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchMetadata} disabled={loading}>
        Get File Info
      </button>

      {metadata && (
        <div>
          <p>File: {metadata.fileName}</p>
          <p>Size: {(metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>
          <p>Expires: {new Date(metadata.expiryTime).toLocaleString()}</p>
          <p>Downloads: {metadata.downloadCount} / {metadata.downloadLimit || 'Unlimited'}</p>
        </div>
      )}

      <button onClick={handleDownload} disabled={loading}>
        {loading ? 'Downloading...' : 'Download File'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### Private File Download (Authenticated, Password Protected)

```jsx
// components/PrivateDownload.jsx

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export function PrivateDownload({ fileId }) {
  const { auth } = useAuth();
  const [step, setStep] = useState('metadata'); // 'metadata' | 'password' | 'ready'
  const [metadata, setMetadata] = useState(null);
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  // Step 1: Get file metadata
  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/download/private/${fileId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setMetadata(res.data);
      setStep('password'); // Move to password step if protected
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate password
  const validatePassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(
        `/api/download/private/${fileId}/validate-access`,
        { password },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      setAccessToken(res.data.accessToken);
      setStep('ready');
      setPassword(''); // Clear password from memory
    } catch (err) {
      setError(err.response?.data?.error || 'Password validation failed');
      setAttemptsRemaining(err.response?.data?.attemptsRemaining || 0);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Download file
  const handleDownload = async () => {
    try {
      setLoading(true);

      // Use the access token if file is password protected
      const headers = {
        Authorization: `Bearer ${auth.token}`,
      };

      if (metadata.isPasswordProtected && accessToken) {
        headers['X-Access-Token'] = accessToken;
      }

      // Redirect to download endpoint
      window.location.href = `/api/download/private/${fileId}/download?token=${accessToken || ''}`;
    } catch (err) {
      setError('Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="download-container">
      {/* Step 1: Fetch Metadata */}
      {step === 'metadata' && (
        <button onClick={fetchMetadata} disabled={loading}>
          {loading ? 'Loading...' : 'Load File Info'}
        </button>
      )}

      {/* Step 2: Password Validation (if needed) */}
      {step === 'password' && metadata && (
        <div>
          <p>File: {metadata.fileName}</p>
          <p>Size: {(metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>

          {metadata.isPasswordProtected ? (
            <form onSubmit={validatePassword}>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <button type="submit" disabled={loading || !password}>
                {loading ? 'Validating...' : 'Validate'}
              </button>
              {attemptsRemaining < 5 && (
                <p style={{ color: 'orange' }}>
                  Attempts remaining: {attemptsRemaining}
                </p>
              )}
            </form>
          ) : (
            <button onClick={() => setStep('ready')} disabled={loading}>
              Continue to Download
            </button>
          )}
        </div>
      )}

      {/* Step 3: Download Ready */}
      {step === 'ready' && metadata && (
        <div>
          <h3>Ready to Download</h3>
          <p>File: {metadata.fileName}</p>
          <p>Size: {(metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>
          <button onClick={handleDownload} disabled={loading}>
            {loading ? 'Downloading...' : 'Download Now'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

---

## Database Migration Strategy

### Option 1: Minimal Migration (Recommended for Active Projects)

Keep existing collections. Create new ones in parallel.

```javascript
// Existing collection (keep working)
db.shares

// New collections (gradual migration)
db.publicShares
db.privateFiles
db.files
```

**Advantages**:
- Zero downtime
- Existing links keep working
- Can migrate gradually
- Easy rollback

**Migration Code**:
```javascript
// Background job to migrate old shares
async function migrateShares() {
  const oldShares = await Share.find({ _migratedToNew: { $ne: true } }).limit(100);

  for (const share of oldShares) {
    // Create new public share
    const publicShare = new PublicShare({
      shareCode: share.shareCode,
      fileId: share.fileId,
      // ... map other fields
    });
    await publicShare.save();

    // Mark as migrated
    await Share.updateOne(
      { _id: share._id },
      { _migratedToNew: true }
    );
  }
}

// Schedule to run periodically
// In production, wrap this in your cron scheduler
```

### Option 2: Clean Slate (New Projects Only)

Delete old schema, implement new one.

```bash
# WARNING: This deletes all data!
db.shares.deleteMany({})
db.files.deleteMany({})
```

---

## Security Considerations

### 1. Password Hashing

All passwords are hashed with bcrypt (12 rounds) before storage. Never stored in plaintext.

```javascript
// Service handles this automatically
const hash = await passwordService.hashPassword(userPassword);
fileDoc.passwordHash = hash;
await fileDoc.save();
```

### 2. Access Tokens

Short-lived JWT tokens (15 minutes default) are generated after password validation.

```javascript
// Only valid for specified duration
const { token, expiresAt } = accessTokenService.generateAccessToken(fileId, userId, 900);
```

### 3. Rate Limiting

Failed password attempts are tracked. After 5 failures, user gets 429 Too Many Requests.

```javascript
// Automatic rate limiting in privateDownload.controller.js
if (failedAttempts >= 5) {
  return next(new AppError('Too many attempts', 429));
}
```

### 4. Cloudinary URL Signing

Signed URLs are generated server-side. Client cannot forge URLs.

```javascript
// URL is signed and expires
const url = cloudinary.url(publicId, {
  sign_url: true,
  sign_version: 2,
  auth_token: authToken,
  end_time: Math.floor(expiryTime.getTime() / 1000),
});
```

### 5. HTTPS Required

All communications should be over HTTPS in production. Consider adding HSTS headers.

---

## Environment Variables

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_AUTH_TOKEN_KEY=your_auth_token_key

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Database
MONGODB_URI=mongodb+srv://...

# Server
NODE_ENV=production
PORT=5000
```

---

## Testing

### Test Public Download

```bash
# 1. Get share metadata
curl http://localhost:5000/api/download/public/ABC123

# 2. Download file (will redirect)
curl -L http://localhost:5000/api/download/public/ABC123/download -o downloaded_file.pdf
```

### Test Private Download (Password Protected)

```bash
# 1. Get file metadata (requires JWT)
curl -H "Authorization: Bearer <jwt_token>" \
  http://localhost:5000/api/download/private/abc123xyz

# 2. Validate password
curl -X POST \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"password":"test123"}' \
  http://localhost:5000/api/download/private/abc123xyz/validate-access

# Response: { accessToken, expiresIn }

# 3. Download file
curl -H "Authorization: Bearer <jwt_token>" \
  -H "X-Access-Token: <access_token_from_step_2>" \
  -L http://localhost:5000/api/download/private/abc123xyz/download -o downloaded_file.pdf
```

---

## Troubleshooting

### Issue: "PDF downloads as raw file"

**Check**:
1. Is Node.js still streaming the file? → Delete streaming code
2. Is Cloudinary URL being generated correctly? → Check `generateDownloadUrl()` in storage.service.js
3. Is `?dl=1` parameter present in URL? → Required for force download

### Issue: Password validation keeps failing

**Check**:
1. Is password hashed before storing? → Should use bcrypt
2. Is comparison done with `await`? → `comparePassword()` is async
3. Is password being trimmed/normalized? → Consider normalizing whitespace

### Issue: Access token keeps expiring

**Check**:
1. Token duration too short? → Change `900` (15 min) to higher value
2. Is token being stored correctly on frontend? → Check localStorage or state management
3. Is token expiry time in seconds or milliseconds? → Should be seconds in JWT

### Issue: "Share not found" error

**Check**:
1. Is share code case-sensitive? → Schema has `uppercase: true`
2. Is share already expired? → Check `expiryTime` in database
3. Is share code format correct? → Should be 6-8 alphanumeric characters

---

## Performance Optimization

### 1. Add Database Indexes

Indexes are defined in models.js. Ensure they're created:

```javascript
// In your database initialization
await Share.collection.createIndex({ shareCode: 1 });
await PrivateFile.collection.createIndex({ uploadedBy: 1, isActive: 1 });
```

### 2. Cloudinary Caching

Cloudinary caches downloads. First request generates signed URL, subsequent requests use cache.

### 3. Rate Limiting

Add express-rate-limit middleware to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many downloads, try again later',
});

app.use('/api/download', downloadLimiter);
```

### 4. TTL Indexes

MongoDB automatically deletes expired shares/files after 30 days (configurable in schema).

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Cloudinary credentials validated
- [ ] JWT secret generated and stored securely
- [ ] HTTPS enabled
- [ ] CORS configured for frontend domain
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Monitoring/alerts set up
- [ ] Database backups enabled
- [ ] Load testing completed
- [ ] Security audit completed

---

## API Documentation

See `downloadRoutes.js` for complete endpoint documentation including:
- Route paths
- Authentication requirements
- Request/response formats
- Error codes
- Usage examples

---

## Support & Questions

This architecture is designed to be:
- ✅ Simple - No streaming complexity
- ✅ Secure - Password hashing, rate limiting, signed URLs
- ✅ Scalable - Stateless backend, Cloudinary handles CDN
- ✅ Maintainable - Clear separation of concerns
- ✅ Tested - Example tests and curl commands provided
