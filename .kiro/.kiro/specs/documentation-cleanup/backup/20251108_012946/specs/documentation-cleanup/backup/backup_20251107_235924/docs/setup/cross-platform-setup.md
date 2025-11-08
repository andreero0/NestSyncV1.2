# Cross-Platform Development Setup Guide

## 🎯 Quick Start (5 Minutes)

### One Command Setup
```bash
# Clone and start entire development environment
git clone [repo-url] NestSync
cd NestSync
./docker/docker-dev.sh up
```

**Access Points:**
- Frontend (Web): http://localhost:8082
- Backend (API): http://localhost:8001/graphql
- Supabase Studio: http://localhost:54323
- Email Testing: http://localhost:54324

**Test Credentials:**
- Email: parents@nestsync.com
- Password: Shazam11#

---

## 📋 Platform-Specific Setup

### macOS Setup

#### Prerequisites
```bash
# Install Docker Desktop
brew install --cask docker

# Install Git (if not already installed)
brew install git

# Start Docker Desktop
open /Applications/Docker.app
```

#### Development Setup
```bash
# Clone repository
git clone [repo-url] NestSync
cd NestSync

# Start development environment
./docker/docker-dev.sh up

# Verify setup
./docker/docker-dev.sh status
```

#### Apple Silicon (M1/M2) Specific
```bash
# For better performance, ensure Docker is using ARM64 images
export DOCKER_DEFAULT_PLATFORM=linux/arm64

# Start with platform specification
./docker/docker-dev.sh up
```

### Windows Setup (WSL2 Required)

#### Prerequisites
1. **Enable WSL2:**
   ```powershell
   # Run in PowerShell as Administrator
   wsl --install
   wsl --set-default-version 2
   ```

2. **Install Docker Desktop:**
   - Download from docker.com
   - Enable WSL2 integration during installation

3. **Install Git in WSL:**
   ```bash
   sudo apt update
   sudo apt install git
   ```

#### Development Setup
```bash
# Inside WSL2 terminal
git clone [repo-url] NestSync
cd NestSync

# Ensure scripts are executable
chmod +x docker/docker-dev.sh
chmod +x scripts/*.sh

# Start development environment
./docker/docker-dev.sh up
```

#### Windows-Specific Notes
- Always work inside WSL2 for best performance
- Docker Desktop must have WSL2 integration enabled
- File system performance is better in `/home/` than `/mnt/c/`

### Linux Setup (Native Docker)

#### Prerequisites
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose git

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER
```

#### Development Setup
```bash
# Clone repository
git clone [repo-url] NestSync
cd NestSync

# Make scripts executable
chmod +x docker/docker-dev.sh
chmod +x scripts/*.sh

# Start development environment
./docker/docker-dev.sh up
```

---

## 🔧 Environment Validation

### Pre-Flight Check Script
```bash
# Run environment validation
./scripts/verify-environment.sh

# Or manual checks:
docker --version          # Should be 20.0+
docker-compose --version  # Should be 1.29+
curl http://localhost:8001 # Should connect after startup
```

### Health Check Checklist
- [ ] Docker Desktop running
- [ ] All containers healthy (`./docker/docker-dev.sh status`)
- [ ] Frontend accessible (http://localhost:8082)
- [ ] Backend responding (http://localhost:8001)
- [ ] GraphQL playground working (http://localhost:8001/graphql)
- [ ] Supabase Studio accessible (http://localhost:54323)
- [ ] Can login with test credentials

---

## 🚀 Development Workflow

### Daily Startup
```bash
cd NestSync
./docker/docker-dev.sh up      # Start all services
./docker/docker-dev.sh logs    # Monitor logs
```

### Daily Shutdown
```bash
./docker/docker-dev.sh down    # Stop all services
```

### Common Commands
```bash
# View service status
./docker/docker-dev.sh status

# View specific service logs
./docker/docker-dev.sh logs-backend
./docker/docker-dev.sh logs-frontend

# Restart services
./docker/docker-dev.sh restart

# Clean up (if issues occur)
./docker/docker-dev.sh clean
```

---

## 🛠️ Troubleshooting

### Common Issues

#### "Docker is not running"
**Solution:**
```bash
# macOS: Start Docker Desktop
open /Applications/Docker.app

# Linux: Start Docker service
sudo systemctl start docker

# Windows: Start Docker Desktop from Start Menu
```

#### "Port already in use"
**Solution:**
```bash
# Check what's using the port
lsof -i :8001  # or :8082, :54323

# Stop conflicting services
./docker/docker-dev.sh down
pkill -f "port 8001"  # Kill specific process

# Restart clean
./docker/docker-dev.sh up
```

#### "Connection refused" to localhost:8001
**Solution:**
```bash
# Check container health
./docker/docker-dev.sh status

# View backend logs
./docker/docker-dev.sh logs-backend

# Restart backend
./docker/docker-dev.sh restart
```

#### "Permission denied" on Linux
**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or:
newgrp docker

# Make scripts executable
chmod +x docker/docker-dev.sh
```

#### iOS Simulator "Network request failed"
**Fixed in Phase 2** - GraphQL client now handles connection failures gracefully:
- Stops polling on network errors
- Uses cache when backend unavailable
- Limited retry attempts prevent infinite loops

### Reset Everything (Nuclear Option)
```bash
# Stop everything
./docker/docker-dev.sh down

# Clean up all Docker resources
./docker/docker-dev.sh clean

# Restart fresh
./docker/docker-dev.sh up
```

---

## 🌐 Network Configuration

### Port Mapping
- **8001**: Backend FastAPI + GraphQL
- **8082**: Frontend Expo development server
- **19000-19002**: Expo development tools
- **54322**: PostgreSQL database
- **54323**: Supabase Studio
- **54324**: Email testing (Inbucket)
- **6379**: Redis cache

### Firewall Settings
If you have firewall enabled, allow these ports:
```bash
# macOS
sudo pfctl -f /etc/pf.conf

# Linux (ufw)
sudo ufw allow 8001,8082,19000:19002,54322:54324,6379/tcp
```

---

## 👥 Team Onboarding

### New Developer Checklist
1. [ ] Install platform prerequisites
2. [ ] Clone repository
3. [ ] Run `./docker/docker-dev.sh up`
4. [ ] Verify all services with health check
5. [ ] Login with test credentials
6. [ ] Run through basic user flow
7. [ ] Join team communication channels

### VS Code Setup (Optional)
```bash
# Install recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-docker
```

### Git Configuration
```bash
# Set up global git config
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Set up commit signing (optional but recommended)
git config --global commit.gpgsign true
```

---

## 📚 Additional Resources

- [CLAUDE.md](../../CLAUDE.md) - Complete development guide
- [Docker Documentation](../../docker/README.md) - Docker-specific setup
- [Troubleshooting Guide](../troubleshooting/TROUBLESHOOTING-GUIDE.md) - Detailed debugging
- [Architecture Overview](../architecture/high-level.md) - System design
- [Design Documentation](../../design-documentation/) - UX patterns

---

## ✅ Success Criteria

Your setup is complete when:
- All containers show "healthy" status
- Frontend loads at http://localhost:8082
- Backend responds at http://localhost:8001
- GraphQL playground works
- Test login succeeds
- No network errors in browser console

**Next Steps:** Start with the [CLAUDE.md](../../CLAUDE.md) development workflow guide.