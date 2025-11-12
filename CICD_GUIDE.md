# CI/CD Setup and Usage Guide

## 🚀 Quick Start

Your project now has a complete CI/CD pipeline configured with GitHub Actions!

## 📋 What's Included

### 1. **Continuous Integration (CI)**
- ✅ Automated testing on every push and pull request
- ✅ Code quality checks (ESLint)
- ✅ Security vulnerability scanning
- ✅ Build verification for both frontend and backend
- ✅ Integration tests with MongoDB

### 2. **Continuous Deployment (CD)**
- ✅ Automated deployment to staging and production
- ✅ Build artifact generation
- ✅ Health checks after deployment
- ✅ Automatic rollback on failure

### 3. **Quality Assurance**
- ✅ Pull request validation
- ✅ Bundle size tracking
- ✅ Automated code review bot
- ✅ Daily security audits

### 4. **Docker Support**
- ✅ Dockerfiles for frontend and backend
- ✅ Docker Compose for local development
- ✅ Production-ready nginx configuration

## 🛠️ Setup Instructions

### Step 1: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click on **Settings** → **Actions** → **General**
3. Under "Actions permissions", select **Allow all actions and reusable workflows**
4. Click **Save**

### Step 2: Configure Branch Protection (Recommended)

1. Go to **Settings** → **Branches**
2. Click **Add rule** for `main` branch
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Select: `Frontend CI`, `Backend CI`, `Integration Tests`
4. Click **Create** or **Save changes**

### Step 3: Set Up Environments (Optional)

For deployment workflows:

1. Go to **Settings** → **Environments**
2. Create two environments:
   - `staging`
   - `production`
3. For production, enable:
   - ✅ Required reviewers (add team members)
   - ✅ Wait timer: 5 minutes

### Step 4: Add Secrets (When Ready to Deploy)

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Required secrets for deployment:
```
API_URL              # Your production API URL
VERCEL_TOKEN         # If using Vercel (optional)
PROD_HOST            # Production server IP (optional)
PROD_USER            # SSH username (optional)
PROD_SSH_KEY         # SSH private key (optional)
```

## 📊 Workflows Overview

### CI Pipeline (`ci.yml`)
**Triggers:** Every push to main/develop, every pull request

**What it does:**
1. **Frontend CI**: Installs dependencies, runs lint, tests, and builds React app
2. **Backend CI**: Tests backend with MongoDB, verifies API startup
3. **Security Scan**: Checks for vulnerabilities in dependencies
4. **Code Quality**: Analyzes code complexity
5. **Integration Tests**: Tests full application with database
6. **Summary**: Reports overall pipeline status

**Status:** ✅ Ready to use immediately

### CD Pipeline (`cd.yml`)
**Triggers:** Push to main, manual trigger, or version tags

**What it does:**
1. **Build**: Creates production-ready artifacts
2. **Deploy Staging**: Deploys to staging environment
3. **Deploy Production**: Deploys to production (after staging success)
4. **Health Check**: Verifies deployment health
5. **Rollback**: Automatic rollback if deployment fails

**Status:** ⚠️ Requires deployment configuration (see below)

### PR Checks (`pr-checks.yml`)
**Triggers:** Opening or updating pull requests

**What it does:**
1. Validates PR title follows conventional commits
2. Checks for PR description
3. Adds automated comments
4. Reports bundle size changes

**Status:** ✅ Ready to use immediately

### Scheduled Tasks (`scheduled.yml`)
**Triggers:** Daily at 2 AM UTC, or manual trigger

**What it does:**
1. Checks for outdated dependencies
2. Runs security audits
3. Cleans up old artifacts (>30 days)
4. Performs health checks

**Status:** ✅ Ready to use immediately

## 💻 Local Development with Docker

### Start everything with Docker Compose:

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your settings
notepad .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Services:**
- Frontend: http://localhost:80
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Individual Docker builds:

