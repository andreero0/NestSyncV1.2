# NestSync Railway Deployment Guide
## PIPEDA-Compliant FastAPI Backend Deployment

### 🚀 **DEPLOYMENT STATUS**
- **Railway CLI**: ✅ Installed (v4.6.3)
- **Git Repository**: ✅ Initialized with initial commit
- **Application**: ✅ Running locally on port 8001
- **Docker**: ✅ Production-ready Dockerfile configured
- **Railway Config**: ✅ railway.toml optimized for Canadian compliance

---

## 📋 **DEPLOYMENT CHECKLIST**

### **Phase 1: Pre-Deployment Setup**
- [x] Railway CLI installed (`railway --version`)
- [x] Git repository initialized with codebase
- [x] Docker configuration verified
- [x] Health checks functional
- [ ] **REQUIRED**: Manual Railway authentication
- [ ] **REQUIRED**: Configure Supabase production credentials

### **Phase 2: Railway Platform Setup**
- [ ] Create Railway project
- [ ] Configure environment variables
- [ ] Deploy to Railway
- [ ] Verify deployment health

### **Phase 3: Production Configuration**
- [ ] Custom domain configuration
- [ ] SSL/HTTPS setup
- [ ] Monitoring and alerts
- [ ] Performance optimization

---

## 🔧 **STEP-BY-STEP DEPLOYMENT**

### **Step 1: Railway Authentication**
```bash
# Navigate to project directory
cd "/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/NestSync-backend"

# Login to Railway (opens browser for authentication)
railway login
```

**Expected Output:**
```
🚝 Logging in to Railway...
✅ Logged in as [your-email@domain.com]
```

### **Step 2: Create Railway Project**
```bash
# Create new Railway project
railway init

# Follow prompts:
# - Project name: "nestsync-backend"
# - Description: "NestSync Canadian Diaper Planning API"
# - Public: No (keep private for production)
```

### **Step 3: Configure Environment Variables**

#### **Essential Production Variables** (Configure in Railway Dashboard or CLI):

```bash
# Core Application Settings
railway variables set ENVIRONMENT=production
railway variables set APP_NAME="NestSync API"
railway variables set API_VERSION="1.0.0"
railway variables set TZ="America/Toronto"
railway variables set DATA_REGION="canada-central"
railway variables set PIPEDA_COMPLIANCE="true"

# Supabase Configuration (FROM YOUR SUPABASE PROJECT)
railway variables set SUPABASE_URL="https://your-project-id.supabase.co"
railway variables set SUPABASE_ANON_KEY="eyJ..."  # Your anon key
railway variables set SUPABASE_SERVICE_KEY="eyJ..." # Your service role key

# Security Keys (GENERATE NEW FOR PRODUCTION)
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set ENCRYPTION_KEY="$(openssl rand -base64 32)"

# Database (Railway will auto-generate if using Railway Postgres)
railway variables set DATABASE_URL="postgresql://..." # From Railway Postgres addon

# Optional: Redis for caching (Railway Redis addon)
railway variables set REDIS_URL="redis://..." # From Railway Redis addon
```

#### **Optional External Services** (Add as needed):
```bash
# Payment Processing
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Email Notifications
railway variables set SENDGRID_API_KEY="SG..."

# AI/ML Services
railway variables set OPENAI_API_KEY="sk-..."

# Monitoring
railway variables set SENTRY_DSN="https://...@sentry.io/..."
```

### **Step 4: Deploy to Railway**
```bash
# Deploy current codebase
railway up

# Or deploy with specific service name
railway deploy --service nestsync-backend
```

**Expected Deployment Output:**
```
🚝 Building and deploying...
✅ Build completed successfully
✅ Deployment live at: https://nestsync-backend-production.up.railway.app
```

### **Step 5: Verify Deployment**
```bash
# Check deployment status
railway status

# View logs
railway logs

# Test health endpoint
curl https://your-app.up.railway.app/health
```

---

## 🔒 **SECURITY & COMPLIANCE CONFIGURATION**

### **Canadian Data Residency (PIPEDA Compliance)**
```bash
# Ensure Canadian region settings
railway variables set DATA_REGION="canada-central"
railway variables set TZ="America/Toronto" 
railway variables set PIPEDA_COMPLIANCE="true"
railway variables set DATA_RETENTION_MONTHS="24"
```

### **Security Headers & CORS**
```bash
# Production CORS settings
railway variables set CORS_ORIGINS="https://your-frontend-domain.com"

# Rate limiting
railway variables set RATE_LIMIT_REQUESTS_PER_MINUTE="100"
railway variables set RATE_LIMIT_BURST="200"
```

---

## 📊 **MONITORING & HEALTH CHECKS**

### **Health Check Endpoints** (Already configured):
- **Primary**: `https://your-app.up.railway.app/health`
- **Simple**: `https://your-app.up.railway.app/health/simple`
- **API Docs**: `https://your-app.up.railway.app/docs`
- **GraphQL**: `https://your-app.up.railway.app/graphql`

### **Railway Monitoring Setup**:
1. **Dashboard**: Monitor CPU, Memory, Network in Railway dashboard
2. **Alerts**: Configure alerts for downtime/errors
3. **Logs**: Access via `railway logs` or Railway dashboard

