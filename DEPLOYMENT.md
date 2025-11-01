# Deployment Guide for P2P Operations Dashboard

## 🎯 Quick Start Deployment to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Firebase project set up

### Step-by-Step Deployment

#### 1. Prepare Your Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - P2P Dashboard v2.0"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/p2p-dashboard.git
git branch -M main
git push -u origin main
```

#### 2. Deploy to Vercel

**Option A: Vercel CLI**
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? p2p-ops-dashboard
# - Directory? ./
# - Override settings? N

# Add environment variables
vercel env add VITE_FIREBASE_API_KEY
# Enter your Firebase API key when prompted

# Repeat for all environment variables:
# - VITE_FIREBASE_AUTH_DOMAIN
# - VITE_FIREBASE_PROJECT_ID
# - VITE_FIREBASE_STORAGE_BUCKET
# - VITE_FIREBASE_MESSAGING_SENDER_ID
# - VITE_FIREBASE_APP_ID

# Deploy to production
vercel --prod
```

**Option B: Vercel Dashboard**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variables:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
5. Click "Deploy"

#### 3. Post-Deployment Setup

1. **Update Firebase Authorization**
   - Go to Firebase Console > Authentication > Settings
   - Add your Vercel domain to Authorized domains
   - Example: `your-project.vercel.app`

2. **Test Deployment**
   - Visit your Vercel URL
   - Try logging in
   - Test creating a device
   - Test cloud sync

3. **Set Custom Domain** (Optional)
   - Go to Vercel Dashboard > Your Project > Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123:web:abc` |

## 🚀 Alternative Deployment Options

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build the project
npm run build

# Deploy
netlify deploy

# When prompted:
# - Create new site
# - Publish directory: dist

# Set environment variables in Netlify UI
# Dashboard > Site settings > Environment > Environment variables

# Deploy to production
netlify deploy --prod
```

### GitHub Pages (Not Recommended for Firebase apps)

GitHub Pages doesn't support server-side environment variables, so you'd need to expose Firebase credentials in the code, which is a security risk.

### Self-Hosted (VPS/Server)

```bash
# Build the project
npm run build

# The dist/ folder contains your static files
# Serve them with any web server:

# Using serve
npx serve dist -l 3000

# Using nginx
# Copy dist/ contents to /var/www/html
# Configure nginx to serve the SPA

# Using Apache
# Copy dist/ contents to /var/www/html
# Add .htaccess for SPA routing
```

## 🔐 Security Checklist

- [ ] Environment variables are set in Vercel (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] Firebase security rules are configured
- [ ] Authorized domains are updated in Firebase
- [ ] User authentication is working
- [ ] HTTPS is enabled (automatic on Vercel)

## 📊 Monitoring and Analytics

### Add Vercel Analytics

```bash
npm install @vercel/analytics
```

In `src/main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

// Add to render:
<Analytics />
```

### Firebase Analytics

Already included in Firebase SDK. View analytics in Firebase Console.

## 🐛 Common Deployment Issues

### Issue: Build fails with "Module not found"
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Environment variables not working
**Solution**: 
- Ensure all variables start with `VITE_`
- Redeploy after adding variables
- Check Vercel deployment logs

### Issue: Firebase authentication fails
**Solution**:
- Add Vercel domain to Firebase authorized domains
- Check Firebase console for errors
- Verify credentials are correct

### Issue: "Failed to fetch" errors
**Solution**:
- Check Firebase security rules
- Verify user is authenticated
- Check browser console for CORS errors

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your repository:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Vercel will automatically:
# 1. Pull the changes
# 2. Build the project
# 3. Deploy to production
```

## 📈 Performance Optimization

The production build already includes:
- Code splitting
- Minification
- Tree shaking
- Asset optimization

Monitor performance in Vercel Analytics dashboard.

## 🆘 Rollback Procedure

If you need to rollback:

1. **Via Vercel Dashboard**:
   - Go to Deployments
   - Find previous working deployment
   - Click "Promote to Production"

2. **Via Git**:
   ```bash
   git revert HEAD
   git push
   # Vercel will auto-deploy the reverted version
   ```

## 📞 Support

For deployment issues:
- Check Vercel deployment logs
- Review Firebase Console logs
- Check browser developer console

---

**Happy Deploying! 🚀**
