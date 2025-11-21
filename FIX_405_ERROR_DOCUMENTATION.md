# Fix 405 Error - Admin Content Editor

## 🔴 Vấn Đề Ban Đầu

Khi save/edit content trong admin panel (About, Blog, Projects), gặp lỗi:
```
PUT /api/admin/content/about → 405 Method Not Allowed
Error: "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
```

### Nguyên Nhân Gốc Rễ

1. **Missing OPTIONS handler** - Không có handler cho CORS preflight requests
2. **Missing runtime configuration** - Một số routes không có `export const runtime = 'nodejs'`
3. **Poor error handling** - Frontend crash khi response không phải JSON
4. **Data consistency risk** - EN/VI tabs có thể bị mismatch khi save fail

---

## ✅ Các Thay Đổi Đã Thực Hiện

### 1. Backend API Routes - Thêm OPTIONS Handler & Runtime Config

#### Files Modified:

1. **`app/api/admin/content/about/route.ts`**
   - ✅ Added `export const runtime = 'nodejs'`
   - ✅ Added OPTIONS handler for PUT method

2. **`app/api/admin/content/blog/[id]/route.ts`**
   - ✅ Added `export const runtime = 'nodejs'`
   - ✅ Added OPTIONS handler for PUT, DELETE methods

3. **`app/api/admin/content/projects/[id]/route.ts`**
   - ✅ Added `export const runtime = 'nodejs'`
   - ✅ Added OPTIONS handler for PUT, DELETE methods

4. **`app/api/admin/videos/[id]/route.ts`**
   - ✅ Added OPTIONS handler for PUT, PATCH, DELETE methods
   - ℹ️ Already had `runtime = 'nodejs'`

5. **`app/api/admin/documents/[id]/route.ts`**
   - ✅ Added OPTIONS handler for PATCH, DELETE methods
   - ℹ️ Already had `runtime = 'nodejs'`

6. **`app/api/admin/vectors/route.ts`**
   - ✅ Added OPTIONS handler for DELETE method
   - ℹ️ Already had `runtime = 'nodejs'`

**Code Pattern Added:**
```typescript
// Force Node.js runtime for PUT/POST/DELETE support
export const runtime = 'nodejs'

/**
 * OPTIONS - Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

---

### 2. Frontend Pages - Improved Error Handling

#### Files Modified:

1. **`app/admin/content/about/page.tsx`**
   - ✅ Fixed `handleSave()` error handling (line 168-179)
   - ✅ Fixed CV upload error handling (line 76-85)
   - ✅ Fixed photo upload error handling (line 475-484)

2. **`app/admin/content/blog/[id]/page.tsx`**
   - ✅ Fixed `handleSave()` error handling (line 298-322)

3. **`app/admin/content/projects/[id]/page.tsx`**
   - ✅ Fixed `handleSave()` error handling (line 242-266)

**Code Pattern Added:**
```typescript
if (!response.ok) {
  // Safely parse error response
  let errorMessage = 'Save failed'
  try {
    const errorData = await response.json()
    errorMessage = errorData.error || `Server error: ${response.status} ${response.statusText}`
  } catch (parseError) {
    // Response is not JSON (e.g., 405 Method Not Allowed)
    errorMessage = `Server error: ${response.status} ${response.statusText}`
  }
  throw new Error(errorMessage)
}
```

**Benefits:**
- ✅ Không crash khi response không phải JSON
- ✅ Hiển thị error message chi tiết (status code + status text)
- ✅ Log error ra console để debug
- ✅ Better UX với toast notifications

---

## 🧪 Cách Test Trên Localhost

### Step 1: Pull Code Về Máy

```bash
# Navigate to your project folder
cd /path/to/hungreo-website

# Pull latest changes from GitHub
git pull origin claude/fix-admin-json-error-01LtFVZNaZaV6nvgkL8LZ6xp

# Or if you're on a different branch
git fetch origin
git checkout claude/fix-admin-json-error-01LtFVZNaZaV6nvgkL8LZ6xp
```

### Step 2: Install Dependencies (nếu cần)

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Chạy Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Server sẽ chạy tại: `http://localhost:3000`

### Step 4: Test Các Tính Năng

#### Test 1: About Page Editor