---

## 🌐 **CUSTOM DOMAIN CONFIGURATION**

### **Add Custom Domain**:
```bash
# Add your domain
railway domain add your-api-domain.com

# Configure DNS (Add CNAME record):
# CNAME: api -> your-app.up.railway.app
```

### **SSL Configuration**:
- Railway automatically provides SSL certificates
- HTTPS enforced by default
- Certificate renewal handled automatically

---

## 🚀 **SCALING & PERFORMANCE**

### **Auto-Scaling Configuration**:
```bash
# Configure replicas (starts with 1 as per railway.toml)
railway variables set WORKER_CONNECTIONS="1000"
railway variables set KEEPALIVE_TIMEOUT="65"
railway variables set MAX_REQUEST_SIZE="100MB"
```

### **Database Optimization**:
```bash
railway variables set DATABASE_POOL_SIZE="20"
railway variables set DATABASE_MAX_OVERFLOW="30"
```

---

## 🔍 **TROUBLESHOOTING**

### **Common Issues & Solutions**:

#### **1. Build Failures**
```bash
# Check build logs
railway logs --filter build

# Verify Dockerfile
docker build -t nestsync-test .
docker run -p 8000:8000 nestsync-test
```

#### **2. Environment Variable Issues**
```bash
# List all variables
railway variables

# Check specific variable
railway variables get SUPABASE_URL
```

#### **3. Database Connection Issues**
```bash
# Test database connectivity
railway run python -c "from app.config.database import test_connection; test_connection()"
```

#### **4. Health Check Failures**
```bash
# Test health endpoint locally
curl http://localhost:8001/health

# Check production health
curl https://your-app.up.railway.app/health
```

---

## 📝 **DEPLOYMENT VERIFICATION**

### **Post-Deployment Checklist**:
- [ ] Health check returns "healthy" status
- [ ] GraphQL endpoint accessible at `/graphql`
- [ ] API documentation available at `/docs`
- [ ] Database connectivity verified
- [ ] Supabase authentication working
- [ ] CORS configured for your frontend domain
- [ ] SSL certificate active and valid
- [ ] Canadian timezone (America/Toronto) applied
- [ ] Error monitoring active (if Sentry configured)

### **Test Commands**:
```bash
# Health check
curl -s https://your-app.up.railway.app/health | jq .

# GraphQL introspection
curl -X POST https://your-app.up.railway.app/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'

# API documentation
open https://your-app.up.railway.app/docs
```

---

## 🔄 **CI/CD & AUTOMATED DEPLOYMENTS**

### **GitHub Integration** (Recommended):
1. Push code to GitHub repository
2. Connect Railway to GitHub repo
3. Enable automatic deployments on push to main branch
4. Configure branch-based environments (staging/production)

### **Manual Deployment**:
```bash
# Deploy latest changes
git add .
git commit -m "Update: [description]"
git push  # If connected to GitHub
railway up  # Direct deployment
```

---

## 📚 **ADDITIONAL RESOURCES**

### **Railway Documentation**:
- [Railway Deployment Guide](https://docs.railway.app/)
- [Environment Variables](https://docs.railway.app/develop/variables)
- [Custom Domains](https://docs.railway.app/deploy/exposing-your-app)

### **NestSync Specific**:
- **Health Monitoring**: `/health` endpoint provides comprehensive status
- **GraphQL Playground**: Available at `/graphql` in development
- **API Documentation**: Interactive docs at `/docs`
- **PIPEDA Compliance**: Built-in Canadian data residency features

---

## ⚠️ **IMPORTANT SECURITY NOTES**

1. **Never commit secrets** to git - use Railway variables
2. **Rotate keys regularly** - especially JWT and encryption keys  
3. **Monitor access logs** - Railway provides comprehensive logging
4. **Keep dependencies updated** - regularly update requirements.txt
5. **Use HTTPS only** - Railway enforces SSL by default
6. **Canadian compliance** - All data processing remains in Canadian regions

---

## 🆘 **SUPPORT & TROUBLESHOOTING**

### **Railway Support**:
- Railway Documentation: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app/

### **Application Support**:
- Health endpoint provides detailed system status
- Comprehensive logging for debugging
- Canadian timezone and PIPEDA compliance built-in

---

## 📋 **CURRENT DEPLOYMENT STATUS**

**Repository State**: ✅ Ready for deployment
**Configuration**: ✅ Production-optimized
**Compliance**: ✅ PIPEDA-compliant for Canadian market  
**Security**: ✅ Production security measures implemented
**Monitoring**: ✅ Health checks and logging configured

**Next Steps**: 
1. Complete Railway authentication (`railway login`)
2. Configure Supabase production credentials
3. Deploy with `railway up`
4. Verify health checks and functionality

**Expected URLs After Deployment**:
- **API Health**: `https://your-app.up.railway.app/health`
- **GraphQL**: `https://your-app.up.railway.app/graphql`  
- **API Docs**: `https://your-app.up.railway.app/docs`
- **Railway Dashboard**: Available in your Railway account