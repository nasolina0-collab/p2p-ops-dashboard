# Quick Start Guide for Team Members 🚀

## For Your Colleague (Non-Technical Setup)

### If App is Already Deployed (Easiest!)

Your colleague just needs to:

1. **Get the URL** - You'll send them the deployed app URL (e.g., `https://p2p-dashboard.vercel.app`)

2. **Open the app** - Just click the link, no installation needed!

3. **Pull data on first visit:**
   - Click the blue "Pull" button in the top right
   - This downloads all your data to their browser
   - They'll see all devices and accounts you've created

4. **Start working:**
   - Make changes (add accounts, update balances, etc.)
   - Click green "Push" button to save to cloud
   - Enable "Auto-sync (10s)" for automatic saving

### Best Practices for Team Work

#### When Starting Work:
1. **Always Pull first** - Get latest data from cloud
2. This ensures you see your colleague's updates

#### During Work:
- **Option A:** Enable "Auto-sync" - Changes push automatically after 10 seconds
- **Option B:** Manually click "Push" after important changes

#### When Finishing:
- **Push your changes** - Ensure everything is saved to cloud

### Common Workflow Example

**You (Person 1):**
1. Open app
2. Pull data (to get colleague's updates)
3. Add 5 new accounts
4. Update some balances
5. Push to cloud
6. Close app

**Your Colleague (Person 2):**
1. Opens app later
2. Pulls data (sees your 5 new accounts!)
3. Updates more balances
4. Adds transaction notes
5. Pushes to cloud

**You (Person 1) - Next Day:**
1. Opens app
2. Pulls data (sees colleague's updates!)
3. Continue working...

### 💡 Pro Tips

- **Auto-sync is convenient** but remember to Pull when you start!
- **The last person to Push wins** - communication is key if editing same account
- **Use notes field** to communicate with team (e.g., "Checked - looks good -John")
- **Export CSV regularly** as backup

---

## For Developers (Technical Setup)

### Setup on Another Computer

1. **Get the project files:**
   - Receive the ZIP file or clone from Git
   - Extract to a folder

2. **Install Node.js:**
   - Download from [nodejs.org](https://nodejs.org)
   - Install version 18 or higher

3. **Open terminal in project folder:**
   ```bash
   cd path/to/p2p-ops-dashboard
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start the app:**
   ```bash
   npm run dev
   ```

6. **Open browser:**
   - Go to `http://localhost:5173`
   - Click "Pull" to get data from cloud

### If You Need Your Own Firebase Project

1. **Create Firebase project:**
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - Create new project
   - Enable Firestore Database

2. **Get credentials:**
   - Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the config values

3. **Update `.env` file:**
   ```env
   VITE_FIREBASE_API_KEY=your_new_key
   VITE_FIREBASE_AUTH_DOMAIN=your_new_domain
   # ... etc
   ```

4. **Restart dev server**

---

## Troubleshooting

### "I don't see any data!"
**Solution:** Click the "Pull" button to download from cloud

### "Push button doesn't work"
**Solution:** 
1. Check browser console (F12) for errors
2. Verify internet connection
3. Try refreshing page and pulling first

### "My changes disappeared"
**Solution:**
1. Check if someone else pushed after you
2. Last push overwrites previous data
3. Communication is key!

### "Browser shows old version"
**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear cache
3. Try incognito mode

---

## Data Safety

### Your data is stored in 2 places:
1. **Browser localStorage** - Your local copy (survives page refresh)
2. **Firebase Cloud** - Shared copy (syncs between team)

### To backup data:
- Click "CSV" button to download spreadsheet
- Click "JSON" button to download full backup
- Keep backups before major changes!

### Data is NOT lost if:
- You close browser ✅
- You refresh page ✅
- Computer restarts ✅

### Data CAN be lost if:
- You clear browser data ⚠️
- You don't push to cloud before switching computers ⚠️

**Always Push before leaving work!**

---

## Support

### Need help?
1. Check browser console (F12 → Console tab)
2. Look for red error messages
3. Copy error and share with team

### Common errors:
- **"Firebase not configured"** - Environment variables missing
- **"Network error"** - Check internet connection
- **"Permission denied"** - Firebase security rules issue

---

## Quick Reference

### Button Guide
- 🔵 **Pull** - Download data from cloud (do this first!)
- 🟢 **Push** - Upload your data to cloud (do this last!)
- 🟣 **Import** - Load JSON backup
- 🟣 **JSON** - Export full backup
- 🔷 **CSV** - Export spreadsheet

### Keyboard Shortcuts
- **Ctrl+F** - Search (in browser)
- **F12** - Open developer console
- **F5** - Refresh page
- **Ctrl+Shift+R** - Hard refresh (clear cache)

---

**Remember:** Communication is key when working together. Always Pull → Work → Push!

Good luck! 🎉