1. Mở browser: `http://localhost:3000/admin/content/about`
2. Login nếu chưa login
3. Edit tab **English**:
   - Thay đổi Name, Role, Intro
   - Click **Save**
   - ✅ Xem có lỗi 405 không
   - ✅ Xem error message có rõ ràng không
   - ✅ Kiểm tra console logs

4. Refresh page, xem data có save được không

5. Switch sang tab **Vietnamese**:
   - Thay đổi Name, Role, Intro
   - Click **Save**
   - ✅ Kiểm tra tương tự

6. Verify consistency:
   - Refresh page
   - Kiểm tra EN và VI tabs
   - ✅ Data có match với nhau không?

#### Test 2: Blog Editor

1. Mở: `http://localhost:3000/admin/content/blog`
2. Click vào một blog post bất kỳ
3. Edit tab English → Save
4. Edit tab Vietnamese → Save
5. ✅ Kiểm tra không có lỗi 405
6. ✅ Verify data được save đúng

#### Test 3: Projects Editor

1. Mở: `http://localhost:3000/admin/content/projects`
2. Click vào một project bất kỳ
3. Edit tab English → Save
4. Edit tab Vietnamese → Save
5. ✅ Kiểm tra không có lỗi 405
6. ✅ Verify data được save đúng

#### Test 4: CV Upload

1. Mở: `http://localhost:3000/admin/content/about`
2. Upload một file CV (PDF hoặc DOCX)
3. ✅ Kiểm tra upload thành công
4. ✅ Kiểm tra data được parse đúng
5. Click Save
6. ✅ Verify data được lưu

#### Test 5: Photo Upload

1. Mở: `http://localhost:3000/admin/content/about`
2. Upload profile photo
3. ✅ Kiểm tra upload thành công
4. ✅ Xem ảnh hiển thị
5. Click Save
6. ✅ Verify data được lưu

---

## 🔍 Các Điểm Cần Kiểm Tra

### Browser Console Logs

Khi test, mở **DevTools Console** (F12) và kiểm tra:

✅ **Successful Save:**
```
[Console] About page saved successfully!
[Network] PUT /api/admin/content/about → 200 OK
```

❌ **Failed Save (before fix):**
```
[Console] Error: Failed to execute 'json' on 'Response': Unexpected end of JSON input
[Network] PUT /api/admin/content/about → 405 Method Not Allowed
```

✅ **Failed Save (after fix):**
```
[Console] Save error: Error: Server error: 405 Method Not Allowed
[Toast] Server error: 405 Method Not Allowed
[Network] PUT /api/admin/content/about → 405 (but with proper error handling)
```

### Network Tab

1. Mở **DevTools Network Tab** (F12 → Network)
2. Click Save
3. Tìm request: `PUT /api/admin/content/about`
4. Kiểm tra:
   - ✅ Status code: `200 OK` (not 405)
   - ✅ Response Type: `application/json`
   - ✅ Response body có data
   - ✅ Request headers có `Content-Type: application/json`

### Database/File Check

Sau khi save, kiểm tra file:
```bash
# Check about.json
cat content/about.json | jq .

# Should see updated data with timestamp
{
  "id": "about",
  "version": "1.0.0",
  "updatedAt": 1732179600000,  # ← Should be recent
  "updatedBy": "your-email@example.com",
  "hero": {
    "en": { "name": "...", ... },
    "vi": { "name": "...", ... }
  }
}
```

---

## 🚨 Troubleshooting

### Vấn Đề 1: Vẫn gặp lỗi 405 trên localhost

**Nguyên nhân:** Code chưa được pull đầy đủ

**Giải pháp:**
```bash
# Verify branch
git branch
# Should show: * claude/fix-admin-json-error-01LtFVZNaZaV6nvgkL8LZ6xp

# Check if all files are updated
git status
# Should show: "Your branch is up to date"

# If not, pull again
git pull origin claude/fix-admin-json-error-01LtFVZNaZaV6nvgkL8LZ6xp

# Restart dev server
npm run dev
```

### Vấn Đề 2: Error message vẫn không rõ ràng

**Kiểm tra:** Frontend code có được update không?

