# Copy-Paste Implementation Checklist

## File Structure to Create

```
server/src/
├── services/
│   ├── storage.service.js           ← COPY: storage.service.js
│   ├── accessToken.service.js       ← COPY: accessToken.service.js
│   └── password.service.js          ← COPY: password.service.js
│
├── controllers/
│   └── download/
│       ├── publicDownload.controller.js    ← COPY: publicDownload.controller.js
│       └── privateDownload.controller.js   ← COPY: privateDownload.controller.js
│
├── routes/
│   └── download.routes.js           ← COPY: downloadRoutes.js
│
├── models/
│   └── Download.js                  ← COPY FROM: models.js (or update existing)
│
├── middleware/
│   ├── auth.middleware.js           ← EXISTING (requireAuth)
│   ├── validation.middleware.js     ← EXISTING (validateRequest)
│   └── asyncHandler.js              ← EXISTING (asyncHandler)
│
└── utils/
    ├── logger.js                    ← EXISTING (logging)
    └── errorHandler.js              ← EXISTING (AppError)
```

---

## Step-by-Step Copy Instructions

### Step 1: Create Directories
```bash
mkdir -p server/src/services
mkdir -p server/src/controllers/download
mkdir -p server/src/routes/download
```

### Step 2: Copy Service Files
```bash
# These are new services
cp storage.service.js server/src/services/
cp accessToken.service.js server/src/services/
cp password.service.js server/src/services/
```

### Step 3: Copy Controller Files
```bash
cp publicDownload.controller.js server/src/controllers/download/
cp privateDownload.controller.js server/src/controllers/download/
```

### Step 4: Copy Routes
```bash
# Rename downloadRoutes.js to download.routes.js
cp downloadRoutes.js server/src/routes/download.routes.js
```

### Step 5: Update Models
```bash
# BACKUP your current models
cp server/src/models/File.js server/src/models/File.js.backup
cp server/src/models/Share.js server/src/models/Share.js.backup

# Replace with new models (or manually integrate)
# Copy content from models.js into your models directory
```

### Step 6: Update Main Server File
```javascript
// server/src/index.js (or server.js)

// Add this after other route imports
const downloadRouter = require('./routes/download.routes');

// Add this in your Express setup (after other middleware)
app.use('/api/download', downloadRouter);
```

---

## Dependency Installation

```bash
npm install bcrypt jsonwebtoken

# If using TypeScript (optional but recommended)
npm install -D @types/express @types/node @types/bcrypt @types/jsonwebtoken
```

---

## Database Migration Checklist

### Option A: Fresh Database
```javascript
// If starting fresh, just create collections
const { Share, PrivateFile, File } = require('./models/Download');

// Create indexes
await Share.collection.createIndex({ shareCode: 1 });
await Share.collection.createIndex({ expiryTime: 1 }, { expireAfterSeconds: 2592000 });
await PrivateFile.collection.createIndex({ uploadedBy: 1, isActive: 1 });
await PrivateFile.collection.createIndex({ sharedWith: 1, isActive: 1 });
```

### Option B: Migrate Existing Database
```javascript
// Migration script - run before deploying
async function migrateToNewSchema() {
  const oldShares = await db.collection('shares').find({}).toArray();
  
  for (const share of oldShares) {
    // Create new public share
    await PublicShare.create({
      shareCode: share.shareCode,
      fileId: share.fileId,
      cloudinaryPublicId: share.cloudinaryPublicId,
      cloudinaryUrl: share.cloudinaryUrl,
      downloadLimit: share.downloadLimit,
      downloadCount: share.downloadCount,
      expiryTime: share.expiryTime,
      createdAt: share.createdAt,
      lastDownloadedAt: share.lastDownloadedAt,
    });
    
    // Mark as migrated
    await db.collection('shares').updateOne(
      { _id: share._id },
      { $set: { _migrationStatus: 'completed' } }
    );
  }
  
  console.log('Migration complete!');
}
```

---

## Environment Variables to Add

Create/update your `.env` file:

```bash
# === CLOUDINARY ===
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_AUTH_TOKEN_KEY=your_auth_token_key_here

# === JWT (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" )
JWT_SECRET=generate_a_random_string_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# === DATABASE ===
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/transferx

# === ENVIRONMENT ===
NODE_ENV=production
PORT=5000
```

---

## Testing Commands (Copy-Paste Ready)

### Test Public Download

```bash
# 1. Get share metadata (no auth required)
curl http://localhost:5000/api/download/public/ABC123

# 2. Download file (will redirect)
curl -L http://localhost:5000/api/download/public/ABC123/download -o myfile.pdf

# 3. Check file downloaded
ls -lh myfile.pdf
file myfile.pdf
```

### Test Private Download (Password Protected)

```bash
# Set variables
JWT_TOKEN="your_jwt_token_here"
FILE_ID="file_id_from_mongodb"

# 1. Get file metadata
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:5000/api/download/private/$FILE_ID

# 2. Validate password
ACCESS_TOKEN=$(curl -s -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password":"test123"}' \
  http://localhost:5000/api/download/private/$FILE_ID/validate-access | jq -r '.accessToken')

echo "Access token: $ACCESS_TOKEN"

# 3. Download with access token
curl -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Access-Token: $ACCESS_TOKEN" \
  -L http://localhost:5000/api/download/private/$FILE_ID/download -o myfile.pdf

# 4. Verify
file myfile.pdf
```

---

## Code Integration Checklist

### Before Running
- [ ] All 6 code files copied to correct directories
- [ ] Database schema updated
- [ ] Routes mounted in Express app
- [ ] Environment variables set
- [ ] Dependencies installed (`npm install bcrypt jsonwebtoken`)
- [ ] Database migrations run (if needed)

### First Run
- [ ] Server starts without errors
- [ ] MongoDB connection works
- [ ] Cloudinary credentials valid
- [ ] Logs show no warnings

### Testing
- [ ] Public download test passes (curl command above)
- [ ] Private download test passes (curl command above)
- [ ] PDF downloads and opens correctly
- [ ] ZIP downloads and extracts correctly
- [ ] Password validation works
- [ ] Access token expires as expected
- [ ] Rate limiting prevents brute force

---

## Common Copy-Paste Mistakes to Avoid

### ❌ Mistake 1: Wrong Import Paths
```javascript
// WRONG
const storage = require('../../storage.service');

// CORRECT (match your directory structure)
const storage = require('../../services/storage.service');
```

### ❌ Mistake 2: Missing Error Handler Imports
```javascript
// Your files use AppError - make sure it exists
const { AppError } = require('../../utils/errorHandler');

// If it doesn't exist, create it or update the import
```

### ❌ Mistake 3: Missing Middleware
```javascript
// Your controllers use requireAuth - ensure it exists
const { requireAuth } = require('../../middleware/auth.middleware');

// If it doesn't exist, create it:
const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
};
```

### ❌ Mistake 4: Incorrect Model Names
```javascript
// Make sure these match your database
const Share = require('../../models/Share'); // or PublicShare
const PrivateFile = require('../../models/PrivateFile');
const File = require('../../models/File');
```

### ✅ Solution: Create Adapter Layer
```javascript
// server/src/models/index.js
module.exports = {
  Share: require('./Share'),
  PrivateFile: require('./PrivateFile'),
  File: require('./File'),
};

// Then in controllers
const { Share, PrivateFile, File } = require('../../models');
```

---

## File Size Reference

| File | Size | Complexity |
|------|------|-----------|
| storage.service.js | ~300 lines | Medium |
| accessToken.service.js | ~150 lines | Low |
| password.service.js | ~200 lines | Low |
| publicDownload.controller.js | ~250 lines | Medium |
| privateDownload.controller.js | ~350 lines | High |
| downloadRoutes.js | ~200 lines | Low |
| models.js | ~400 lines | Medium |
| **Total Code** | **~1,850 lines** | **Ready to use** |

---

## Quick Validation

After copying, verify each file:

