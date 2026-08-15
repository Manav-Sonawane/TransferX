# TransferX Download Architecture Refactoring

## Problem Summary
- PDF/raw files download as raw data when streamed through Node.js
- Node.js pipeline corrupts `Content-Type` headers
- Mixing encrypted file handling with cloud URL routing creates coupling
- Solution: Separate public/guest and authenticated flows entirely

---

## Proposed Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  Download Request                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                ┌──────┴──────┐
                │             │
         [Logged Out]   [Logged In]
                │             │
                ▼             ▼
    ┌─────────────────┐  ┌──────────────────┐
    │  Direct Route   │  │ Validation Route │
    │                 │  │                  │
    │ 1. Validate     │  │ 1. Get password  │
    │    expiry       │  │    from frontend │
    │ 2. Redirect to  │  │ 2. Validate pwd  │
    │    Cloudinary   │  │    hash in DB    │
    │    (302)        │  │ 3. Return temp   │
    │                 │  │    Cloudinary URL│
    └─────────────────┘  │ 4. Frontend      │
                         │    uses URL      │
                         └──────────────────┘
                         
    Both routes: NO streaming through Node
```

---

## Key Design Decisions

### 1. **No Server-Side Streaming**
   - Use HTTP 302 redirects to Cloudinary
   - Preserves Content-Type headers
   - Fixes MIME type detection for PDFs, ZIPs, etc.

### 2. **Password Control ≠ File Encryption**
   - Store file encrypted/unencrypted in Cloudinary (your choice)
   - Control *access* to the Cloudinary URL via password in MongoDB
   - Password protects the *link*, not the file itself
   - If you want file-level encryption: encrypt client-side before upload, store encrypted blob in Cloudinary

### 3. **Temporary Access Tokens**
   - After password validation, return a short-lived signed Cloudinary URL
   - URL expires in 15 minutes (or configurable)
   - Frontend downloads immediately using that URL

### 4. **Session-Based Access (Optional)**
   - After password validation, set a short-lived session cookie/token
   - Allows multiple downloads within time window
   - Or: Require re-validation for each download (stricter)

---

## Data Model Changes

### Public Shares (Logged-out)
```javascript
{
  _id: ObjectId,
  fileId: String,                    // Reference to uploaded file
  shareCode: String,                 // Unique code (6-8 chars)
  cloudinaryPublicId: String,        // Direct link to Cloudinary file
  cloudinaryUrl: String,             // Pre-generated or generated on demand
  expiryTime: Date,
  downloadLimit: Number,
  downloadCount: Number,
  createdAt: Date,
  // NO password for public shares
}
```

### Private Files (Authenticated)
```javascript
{
  _id: ObjectId,
  fileId: String,
  uploadedBy: ObjectId,              // User ID
  cloudinaryPublicId: String,        // File in Cloudinary
  cloudinaryUrl: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  
  // Access control
  isPasswordProtected: Boolean,
  passwordHash: String,              // bcrypt hash of password
  passwordSalt: String,              // bcrypt handles this automatically
  
  // Expiry & limits
  expiryTime: Date,
  downloadLimit: Number,
  downloadCount: Number,
  
  // For tracking validations (optional)
  lastAccessedAt: Date,
  accessTokens: [                    // Temporary tokens after validation
    {
      token: String,
      expiresAt: Date,
      lastUsedAt: Date
    }
  ],
  
  createdAt: Date,
}
```

---

## API Routes

### Public/Guest Downloads

**Route 1: Get share metadata (no auth required)**
```
GET /api/share/:shareCode
Response:
{
  fileName: String,
  fileSize: Number,
  mimeType: String,
  expiryTime: Date,
  downloadCount: Number,
  downloadLimit: Number,
  isPasswordProtected: false,  // Only for public shares
  canDownload: Boolean         // Check expiry & limits
}
```

**Route 2: Initiate download (redirect)**
```
GET /api/share/:shareCode/download
Query: ?token=xyz (optional, for tracking)