```bash
# Check if error handling code exists
grep -n "Safely parse error response" app/admin/content/about/page.tsx

# Should return line number if fix is applied
```

### Vấn Đề 3: EN/VI data bị mismatch

**Nguyên nhân:** Save fail nhưng browser state vẫn giữ data

**Giải pháp:**
1. Refresh page trước khi edit
2. Chỉ edit một tab, save, rồi mới edit tab kia
3. Kiểm tra console logs để verify save thành công

### Vấn Đề 4: Upload CV/Photo fail

**Kiểm tra:**
```bash
# Check if upload routes have runtime config
grep -n "export const runtime" app/api/admin/content/about/upload-cv/route.ts
grep -n "export const runtime" app/api/admin/content/about/upload-photo/route.ts

# Check file size limits
# CV: Max 20MB
# Photo: Max 5MB
```

---

## 📊 Expected Test Results

| Test Case | Before Fix | After Fix |
|-----------|------------|-----------|
| Save About (EN) | ❌ 405 Error | ✅ 200 OK |
| Save About (VI) | ❌ 405 Error | ✅ 200 OK |
| Save Blog | ❌ 405 Error | ✅ 200 OK |
| Save Project | ❌ 405 Error | ✅ 200 OK |
| Upload CV | ❌ Possible 405 | ✅ 200 OK |
| Upload Photo | ❌ Possible 405 | ✅ 200 OK |
| Error Message | ❌ JSON parse crash | ✅ Clear message |
| EN/VI Consistency | ⚠️ Risk of mismatch | ✅ Better handling |

---

## 🎯 Summary of Changes

### Backend (6 files)
- ✅ Added OPTIONS handlers to handle CORS preflight
- ✅ Added `runtime = 'nodejs'` for PUT/DELETE support
- ✅ Covers: About, Blog, Projects, Videos, Documents, Vectors

### Frontend (3 files)
- ✅ Improved error handling with try-catch for JSON parsing
- ✅ Added detailed error messages with status codes
- ✅ Added console logging for debugging
- ✅ Covers: About, Blog, Projects editors

### Total Files Modified: **9 files**

---

## 📝 Notes for Production Deployment

### Vercel Configuration

Đảm bảo Vercel hiểu các route handlers:

**Option 1: Check vercel.json**
```json
{
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  },
  "functions": {
    "app/api/admin/**/*.ts": {
      "runtime": "nodejs20.x"
    }
  }
}
```

**Option 2: Environment Variables**

Kiểm tra env vars trên Vercel dashboard:
- `NODE_ENV=production`
- All API keys và secrets đã set đúng

**Option 3: Build Configuration**

```bash
# Check build output
npm run build

# Should see:
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Collecting build traces
```

### Testing on Vercel Preview

Sau khi push code lên GitHub:

1. Vercel sẽ tự động deploy preview
2. Check deployment logs
3. Test trên preview URL
4. Verify 405 errors đã fix

### Rollback Plan

Nếu có vấn đề trên production:

```bash
# Revert to previous commit
git log --oneline  # Find previous commit hash
git revert <commit-hash>
git push origin claude/fix-admin-json-error-01LtFVZNaZaV6nvgkL8LZ6xp
```

---

## 🎉 Success Criteria

Test sẽ được coi là **THÀNH CÔNG** khi:

1. ✅ Tất cả save operations trả về `200 OK` (không còn 405)
2. ✅ Error messages rõ ràng và không crash browser
3. ✅ EN/VI data consistency được đảm bảo
4. ✅ Upload CV/Photo hoạt động bình thường
5. ✅ Console logs không có errors
6. ✅ Network tab không có failed requests
7. ✅ Data được persist đúng trong database/files
8. ✅ User experience mượt mà, không có unexpected behaviors

---

## 🆘 Contact & Support

Nếu gặp vấn đề khi test:

1. Kiểm tra console logs (F12)
2. Kiểm tra network tab
3. Verify code đã được pull đúng
4. Restart dev server
5. Clear browser cache
6. Try incognito mode

**Happy Testing! 🚀**

---

**Last Updated:** 2025-11-21
**Branch:** `claude/fix-admin-json-error-01LtFVZNaZaV6nvgkL8LZ6xp`
**Status:** ✅ Ready for Testing
