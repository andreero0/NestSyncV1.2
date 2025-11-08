# NestSync Observability & Incident Response Runbooks

## Overview
This document provides detailed incident response procedures for the NestSync observability and early warning system. Each alert type has specific remediation steps based on the documented P0/P1 failure patterns.

---

## Alert Severity Classification

### CRITICAL (P0) - Immediate Response Required
- **Response Time**: < 5 minutes
- **Escalation**: Immediate phone/SMS alert
- **Impact**: System down, authentication failure, data loss risk

### HIGH (P1) - Response Within 15 Minutes
- **Response Time**: < 15 minutes
- **Escalation**: Email + Slack notification
- **Impact**: Performance degradation, compliance issues

### MEDIUM (P2) - Response Within 1 Hour
- **Response Time**: < 1 hour
- **Escalation**: Email notification
- **Impact**: Warning indicators, trend degradation

### LOW (P3) - Response Within 4 Hours
- **Response Time**: < 4 hours
- **Escalation**: Daily summary report
- **Impact**: Informational, preventive maintenance

---

## P0 CRITICAL Alerts

### 🚨 Database Health Failure (P0)

**Alert ID**: `db_health`
**Symptoms**:
- Cannot connect to PostgreSQL database
- Critical tables missing (users, children, consent_records)
- Connection pool exhausted

**Immediate Actions**:
1. **Check database connectivity**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. **Verify Supabase service status**:
   - Check Supabase dashboard
   - Review Supabase incident page

3. **Check critical table existence**:
   ```bash
   psql $DATABASE_URL -c "\dt users"
   psql $DATABASE_URL -c "\dt children"
   psql $DATABASE_URL -c "\dt notification_preferences"
   ```

4. **If tables missing - Migration corruption**:
   ```bash
   cd NestSync-backend
   alembic current
   alembic upgrade head
   ```

5. **If migration fails**:
   ```bash
   # Reset to last known good state
   alembic downgrade 002
   alembic upgrade head
   ```

**Recovery Procedures**:
- Enable backup database if available
- Notify users of maintenance if downtime > 5 minutes
- Document incident for post-mortem

**Prevention**:
- Automated database backups before migrations
- Migration testing in staging environment
- Health check validation before production deployment

---

### 🚨 Authentication System Failure (P0)

**Alert ID**: `auth_health`
**Symptoms**:
- Users cannot sign in/register
- JWT validation errors
- Gotrue SDK compatibility issues

**Immediate Actions**:
1. **Test authentication with known credentials**:
   - Email: parents@nestsync.com
   - Password: Shazam11#

2. **Check gotrue SDK version compatibility**:
   ```bash
   cd NestSync-backend
   pip list | grep gotrue
   # Should show: gotrue==2.5.4
   ```

3. **If version mismatch detected**:
   ```bash
   pip install gotrue==2.5.4
   # Restart application server
   ./docker/docker-dev.sh restart
   ```

4. **Verify Supabase configuration**:
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_JWT_SECRET
   ```

5. **Test authentication endpoint**:
   ```bash
   curl -X POST $SUPABASE_URL/auth/v1/token \
     -H "Content-Type: application/json" \
     -d '{"email":"parents@nestsync.com","password":"Shazam11#"}'
   ```

**Recovery Procedures**:
- Roll back to previous working authentication version
- Enable maintenance mode if auth completely broken
- Notify users through alternative channels

**Prevention**:
- Pin gotrue version exactly in requirements.txt
- Automated authentication smoke tests every 15 minutes
- Version compatibility testing in CI/CD

---

### 🚨 GraphQL Schema Mismatch (P0)

**Alert ID**: `graphql_schema_health`
**Symptoms**:
- "Cannot query field" errors
- Missing critical resolvers (getAnalyticsDashboard)
- Frontend/backend schema incompatibility

**Immediate Actions**:
1. **Test GraphQL introspection**:
   ```bash
   curl -X POST http://localhost:8001/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __schema { queryType { fields { name } } } }"}'
   ```

2. **Check for missing critical resolvers**:
   - `getAnalyticsDashboard` (not getAnalyticsOverview)
   - `getNotificationPreferences`
   - `me`

3. **Clear Apollo Client and Metro cache**:
   ```bash
   cd NestSync-frontend
   npx expo start --clear
   rm -rf node_modules/.cache
   npm start -- --reset-cache
   ```

4. **Verify resolver registration**:
   ```bash
   cd NestSync-backend
   python -c "from app.graphql.schema import schema; print([f.name for f in schema.query_type.fields])"
   ```

5. **Check for field naming mismatches**:
   - Frontend uses camelCase (childId, notificationsEnabled)
   - Backend provides snake_case (child_id, notifications_enabled)
   - Verify field aliases in GraphQL types

**Recovery Procedures**:
- Revert to last working GraphQL schema
- Deploy hotfix for critical field mismatches
- Update frontend queries to match backend schema

**Prevention**:
- GraphQL schema validation in CI/CD
- Automated frontend type generation
- Schema compatibility testing

---

## P1 HIGH Alerts

### ⚠️ Canadian Compliance Violation (P1)

**Alert ID**: `data_residency_compliance` or `pipeda_compliance`
**Symptoms**:
- Data region not set to canada-central
- Missing PIPEDA consent fields
- Canadian trust indicators absent

**Immediate Actions**:
1. **Verify data region configuration**:
   ```bash
   echo $DATA_REGION
   # Should be: canada-central or canada-east
   ```

2. **Check PIPEDA consent table**:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM consent_records"
   ```

