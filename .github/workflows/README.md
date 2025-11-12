# CI/CD Configuration Guide

This directory contains GitHub Actions workflows for automated CI/CD pipelines.

## Workflows

### 1. CI Pipeline (`ci.yml`)
**Triggers:** Push to main/develop, Pull Requests

**Jobs:**
- **Frontend CI**: Linting, testing, and building React app
- **Backend CI**: Testing Node.js backend with MongoDB
- **Security Scan**: npm audit and vulnerability checks
- **Code Quality**: Code analysis and complexity checks
- **Integration Tests**: Full stack integration testing
- **CI Summary**: Overall pipeline status report

**Features:**
- Automated testing with MongoDB service
- ESLint code quality checks
- Build artifact generation
- Security vulnerability scanning
- Multi-node version matrix testing

### 2. CD Pipeline (`cd.yml`)
**Triggers:** Push to main, Manual dispatch, Version tags

**Jobs:**
- **Build**: Creates production-ready artifacts
- **Deploy Staging**: Deploys to staging environment
- **Deploy Production**: Deploys to production (requires staging success)
- **Rollback**: Automatic rollback on failure
- **Post-deployment**: Health checks and monitoring

**Environments:**
- Staging: `https://staging.csit314.example.com`
- Production: `https://csit314.example.com`

### 3. PR Checks (`pr-checks.yml`)
**Triggers:** Pull Request events

**Jobs:**
- **PR Validation**: Validates PR title and description
- **Code Review Bot**: Automated code review comments
- **Size Check**: Bundle size reporting

**Features:**
- Conventional commits format checking
- Automated PR comments
- Bundle size tracking

### 4. Scheduled Tasks (`scheduled.yml`)
**Triggers:** Daily at 2 AM UTC, Manual dispatch

**Jobs:**
- **Dependency Update**: Checks for outdated packages
- **Security Audit**: Daily security scans
- **Cleanup**: Removes old artifacts (>30 days)
- **Health Check**: Production health monitoring

## Setup Instructions

### Prerequisites
1. GitHub repository with Actions enabled
2. MongoDB connection for testing
3. Deployment target configured (Vercel, AWS, etc.)

### Required Secrets
Add these secrets in GitHub Settings > Secrets and variables > Actions:

```
# Deployment (Optional - configure based on your hosting)
API_URL                 # Production API URL
VERCEL_TOKEN           # Vercel deployment token (if using Vercel)
PROD_HOST              # Production server hostname
PROD_USER              # SSH username
PROD_SSH_KEY           # SSH private key

# Database (for advanced testing)
MONGODB_URI            # Production MongoDB connection string
```

### Environment Variables
Configure in GitHub Settings > Environments:

**Staging Environment:**
- Name: `staging`
- URL: Your staging URL
- Protection rules: Require reviewers (optional)

**Production Environment:**
- Name: `production`
- URL: Your production URL
- Protection rules: Require reviewers (recommended)

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
# Windows: choco install act-cli
# Mac: brew install act
# Linux: See GitHub documentation

# Test CI workflow
act -W .github/workflows/ci.yml

# Test specific job
act -j frontend-ci

# Test with secrets
act -s GITHUB_TOKEN=your_token
```

## Workflow Customization

### Adding New Tests
Edit `ci.yml` and add steps:

```yaml
- name: Run custom tests
  run: npm run test:custom
```

### Changing Deployment Target
Edit `cd.yml` deployment steps to match your hosting provider:

**For Vercel:**
```yaml
- name: Deploy to Vercel
  run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**For AWS:**
```yaml
- name: Deploy to AWS
  uses: aws-actions/configure-aws-credentials@v1
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

**For Custom Server (SSH):**
```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USER }}
    key: ${{ secrets.SSH_KEY }}
    script: |
      cd /var/www/app
      git pull
      npm install
      pm2 restart app
```

## Monitoring and Notifications

### GitHub Status Checks
- All workflows appear as status checks on PRs
- Required checks can be configured in branch protection rules

### Notifications
GitHub Actions automatically notifies:
- Commit authors on workflow failures
- PR authors on check failures
- Repository watchers (configurable)

### Custom Notifications
Add notification steps to workflows:

**Slack:**
```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Email:**
```yaml
- name: Send Email
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: Deployment Complete
    body: Deployment to production completed successfully
```

## Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
- Ensure MongoDB service is configured in workflow
- Check connection string format
- Verify MongoDB version compatibility

**2. Build Timeout**
- Increase timeout in workflow: `timeout-minutes: 30`
- Optimize build process
- Use caching for dependencies

**3. Artifact Upload Failed**
- Check artifact size limits (GitHub free: 500MB)
- Verify artifact path exists
- Check retention days setting

**4. Deployment Failed**
- Verify all required secrets are set
- Check deployment target availability
- Review deployment logs in Actions tab

### Debug Mode
Enable debug logging:

```bash
# In repository settings, add secret:
ACTIONS_STEP_DEBUG = true
ACTIONS_RUNNER_DEBUG = true
```

## Best Practices

1. **Keep workflows fast** (<10 minutes)
2. **Use caching** for node_modules
3. **Fail fast** - stop on first error
4. **Parallel jobs** where possible
5. **Secrets management** - never hardcode
6. **Branch protection** - require CI pass
7. **Review required** for production deploys
8. **Monitor costs** - GitHub Actions minutes

## Cost Optimization

GitHub Actions pricing (as of 2025):
- **Public repos**: Unlimited free minutes
- **Private repos**: 2,000 free minutes/month

Tips to reduce usage:
- Use caching effectively
- Skip CI for documentation changes
- Use `if` conditions to skip unnecessary jobs
- Clean up old artifacts regularly

## Status Badges

Add to README.md:

```markdown
![CI](https://github.com/MikogoIT/CSIT314-GP/workflows/CI%20Pipeline/badge.svg)
![CD](https://github.com/MikogoIT/CSIT314-GP/workflows/CD%20Pipeline/badge.svg)
```

## Support

For issues or questions:
1. Check GitHub Actions documentation
2. Review workflow logs in Actions tab
3. Check this README for common solutions
4. Contact repository maintainers

---

**Last Updated**: November 12, 2025
**Maintained by**: CSIT314 Team