Response:
- If valid: HTTP 302 redirect to Cloudinary URL
  Location: https://res.cloudinary.com/...?dl=1
  Headers: 
    X-Accel-Redirect: (if using nginx)
    
- If expired/limit reached: 410 Gone or 403 Forbidden
  {
    error: "Share expired" | "Download limit reached"
  }
```

---

### Authenticated/Private Downloads

**Route 1: Get file metadata (requires auth)**
```
GET /api/files/:fileId
Headers: Authorization: Bearer <jwt>

Response:
{
  fileName: String,
  fileSize: Number,
  mimeType: String,
  expiryTime: Date,
  isPasswordProtected: Boolean,
  requiresValidation: Boolean  // Only show if pwd protected
}
```

**Route 2: Validate password (requires auth)**
```
POST /api/files/:fileId/validate-access
Headers: Authorization: Bearer <jwt>
Body: {
  password: String
}

Response:
- If correct:
  {
    success: true,
    accessToken: String,        // JWT or random token
    expiresIn: 900,             // 15 minutes
    downloadUrl: String         // Cloudinary URL (optional)
  }
  
- If incorrect:
  {
    success: false,
    error: "Invalid password",
    attemptsRemaining: 3
  }
```

**Route 3: Download (requires access token from Route 2)**
```
GET /api/files/:fileId/download
Headers: 
  Authorization: Bearer <jwt>
  X-Access-Token: <token from validation>

Response:
- If valid: HTTP 302 redirect to Cloudinary URL
  Location: https://res.cloudinary.com/...?dl=1
  
- If token expired/invalid: 401 Unauthorized
  {
    error: "Access token expired, please validate password again"
  }
```

---

## Implementation Order

### Phase 1: Route Separation (No logic changes yet)
1. Create `/routes/download/public.js` - for guest downloads
2. Create `/routes/download/private.js` - for authenticated downloads
3. Create `/routes/download/validation.js` - for password validation
4. Update main router to use these

### Phase 2: Database Updates
1. Migrate existing `Shares` collection to separate schema
2. Create `PrivateFiles` collection with password fields
3. Remove any file encryption fields from old schema (or mark as deprecated)

### Phase 3: Storage Service Cleanup
1. Update `generateDownloadUrl()` to ONLY generate signed Cloudinary URLs
2. Remove any Node.js streaming logic
3. Add `?dl=1` parameter for forced downloads
4. Add proper `Content-Disposition` header generation

### Phase 4: Public Download Implementation
1. GET `/api/share/:shareCode` → fetch metadata
2. GET `/api/share/:shareCode/download` → validate expiry + redirect
3. Add download counter increment

### Phase 5: Private Download Implementation
1. POST `/api/files/:fileId/validate-access` → password hash comparison
2. Generate temporary access token (JWT with 15min expiry)
3. GET `/api/files/:fileId/download` → verify token + redirect

### Phase 6: Frontend Integration
1. For public: Simple download link (might be auto-triggered)
2. For private: Show password modal → validate → download with returned URL

### Phase 7: Testing & Edge Cases
1. Test expiry boundaries
2. Test download limits
3. Test concurrent downloads
4. Test password validation attempts (rate limit)
5. Test PDF vs ZIP vs other MIME types

---

## Cloudinary URL Generation Best Practice

```javascript
// For public/direct downloads
function generateDownloadUrl(publicId, options = {}) {
  const cloudinary = require('cloudinary').v2;
  
  const url = cloudinary.url(publicId, {
    // Core settings
    secure: true,
    sign_url: true,
    
    // Force download with correct MIME type
    resource_type: 'auto',  // Let Cloudinary detect
    type: 'upload',
    
    // Download parameters
    download: true,         // Alias for dl=1
    
    // Access control
    sign_version: 2,
    auth_token: {
      key: process.env.CLOUDINARY_AUTH_TOKEN_KEY,
      start_time: Math.floor(Date.now() / 1000),
      duration: 3600,        // 1 hour access window
      end_time: Math.floor((Date.now() + 3600000) / 1000)
    },
    
    // Custom headers (if needed)
    custom_function: options.customFunction,
    
    // Cloudinary transform parameters
    fetch_format: 'auto',   // Optimized format
    quality: 'auto',        // Auto quality
    
    ...options
  });
  
  return url;
}
```

---

## Security Considerations

### Password Validation
```javascript
const bcrypt = require('bcrypt');