```bash
# Build frontend
docker build -t csit314-frontend .

# Build backend
docker build -t csit314-backend ./backend

# Run frontend
docker run -p 80:80 csit314-frontend

# Run backend
docker run -p 5000:5000 -e MONGODB_URI=your_uri csit314-backend
```

## 🔧 Customizing Deployments

### Option 1: Deploy to Vercel (Frontend)

1. Install Vercel CLI: `npm i -g vercel`
2. Get Vercel token: `vercel login`
3. Add token to GitHub secrets as `VERCEL_TOKEN`
4. Uncomment Vercel deployment in `cd.yml`

### Option 2: Deploy to Custom Server (SSH)

1. Generate SSH key pair
2. Add private key to GitHub secrets as `PROD_SSH_KEY`
3. Add public key to your server's `~/.ssh/authorized_keys`
4. Update `cd.yml` with your server details

### Option 3: Deploy to AWS/Azure/GCP

1. Set up cloud account credentials
2. Add credentials to GitHub secrets
3. Update `cd.yml` with appropriate deployment actions
4. Examples available in workflow comments

## 📈 Monitoring Your Pipelines

### View Pipeline Status

1. Go to **Actions** tab in GitHub
2. See all workflow runs
3. Click on any run to see detailed logs
4. Green ✅ = Success, Red ❌ = Failed

### Status Badges

Add to your README.md:

```markdown
![CI Status](https://github.com/MikogoIT/CSIT314-GP/workflows/CI%20Pipeline/badge.svg)
![CD Status](https://github.com/MikogoIT/CSIT314-GP/workflows/CD%20Pipeline/badge.svg)
```

### Email Notifications

GitHub automatically sends emails for:
- Failed workflow runs
- Pull request check failures

Configure in: **Settings** → **Notifications**

## 🐛 Troubleshooting

### CI Failing?

**Common issues:**

1. **Tests failing**: Check test logs in Actions tab
   ```bash
   # Run tests locally first
   npm test
   cd backend && npm test
   ```

2. **Build failing**: Verify build works locally
   ```bash
   npm run build
   ```

3. **MongoDB connection**: Workflow includes MongoDB service, but check logs

### Deployment Not Working?

1. Verify all required secrets are set
2. Check deployment logs in Actions tab
3. Ensure deployment target is accessible
4. Test deployment script locally

### Need Help?

1. Check workflow logs in Actions tab
2. Review `.github/workflows/README.md`
3. See GitHub Actions documentation
4. Check workflow comments for examples

## 📝 Best Practices

### 1. Commit Messages
Use conventional commits format:
```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

### 2. Pull Requests
- Always create PRs for changes
- Wait for CI to pass before merging
- Request reviews from team members
- Keep PRs small and focused

### 3. Testing
- Write tests before code (TDD)
- Run tests locally before pushing
- Maintain >80% code coverage
- Test edge cases

### 4. Security
- Never commit secrets or passwords
- Use environment variables
- Keep dependencies updated
- Review security audit results

### 5. Deployment
- Test in staging before production
- Deploy during low-traffic periods
- Monitor logs after deployment
- Have rollback plan ready

## 🎯 Next Steps

### Immediate (Already Done)
- ✅ CI/CD pipelines configured
- ✅ Docker setup complete
- ✅ Documentation created

### Short Term (Recommended)
1. Enable branch protection on main
2. Add team members as required reviewers
3. Test CI pipeline with a sample PR
4. Configure deployment targets

### Medium Term
1. Set up staging environment
2. Configure automatic deployments
3. Add E2E tests with Cypress
4. Set up monitoring (Sentry, New Relic)

### Long Term
1. Implement blue-green deployment
2. Add performance testing
3. Set up feature flags
4. Automate database migrations

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

## 🆘 Support

For questions or issues:
1. Check this guide first
2. Review workflow logs
3. Check `.github/workflows/README.md`
4. Contact repository maintainers

---

**Ready to use!** Push your changes to trigger the CI pipeline.

```bash
git add .
git commit -m "feat: add CI/CD pipeline"
git push origin main
```

Then check the **Actions** tab in GitHub to see your pipeline running! 🎉
