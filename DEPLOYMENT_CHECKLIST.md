# Deployment Checklist for Replit

## ❌ Error: Deployment Failed to Initialize

If you see this error, it means your deployment is missing required environment variables.

## ✅ Required Environment Variables for Deployment

Before deploying, you **MUST** configure these secrets in Replit's Deployment settings:

### 1. **DATABASE_URL** (REQUIRED)
```
postgresql://user:password@host:5432/database
```
- Get this from your Neon/PostgreSQL database
- Without this, the app cannot start

### 2. **SESSION_SECRET** (REQUIRED)
```
your-random-32-character-secret-here
```
- Generate with: `openssl rand -hex 32`
- Or use any random 32+ character string

### 3. **PORT** (Already Configured)
```
5000
```
- The app is configured to listen on port 5000
- This is automatically set by Replit, but can be set explicitly

## 🔧 How to Set Environment Variables in Replit Deployment

1. **Go to your Replit project**
2. **Click on "Deploy" or "Deployments"**
3. **Find "Secrets" or "Environment Variables"**
4. **Add each required variable:**
   - Key: `DATABASE_URL`
   - Value: `your-database-connection-string`
   
   - Key: `SESSION_SECRET`  
   - Value: `your-secret-key-here`

5. **Click "Save" or "Update"**
6. **Deploy again**

## 📋 Optional But Recommended Variables

```env
# PayPal Configuration (for e-commerce)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox

# Admin User (auto-created on first startup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Locale
DEFAULT_LOCALE=es-ES
```

## 🚀 Deployment Configuration

The application is configured to:
- ✅ Listen on `0.0.0.0:5000` (all interfaces)
- ✅ Use PORT environment variable (defaults to 5000)
- ✅ Serve static files in production mode
- ✅ Auto-create admin user and default author on first start

## 🔍 Verify Your Configuration

Before deploying, check:
1. [ ] DATABASE_URL is set in Deployment secrets
2. [ ] SESSION_SECRET is set in Deployment secrets  
3. [ ] Your database is accessible from Replit's servers
4. [ ] Run command is: `npm run build && npm start`
5. [ ] Port is configured as 5000 (internal) → 80 (external)

## 🐛 Common Issues

### "Deployment failed to initialize"
**Cause**: Missing DATABASE_URL or SESSION_SECRET  
**Fix**: Add them to Deployment secrets

### "Application not listening on correct port"
**Cause**: Usually not the issue - server is configured correctly  
**Check**: Verify DATABASE_URL is valid and database is accessible

### "Build succeeded but app won't start"
**Cause**: Database connection failed  
**Fix**: 
1. Test DATABASE_URL in development
2. Check database firewall/access rules
3. Verify database accepts connections from Replit IPs

## 📝 First Deployment Checklist

On your first successful deployment:
1. [ ] App starts successfully
2. [ ] You see "DEFAULT ADMIN USER AND AUTHOR CREATED" in logs
3. [ ] Access `https://your-app.replit.app/admin`
4. [ ] Login with `admin` / `admin123` (or your custom credentials)
5. [ ] **CHANGE THE PASSWORD IMMEDIATELY**
6. [ ] Edit or delete the default "Autor Ejemplo"

## 🔐 Production Security

After first deployment:
1. Change admin password immediately
2. Set PAYPAL_MODE=production with real credentials
3. Use strong SESSION_SECRET (32+ random characters)
4. Configure production DATABASE_URL
5. Review and update all default content

---

## 📞 Still Having Issues?

If deployment still fails after setting all required variables:
1. Check the deployment logs for specific errors
2. Verify DATABASE_URL connection string format
3. Test database connectivity from Replit development environment
4. Ensure database accepts connections from external IPs
5. Contact Replit support with deployment logs
