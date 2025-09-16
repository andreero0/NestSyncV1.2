#!/bin/bash
# Automatic Authentication Rollback System
# Provides immediate recovery from authentication failures
# Protects business from extended downtime

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="/tmp/nestsync-backups"
LOG_FILE="/tmp/nestsync-rollback.log"
BACKEND_URL="${BACKEND_URL:-http://localhost:8001}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $message" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Function to create backup before any changes
create_backup() {
    local backup_name="auth-backup-$(date '+%Y%m%d-%H%M%S')"
    local backup_path="$BACKUP_DIR/$backup_name"

    log "Creating authentication system backup: $backup_name"

    mkdir -p "$backup_path"

    # Backup critical authentication files
    if [ -d "$PROJECT_ROOT/NestSync-backend" ]; then
        cp -r "$PROJECT_ROOT/NestSync-backend/app/auth" "$backup_path/auth" 2>/dev/null || true
        cp "$PROJECT_ROOT/NestSync-backend/requirements*.txt" "$backup_path/" 2>/dev/null || true
        cp "$PROJECT_ROOT/NestSync-backend/Dockerfile*" "$backup_path/" 2>/dev/null || true
    fi

    # Backup monitoring scripts
    cp -r "$PROJECT_ROOT/scripts" "$backup_path/" 2>/dev/null || true

    # Create backup manifest
    cat > "$backup_path/manifest.txt" << EOF
Backup created: $(date)
Backup type: Authentication system
Git commit: $(cd "$PROJECT_ROOT" && git rev-parse HEAD 2>/dev/null || echo "unknown")
Git branch: $(cd "$PROJECT_ROOT" && git branch --show-current 2>/dev/null || echo "unknown")
Backend URL: $BACKEND_URL
Reason: Automatic rollback preparation
EOF

    success "Backup created: $backup_path"
    echo "$backup_path"
}

# Function to test authentication health
test_auth_health() {
    log "Testing authentication system health..."

    # Test 1: Backend health
    if ! curl -s --max-time 10 "$BACKEND_URL/health" > /dev/null; then
        error "Backend health check failed"
        return 1
    fi

    # Test 2: Auth health endpoint
    local auth_response
    auth_response=$(curl -s --max-time 10 "$BACKEND_URL/health/auth" || echo "ERROR")

    if [ "$auth_response" = "ERROR" ]; then
        error "Auth health endpoint unreachable"
        return 1
    fi

    # Test 3: Check for critical failures
    local critical_failures
    critical_failures=$(echo "$auth_response" | jq -r '.critical_failures[]?' 2>/dev/null || echo "")

    if [ -n "$critical_failures" ]; then
        error "Critical authentication failures detected: $critical_failures"
        return 1
    fi

    # Test 4: Basic authentication flow
    local flow_test
    flow_test=$(curl -s --max-time 10 \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"query": "{ __schema { types { name } } }"}' \
        "$BACKEND_URL/graphql" || echo "ERROR")

    if [ "$flow_test" = "ERROR" ]; then
        error "GraphQL endpoint unreachable"
        return 1
    fi

    # Check for Pydantic validation errors
    if echo "$flow_test" | jq -e '.errors[]? | select(.message | contains("identity_id"))' > /dev/null 2>&1; then
        error "Pydantic validation error detected - gotrue compatibility issue!"
        return 1
    fi

    success "Authentication system health check passed"
    return 0
}

# Function to rollback to known good Docker image
rollback_docker() {
    log "Initiating Docker rollback procedure..."

    # Stop current containers
    log "Stopping current Docker containers..."
    cd "$PROJECT_ROOT"
    docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml down || true

    # Force rebuild with original requirements
    log "Rebuilding containers with locked dependencies..."
    docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml build --no-cache

    # Start containers
    log "Starting fresh containers..."
    docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

    # Wait for services to be ready
    log "Waiting for services to initialize..."
    sleep 30

    # Test health
    for attempt in {1..10}; do
        if test_auth_health; then
            success "Docker rollback successful - authentication restored"
            return 0
        fi
        log "Waiting for services to stabilize... (attempt $attempt/10)"
        sleep 10
    done

    error "Docker rollback failed - services did not stabilize"
    return 1
}

# Function to rollback authentication files
rollback_auth_files() {
    local backup_path="$1"

    if [ ! -d "$backup_path" ]; then
        error "Backup path does not exist: $backup_path"
        return 1
    fi

    log "Rolling back authentication files from: $backup_path"

    # Restore authentication module
    if [ -d "$backup_path/auth" ]; then
        rm -rf "$PROJECT_ROOT/NestSync-backend/app/auth"
        cp -r "$backup_path/auth" "$PROJECT_ROOT/NestSync-backend/app/auth"
        success "Authentication module restored"
    fi

    # Restore requirements files
    if [ -f "$backup_path/requirements.txt" ]; then
        cp "$backup_path/requirements.txt" "$PROJECT_ROOT/NestSync-backend/requirements.txt"
        success "Requirements.txt restored"
    fi

    if [ -f "$backup_path/requirements-minimal-dev.txt" ]; then
        cp "$backup_path/requirements-minimal-dev.txt" "$PROJECT_ROOT/NestSync-backend/requirements-minimal-dev.txt"
        success "Development requirements restored"
    fi

    # Restore Dockerfiles
    for dockerfile in "$backup_path"/Dockerfile*; do
        if [ -f "$dockerfile" ]; then
            local filename=$(basename "$dockerfile")
            cp "$dockerfile" "$PROJECT_ROOT/NestSync-backend/$filename"
            success "Restored $filename"
        fi
    done

    success "Authentication files rollback completed"
}

