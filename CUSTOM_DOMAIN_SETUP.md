# Custom Domain Setup for refassistant.com

## Current Status
✅ **Website Deployed:** https://ref-assistant-clean.web.app
✅ **All functionality working:** Authentication, Game Management, Navigation

## Steps to Add Custom Domain (refassistant.com)

### 1. Add Domain in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/project/ref-assistant-clean/hosting)
2. Click on **Hosting** in the left sidebar
3. Click on **Add custom domain**
4. Enter: `refassistant.com`
5. Follow the verification steps

### 2. DNS Configuration
You'll need to update your DNS records with your domain provider (where you purchased refassistant.com):

#### Option A: If using A records
```
Type: A
Name: @
Value: [Firebase will provide the IP addresses]
TTL: 3600 (or default)

Type: A  
Name: www
Value: [Firebase will provide the IP addresses]
TTL: 3600 (or default)
```

#### Option B: If using CNAME (recommended)
```
Type: CNAME
Name: @
Value: ref-assistant-clean.web.app
TTL: 3600 (or default)

Type: CNAME
Name: www  
Value: ref-assistant-clean.web.app
TTL: 3600 (or default)
```

### 3. SSL Certificate
Firebase will automatically provision an SSL certificate for your custom domain once the DNS is properly configured. This may take up to 24 hours.

### 4. Verification Steps
1. **Domain Ownership:** Firebase will provide a TXT record to add to your DNS to verify ownership
2. **DNS Propagation:** Wait for DNS changes to propagate (can take 24-48 hours)
3. **SSL Provisioning:** Firebase will automatically issue SSL certificates

## Current Deployment URLs
- **Firebase Default:** https://ref-assistant-clean.web.app
- **Custom Domain (pending setup):** https://refassistant.com

## Important Notes
- Keep both domains active during transition
- DNS changes can take 24-48 hours to fully propagate
- SSL certificate provisioning is automatic but may take additional time
- Test the custom domain before updating any external links

## Troubleshooting
If you encounter issues:
1. Verify DNS records are correctly set
2. Check DNS propagation: https://dnschecker.org
3. Ensure domain ownership verification TXT record is added
4. Contact your domain provider if DNS changes aren't taking effect

## Next Steps After DNS Setup
1. Update any bookmarks or external links to use refassistant.com
2. Consider setting up redirects from the .web.app domain to the custom domain
3. Update any authentication provider settings if needed
