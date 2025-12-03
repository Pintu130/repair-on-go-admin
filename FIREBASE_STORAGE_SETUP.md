# Firebase Storage Rules Setup - CORS Error Fix

CORS error fix karne ke liye Firebase Storage rules configure karein:

## Steps:

### 1. Firebase Console me Storage Rules Update Karein:

1. Firebase Console me jayein: https://console.firebase.google.com
2. Apna project select karein (`repairongo-b8919`)
3. Left sidebar me **"Storage"** section me jayein
4. **"Rules"** tab select karein
5. Neeche diye gaye rules copy karein aur paste karein:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Customers images - authenticated users only
    match /customers/{customerId}/{allPaths=**} {
      // Allow read and write for authenticated users
      allow read, write: if request.auth != null;
    }
    
    // Allow all authenticated users to access their own data
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. **"Publish"** button click karein

### 2. Important Notes:

- **Authenticated Users**: Rules me `request.auth != null` check karein
- **Firebase Auth**: User Firebase Auth me authenticated hona chahiye
- **CORS**: Firebase SDK automatically CORS handle karta hai if rules properly set hain

### 3. Development ke liye (Temporary - NOT for Production):

Agar development ke liye quickly test karna hai:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // ⚠️ Only for development
    }
  }
}
```

**⚠️ Warning**: Production me yeh rules use mat karein - security risk hai!

## After Rules Update:

1. Rules update karein
2. Page refresh karein
3. Customer create/edit karein
4. Image upload test karein

## Common Issues:

1. **CORS Error**: Storage rules me authentication required hai but user authenticated nahi hai
2. **Unauthorized Error**: Storage rules properly configured nahi hain
3. **Preflight Failed**: Storage bucket me CORS configuration missing hai

## Solution:

Firebase SDK automatically handles CORS, but Storage rules properly set hone chahiye. Rules me authenticated users ko allow karein.

