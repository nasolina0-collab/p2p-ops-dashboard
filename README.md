# P2P Operations Dashboard

A comprehensive web application for managing P2P banking operations with real-time synchronization, device management, and transaction tracking.

## 🚀 Features

- **🔐 Firebase Authentication** - Secure user login
- **☁️ Cloud Sync** - Real-time data synchronization with Firebase
- **💾 Offline Support** - Works with localStorage as backup
- **📱 Responsive Design** - Works on all devices
- **🎨 Modern UI** - Beautiful gradient design with glassmorphism
- **📊 Real-time Stats** - Track balances, monthly limits, and transactions
- **🔍 Advanced Filtering** - Search and filter by device, bank, and status
- **📈 Monthly Limits** - Track and visualize monthly transaction limits
- **💸 Transaction History** - Complete "outs" transaction tracking
- **⚡ Auto-sync** - Automatic cloud synchronization

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase account
- Vercel account (for deployment)

## 🛠️ Setup Instructions

### 1. Clone/Extract the Project

```bash
cd p2p-ops-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

#### Option A: Use Existing Firebase Project

The project is already configured with Firebase credentials in `.env`. If you want to use these, skip to step 4.

#### Option B: Set Up New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Authentication** > Sign-in method > Email/Password
4. Enable **Firestore Database** > Create database
5. Go to Project Settings > General > Your apps
6. Copy your Firebase configuration
7. Update `.env` file with your credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Create Firebase User

You need to create at least one user account in Firebase:

1. Go to Firebase Console > Authentication > Users
2. Click "Add user"
3. Enter email and password
4. This will be your login credentials

### 5. Set Up Firestore Rules

In Firebase Console > Firestore Database > Rules, set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This ensures only authenticated users can access data.

### 6. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 📦 Building for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## 🌐 Deployment to Vercel

### Method 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts and add environment variables when asked

4. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all `VITE_FIREBASE_*` variables

### Method 2: Using Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. Click "Deploy"

## 🔧 Configuration

### Environment Variables

All Firebase configuration is stored in environment variables for security:

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

### Bank Configuration

Edit `src/utils/constants.ts` to modify:
- Available banks
- Monthly limits per bank
- FOP limit
- Auto-sync delay

## 📖 Usage Guide

### Login
1. Open the app
2. Enter your Firebase user credentials
3. Click "Sign In"

### Managing Devices
1. Click "Devices" button
2. Enter device name
3. Check "FOP" if it's a FOP account (500,000 ₴ limit)
4. Click "Add Device"

### Adding Accounts
1. Click "+ Account" button
2. Select device
3. Select bank
4. Click "Add Account"

### Recording Transactions ("Outs")
1. Find the account card
2. Click "Add Out"
3. Enter amount and optional note
4. Click "Save"

### Cloud Sync
- **Manual Push**: Click "Push" to upload local data to cloud
- **Manual Pull**: Click "Pull" to download cloud data
- **Auto-sync**: Enable checkbox for automatic synchronization

### Resetting Data
1. Click "Reset" button
2. Select what to reset (balance, active status, outs, notes, monthly received)
3. Click "Reset Selected"
4. **Warning**: This cannot be undone!

## 🐛 Troubleshooting

### Login Issues
- Verify user exists in Firebase Authentication
- Check Firebase credentials in `.env`
- Ensure Email/Password authentication is enabled in Firebase

### Sync Issues
- Check internet connection
- Verify Firestore rules allow authenticated access
- Check browser console for errors

### Build Issues
- Delete `node_modules` and run `npm install` again
- Clear build cache: `rm -rf dist .vite`
- Ensure Node.js version is 18+

## 🔒 Security Notes

- Never commit `.env` file to version control
- Keep Firebase credentials secure
- Use Firestore security rules to protect data
- Regularly rotate Firebase API keys if exposed

## 📚 Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Firebase** - Authentication & Database
- **Lucide React** - Icons

## 🆘 Support

For issues or questions:
1. Check Firebase Console for errors
2. Review browser console logs
3. Verify all environment variables are set correctly

## 📝 License

This project is for private use.

---

**Made with ❤️ for P2P Operations Management**
