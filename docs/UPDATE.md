# Update Log - Cloudinary Download Issues for Raw Files

## Problem Statement
Cloudinary download of uploaded files isn't working properly, especially with raw files like PDF or ZIP.

---

## Identified Issues and Bugs

### **Bug 1: `format` field not populated during upload for raw files**
- **File**: `server/src/services/file.service.js:51`
- **Code**: `format: uploadResult.format || null`
- **Issue**: The `format` field depends on what Cloudinary returns in the upload result. For raw files (PDF, ZIP), Cloudinary may not always populate the `format` field. If `uploadResult.format` is undefined, `file.format` will be `null`.
- **Impact**: While the downstream `generateDownloadUrl` function handles `file.format === null` correctly (by omitting the format parameter for raw files), this creates uncertainty about whether Cloudinary properly identifies the file type during download.

### **Bug 2: `format` parameter duplicated for raw files in download URL**
- **File**: `server/src/services/storage.service.js:70`
- **Code**: `if (file.resourceType !== 'raw' && file.format)`
- **Issue**: Raw files already include their extension in `publicId`. Passing `format` as a URL option makes Cloudinary append that extension a second time (for example, `document.pdf.pdf`), which results in an inaccessible download URL.
- **Fix**: Only pass `format` for image/video assets, whose public IDs do not include an extension. Raw assets rely on the extension stored in `publicId`.

### **Bug 3: MIME type classification might not correctly identify all raw files**
- **File**: `server/src/storage/cloudinaryStorage.js:10-14`
- **Code**: `getResourceType` function
- **Issue**: The function classifies files based on MIME type prefixes:
  - `image/` → `image`
  - `video/` or `audio/` → `video`
  - Everything else → `raw`
- **Problem**: Some file types might have MIME types that don't fit these categories. For example:
  - PDF files might have MIME type `application/pdf` (correctly falls through to `raw`)
  - But some specialized PDF or archive MIME types might behave unexpectedly
- **Impact**: Incorrect resource type could lead to wrong URL generation or Cloudinary delivery parameters.

### **Bug 4: `format` field existence ignored for raw files**
- **File**: `server/src/services/storage.service.js:70`
- **Code**: `if (file.resourceType !== 'raw' && file.format)`
- **Issue**: Even if `file.format` is populated (e.g., `file.format = "pdf"`), it is **still ignored** for raw files because the condition `file.resourceType !== 'raw'` evaluates to `false`.
- **Resolution**: Ignoring `format` for raw files is intentional and prevents duplicate extensions.

### **Bug 5: Possible publicId extension format mismatch**
- **File**: `server/src/storage/cloudinaryStorage.js:36-38`
- **Code**: `publicId = ${cleanName}_${uniqueSuffix}${ext}` (for raw files)
- **Issue**: The publicId for raw files explicitly includes the original extension (e.g., `myfile_1234567890.pdf`).
- **Problem**: If the extension extraction fails or produces an unexpected format (e.g., uppercase `.PDF` vs `.pdf`), Cloudinary might not recognize the file type correctly.
- **Impact**: Download URL might not trigger the correct content-type or force download behavior.

### **Bug 6: No fallback format parameter for raw files**
- **File**: `server/src/services/storage.service.js:68-72`
- **Code**: 
  ```javascript
  if (file.resourceType !== 'raw' && file.format) {
      options.format = file.format;
  }
  ```
- **Issue**: There's no fallback mechanism if the publicId-based format detection fails. For raw files, the format parameter is simply omitted entirely.
- **Potential Solution**: Consider adding a fallback that includes `format` for raw files if `file.format` is available, or implement additional validation to ensure the download URL is valid.

---

## Root Cause Summary

The primary issue was the **duplicate format suffix for raw files** in `generateDownloadUrl`. Cloudinary raw uploads already store the extension in `publicId`; adding `format` again generated paths such as `document.pdf.pdf`.

---

## Recommended Fixes

1. **Keep `generateDownloadUrl` from adding `format` to raw-file URLs**:
   ```javascript
   // Current (line 70-72):
   if (file.resourceType !== 'raw' && file.format) {
       options.format = file.format;
   }
   
   ```
   Raw public IDs already contain their extension.

2. **Keep raw public IDs extension-qualified** during upload.
3. **Keep regression coverage** ensuring a raw PDF URL never contains `.pdf.pdf`.

---

## Files Modified

- `docs/UPDATE.md` - This document (newly created)