```javascript
// Test each service
const storage = require('./services/storage.service');
console.log(typeof storage.generateDownloadUrl); // 'function'

const accessToken = require('./services/accessToken.service');
console.log(typeof accessToken.generateAccessToken); // 'function'

const password = require('./services/password.service');
console.log(typeof password.hashPassword); // 'function'

// Test each controller
const publicController = require('./controllers/download/publicDownload.controller');
console.log(typeof publicController.downloadFile); // 'function'

const privateController = require('./controllers/download/privateDownload.controller');
console.log(typeof privateController.validateAccess); // 'function'

// Test routes
const router = require('./routes/download.routes');
console.log(typeof router.get); // 'function'
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code review completed
- [ ] All tests passing
- [ ] Database backed up
- [ ] Environment variables set correctly
- [ ] Cloudinary credentials rotated (if needed)
- [ ] Monitoring/logging configured

### Deployment
- [ ] Deploy to staging first
- [ ] Run integration tests in staging
- [ ] Monitor error logs for 1 hour
- [ ] Get sign-off from team
- [ ] Deploy to production
- [ ] Monitor error logs for 2 hours
- [ ] Verify users can download files

### Post-Deployment
- [ ] Old code removed (after validation period)
- [ ] Documentation updated
- [ ] Team notified of new API endpoints
- [ ] Analytics updated (if applicable)
- [ ] Support team trained

---

## Rollback Plan

If something goes wrong:

```bash
# 1. Keep old download code available
git checkout HEAD~1 -- server/src/routes/old-download.routes.js

# 2. Revert to old endpoint
app.use('/api/download/old', oldDownloadRouter);

# 3. Point frontend to old endpoint temporarily
// FRONTEND_API_ENDPOINT = '/api/download/old'

# 4. Investigate issue in new code

# 5. Deploy fix

# 6. Redirect to new endpoint
// FRONTEND_API_ENDPOINT = '/api/download'
```

---

## Success Criteria

✅ You've implemented correctly if:

- [ ] PDFs download as PDFs (not raw binary)
- [ ] ZIPs download as ZIPs
- [ ] Both public and private downloads work
- [ ] Password validation works
- [ ] Access tokens expire as expected
- [ ] Rate limiting prevents brute force
- [ ] Download counters increment correctly
- [ ] Expired shares return 410 Gone
- [ ] Download limits are enforced
- [ ] No file streaming through Node.js (verify with monitoring)
- [ ] Server memory usage stays constant (no buffering)
- [ ] Concurrent downloads work smoothly

---

## Documentation References

For more details, see:
- **IMPLEMENTATION_SUMMARY.md** - Overview and timeline
- **ROOT_CAUSE_ANALYSIS.md** - Why old code failed
- **REFACTORING_PLAN.md** - Detailed architecture
- **INTEGRATION_GUIDE.md** - Complete setup guide

---

## File Naming Convention

Make sure filenames match exactly:

```
✅ Correct Filenames:
- storage.service.js
- accessToken.service.js
- password.service.js
- publicDownload.controller.js
- privateDownload.controller.js
- download.routes.js (not downloadRoutes.js)

❌ Wrong Filenames:
- StorageService.js (wrong case)
- storage-service.js (wrong separator)
- downloadRoutes.js (wrong format - should be download.routes.js)
```

---

## After Copying - Next Steps

1. **Run tests** - Use curl commands above
2. **Check logs** - Look for connection errors
3. **Monitor database** - Verify documents are created
4. **Check Cloudinary** - Verify URLs are being generated
5. **Test frontend** - Verify downloads work in browser
6. **Load test** - Try concurrent downloads
7. **Edge cases** - Test expiry, limits, wrong passwords

---

## Quick Links

| What | Where |
|------|-------|
| Copy public download code | `publicDownload.controller.js` |
| Copy private download code | `privateDownload.controller.js` |
| Copy Cloudinary integration | `storage.service.js` |
| Copy password hashing | `password.service.js` |
| Copy token management | `accessToken.service.js` |
| Copy all routes | `downloadRoutes.js` |
| Copy database models | `models.js` |
| Read detailed guide | `INTEGRATION_GUIDE.md` |
| Understand why this works | `ROOT_CAUSE_ANALYSIS.md` |
| Get full architecture | `REFACTORING_PLAN.md` |

---

**Ready to implement?** Start with Step 1 above. You got this! 🚀