# Function to perform git-based rollback
rollback_git() {
    local commit_hash="$1"

    if [ -z "$commit_hash" ]; then
        error "No commit hash provided for git rollback"
        return 1
    fi

    log "Performing git rollback to commit: $commit_hash"

    cd "$PROJECT_ROOT"

    # Create backup branch
    local backup_branch="rollback-backup-$(date '+%Y%m%d-%H%M%S')"
    git checkout -b "$backup_branch" || {
        warning "Could not create backup branch"
    }

    # Rollback to specified commit
    git checkout main
    git reset --hard "$commit_hash"

    success "Git rollback completed to commit: $commit_hash"
}

# Function to list available backups
list_backups() {
    log "Available authentication backups:"

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        warning "No backups found in $BACKUP_DIR"
        return 1
    fi

    echo "================================="
    for backup in "$BACKUP_DIR"/auth-backup-*; do
        if [ -d "$backup" ]; then
            local backup_name=$(basename "$backup")
            local manifest="$backup/manifest.txt"

            echo "📦 $backup_name"
            if [ -f "$manifest" ]; then
                echo "   Created: $(grep "Backup created:" "$manifest" | cut -d: -f2-)"
                echo "   Git commit: $(grep "Git commit:" "$manifest" | cut -d: -f2)"
                echo "   Reason: $(grep "Reason:" "$manifest" | cut -d: -f2)"
            fi
            echo "   Path: $backup"
            echo ""
        fi
    done
}

# Function to perform automatic rollback
auto_rollback() {
    log "🚨 AUTOMATIC AUTHENTICATION ROLLBACK INITIATED"
    log "Reason: Critical authentication failure detected"

    # Create emergency backup
    local emergency_backup
    emergency_backup=$(create_backup)

    # Strategy 1: Try Docker rollback first (fastest)
    log "Attempting Docker-based rollback..."
    if rollback_docker; then
        success "🎉 ROLLBACK SUCCESSFUL - Docker rebuild resolved the issue"
        return 0
    fi

    # Strategy 2: Try file-based rollback
    log "Docker rollback failed, attempting file-based rollback..."
    local latest_backup
    latest_backup=$(ls -t "$BACKUP_DIR"/auth-backup-* 2>/dev/null | head -1)

    if [ -n "$latest_backup" ] && [ -d "$latest_backup" ]; then
        rollback_auth_files "$latest_backup"

        # Restart services
        log "Restarting services after file rollback..."
        cd "$PROJECT_ROOT"
        ./scripts/start-monitoring.sh restart || true

        # Test health
        sleep 15
        if test_auth_health; then
            success "🎉 ROLLBACK SUCCESSFUL - File restore resolved the issue"
            return 0
        fi
    fi

    # Strategy 3: Git rollback (last resort)
    log "File rollback failed, checking git history..."
    cd "$PROJECT_ROOT"
    local last_good_commit
    last_good_commit=$(git log --oneline -10 --grep="auth" | grep -v "fail\|error\|fix" | head -1 | cut -d' ' -f1)

    if [ -n "$last_good_commit" ]; then
        rollback_git "$last_good_commit"

        # Rebuild and test
        log "Rebuilding after git rollback..."
        if rollback_docker; then
            success "🎉 ROLLBACK SUCCESSFUL - Git reset resolved the issue"
            return 0
        fi
    fi

    error "🚨 ALL ROLLBACK STRATEGIES FAILED"
    error "Manual intervention required immediately"
    error "Contact development team for emergency support"
    return 1
}

# Function to test rollback procedure
test_rollback() {
    log "Testing rollback procedures (simulation mode)..."

    # Test backup creation
    log "Testing backup creation..."
    local test_backup
    test_backup=$(create_backup | tail -1)
    if [ -d "$test_backup" ]; then
        success "Backup creation test passed"
        rm -rf "$test_backup"
    else
        error "Backup creation test failed"
        return 1
    fi

    # Test health checking
    log "Testing health check procedures..."
    if test_auth_health; then
        success "Health check test passed"
    else
        warning "Health check test failed - this may indicate current issues"
    fi

    # Test service restart
    log "Testing service restart procedures..."
    cd "$PROJECT_ROOT"
    if ./scripts/start-monitoring.sh restart; then
        success "Service restart test passed"
    else
        warning "Service restart test failed"
    fi

    success "Rollback procedure tests completed"
}

# Main command handling
main() {
    case "${1:-help}" in
        "auto")
            auto_rollback
            ;;
        "docker")
            create_backup
            rollback_docker
            ;;
        "files")
            if [ -z "$2" ]; then
                error "Please specify backup path for file rollback"
                list_backups
                exit 1
            fi
            create_backup
            rollback_auth_files "$2"
            ;;
        "git")
            if [ -z "$2" ]; then
                error "Please specify commit hash for git rollback"
                exit 1
            fi
            create_backup
            rollback_git "$2"
            ;;
        "backup")
            create_backup
            ;;
        "list")
            list_backups
            ;;
        "test")
            test_rollback
            ;;
        "health")
            test_auth_health
            ;;
        "help"|"-h"|"--help")
            echo "Authentication Rollback System"
            echo ""
            echo "Commands:"
            echo "  auto               Automatic rollback (Docker -> Files -> Git)"
            echo "  docker             Force Docker container rebuild"
            echo "  files <backup>     Restore from specific file backup"
            echo "  git <commit>       Rollback to specific git commit"
            echo "  backup             Create backup of current state"
            echo "  list               List available backups"
            echo "  test               Test rollback procedures"
            echo "  health             Test authentication health"
            echo "  help               Show this help"
            echo ""
            echo "Environment Variables:"
            echo "  BACKEND_URL        Backend server URL (default: http://localhost:8001)"
            ;;
        *)
            error "Unknown command: $1"
            log "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"