// During file save
const passwordHash = await bcrypt.hash(password, 12);
fileDoc.passwordHash = passwordHash;
await fileDoc.save();

// During validation
const isValid = await bcrypt.compare(inputPassword, fileDoc.passwordHash);
if (!isValid) {
  // Log attempt (rate limiting)
  // Return 401
}
```

### Access Token Generation (JWT)
```javascript
const jwt = require('jsonwebtoken');

const accessToken = jwt.sign(
  {
    fileId: fileDoc._id,
    purpose: 'download',
    timestamp: Date.now()
  },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }  // Short-lived
);
```

### Rate Limiting on Password Validation
```javascript
// Track failed attempts in Redis or MongoDB
// Limit to 5 attempts per file per 15 minutes
// After 5 failures: 429 Too Many Requests
```

---

## Migration Path (Minimal Downtime)

### Step 1: Dual-write phase (1-2 days)
- Deploy new `PrivateFiles` schema
- Existing shares continue to work
- New shares use new schema
- No data migration yet

### Step 2: Feature parity (1-2 days)
- Deploy new public/private download routes
- Routes are backward compatible
- Old and new routes coexist

### Step 3: Gradual migration (ongoing)
- Background job: Migrate old shares to new schema
- If share exists in old schema, use old route
- If share exists in new schema, use new route
- No user disruption

### Step 4: Cleanup (after 1-2 weeks)
- All shares migrated
- Deprecate old routes
- Remove old code

---

## Files to Create/Modify

### New Files
```
server/src/routes/download/
  ├── public.js          # Guest downloads
  ├── private.js         # Authenticated downloads
  ├── validation.js      # Password validation
  └── index.js           # Router composition

server/src/controllers/download/
  ├── publicController.js
  ├── privateController.js
  └── validationController.js

server/src/services/
  ├── accessToken.service.js  # Token generation/verification
  └── passwordValidation.service.js  # bcrypt wrapper
```

### Modified Files
```
server/src/models/
  ├── Share.js           # Add new schema or separate
  ├── PrivateFile.js     # New model for authenticated files
  └── User.js

server/src/services/
  ├── storage.service.js # Remove streaming, add redirect
  ├── file.service.js    # Split into public/private logic
  └── cloudinary.service.js  # Generate signed URLs only

server/src/routes/
  └── index.js           # Add new download routes

client/src/components/
  ├── DownloadModal.jsx  # For password validation
  └── PublicDownload.jsx # Simple public download

client/src/pages/
  └── AccessFile.jsx     # Enter code → download/password
```

---

## Key Wins from This Refactor

✅ **No more raw file downloads** - Cloudinary handles MIME types  
✅ **Cleaner separation** - Guest/auth flows independent  
✅ **Password control** - Stored in DB, not on file  
✅ **Better security** - Temporary tokens, rate limiting  
✅ **Simpler debugging** - Redirects are transparent  
✅ **Cloudinary-native** - Leverages their download infrastructure  
✅ **Scalable** - No Node.js memory usage for file streaming  

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking existing shares | Keep old routes during migration period |
| Lost downloads during migration | Dual-write for 1-2 weeks |
| Token expiry too short | Make it configurable, default 15-30min |
| Password brute force | Rate limit + exponential backoff |
| User confusion (password modal) | Clear UX, show password hint |