3. **Validate notification preferences PIPEDA fields**:
   ```bash
   psql $DATABASE_URL -c "
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'notification_preferences'
   AND column_name IN ('notification_consent_granted', 'marketing_consent_granted')
   "
   ```

4. **If compliance fields missing**:
   ```bash
   # Create emergency migration
   alembic revision --autogenerate -m "add_pipeda_compliance_fields"
   alembic upgrade head
   ```

**Recovery Procedures**:
- Update environment configuration for Canadian region
- Add missing PIPEDA compliance fields
- Audit all user data for consent status

**Prevention**:
- Automated Canadian compliance validation
- PIPEDA compliance testing in staging
- Regular compliance audits

---

### ⚠️ Performance Degradation (P1)

**Alert ID**: `auth_performance` or `analytics_performance`
**Symptoms**:
- Response times > 2000ms for authentication
- Analytics loading > 3000ms
- High memory/CPU usage

**Immediate Actions**:
1. **Check system resources**:
   ```bash
   docker stats
   htop
   ```

2. **Monitor database query performance**:
   ```bash
   psql $DATABASE_URL -c "
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   ORDER BY mean_time DESC LIMIT 10
   "
   ```

3. **Review slow GraphQL queries**:
   - Check resolver execution times
   - Identify N+1 query problems
   - Review database indexes

4. **Scale resources if needed**:
   ```bash
   # Increase container resources
   docker-compose scale backend=2
   ```

**Recovery Procedures**:
- Implement query optimization
- Add database indexes for slow queries
- Enable caching for frequent operations

**Prevention**:
- Performance monitoring and alerting
- Regular performance testing
- Query optimization reviews

---

## P2 MEDIUM Alerts

### 📈 Performance Trend Degradation (P2)

**Alert ID**: `performance_trends`
**Symptoms**:
- Response times increasing over time
- Memory usage trending upward
- Error rates slowly climbing

**Actions**:
1. **Analyze performance trends over last 24 hours**
2. **Identify root cause of degradation**
3. **Plan performance optimization**
4. **Schedule maintenance if needed**

### 📊 Early Warning Indicators (P2)

**Alert ID**: `error_rate_trends`
**Symptoms**:
- Error rate > 20% in recent checks
- Multiple category failures
- Trend analysis showing degradation

**Actions**:
1. **Review recent error patterns**
2. **Identify systemic issues**
3. **Plan preventive maintenance**
4. **Update monitoring thresholds if needed**

---

## Incident Response Workflow

### 1. Alert Reception
- **Automated**: Observability service triggers alert
- **Manual**: Team member discovers issue
- **User Report**: Support ticket or user complaint

### 2. Initial Assessment (< 2 minutes)
1. Determine alert severity level
2. Check system status dashboard
3. Verify alert is not false positive
4. Begin appropriate response procedure

### 3. Incident Response (varies by severity)
1. Follow severity-specific runbook
2. Document all actions taken
3. Communicate status to stakeholders
4. Implement recovery procedures

### 4. Resolution and Recovery
1. Verify system functionality restored
2. Mark alerts as resolved
3. Update monitoring if needed
4. Begin post-incident review

### 5. Post-Incident Review (within 24 hours)
1. Root cause analysis
2. Timeline of events
3. Lessons learned
4. Action items for prevention

---

## Emergency Contacts

### On-Call Rotation
- **Primary**: Infrastructure Team Lead
- **Secondary**: Senior Backend Engineer
- **Escalation**: Engineering Manager

### Communication Channels
- **Critical (P0)**: Phone/SMS + Slack #alerts
- **High (P1)**: Slack #alerts + Email
- **Medium (P2)**: Email notification
- **Low (P3)**: Daily summary report

### External Services
- **Supabase Support**: [Supabase Dashboard](https://app.supabase.com)
- **Railway Support**: [Railway Dashboard](https://railway.app)
- **Domain/DNS**: [Cloudflare Dashboard](https://dash.cloudflare.com)

---

## Tools and Resources

### Monitoring Tools
- **Observability Dashboard**: `/monitoring_dashboard` GraphQL endpoint
- **Health Check**: `/system_health_summary` GraphQL endpoint
- **Direct Health**: `http://localhost:8001/health`

### Database Tools
```bash
# Connect to database
psql $DATABASE_URL

# Check table status
\dt

# Check migration status
cd NestSync-backend && alembic current
```

### Application Tools
```bash
# Restart services
./docker/docker-dev.sh restart

# Check logs
./docker/docker-dev.sh logs

# Clean restart
./docker/docker-dev.sh down && ./docker/docker-dev.sh up
```

### Validation Tools
```bash
# Run observability validation
python scripts/validate-observability-system.py

# Run comprehensive quality gates
./scripts/run-quality-gates.sh
```

---

## Canadian Compliance Considerations

### PIPEDA Requirements
- All incidents involving personal data must be documented
- Data breaches must be reported within 72 hours
- User consent withdrawal must be honored immediately

### Data Residency
- All data processing must remain in Canadian regions
- Logs and monitoring data must not leave Canada
- Recovery procedures must maintain data sovereignty

### Privacy by Design
- Default to minimal data exposure during incidents
- Anonymize logs and monitoring data where possible
- Ensure recovery procedures don't violate privacy principles

---

*Last Updated: 2025-09-15*
*Next Review: Monthly or after major incidents*