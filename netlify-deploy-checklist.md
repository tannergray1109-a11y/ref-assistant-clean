# Netlify Deployment Checklist

## 🚀 Deploy Referee App to Netlify

### Prerequisites ✅
- [x] Repository: `ref-assistant-clean` on GitHub
- [x] All code committed and pushed
- [x] Firebase configuration included
- [x] Calendar integration complete

### Deployment Steps:

#### 1. Access Netlify
- Go to: https://app.netlify.com/start
- Sign in with GitHub account

#### 2. Import Project
- Click "Import an existing project"
- Choose "Deploy with GitHub"
- Select repository: `tannergray1109-a11y/ref-assistant-clean`

#### 3. Build Settings
```
Build command: (leave empty)
Publish directory: (leave empty)
```

#### 4. Deploy
- Click "Deploy site"
- Wait for deployment to complete (~1-2 minutes)

### Post-Deployment:

#### 5. Test Your Site
- [ ] Test main dashboard functionality
- [ ] Test calendar view and game management
- [ ] Test authentication (sign up/sign in)
- [ ] Test mobile responsiveness
- [ ] Test PWA installation

#### 6. Custom Domain (Optional)
- [ ] Add custom domain in Netlify dashboard
- [ ] Update DNS settings with your domain provider

#### 7. Enable HTTPS
- [ ] Verify HTTPS is enabled (automatic with Netlify)

### Firebase Considerations:
- [ ] Update Firebase authorized domains with new Netlify URL
- [ ] Test Firebase authentication on live site
- [ ] Verify Firestore read/write permissions

### Expected Result:
- ✅ Live referee app at: `https://[random-name].netlify.app`
- ✅ Full calendar functionality
- ✅ Firebase authentication working
- ✅ Mobile responsive design
- ✅ PWA installation available

### Troubleshooting:
If deployment fails:
1. Check build logs in Netlify dashboard
2. Ensure all files are committed to repository
3. Verify no syntax errors in JavaScript files

---
Repository: https://github.com/tannergray1109-a11y/ref-assistant-clean
Deployment Date: August 5, 2025
