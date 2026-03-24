# Deployment Guide

## Overview
This guide covers deploying the CarPool Platform to production environments including traditional servers, cloud platforms, and containerized deployments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Production Build](#local-production-build)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

- Node.js 16+ installed
- MongoDB 4.4+ available
- Docker (for containerized deployment)
- Git for version control
- Domain name (for production)
- SSL/TLS certificate (for HTTPS)

## Local Production Build

### 1. Build Frontend
```bash
cd client
npm run build
# Creates optimized build in client/dist
```

### 2. Serve Frontend with Backend
```bash
cd server
npm install --production
npm start
```

The built frontend will be served from the server's public directory.

## Docker Deployment

### Quick Start with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f server

# Stop services
docker-compose down
```

### Services Included
- **MongoDB**: NoSQL database (port 27017)
- **Node.js Server**: API backend (port 5000)
- **Nginx**: Web server & reverse proxy (port 80)

### Docker Environment Variables
```bash
JWT_SECRET=your_production_secret_key_here
MONGO_URI=mongodb://admin:password@mongodb:27017/carpooling?authSource=admin
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### Build Docker Image
```bash
# Build
docker build -t carpooling-app:latest .

# Run
docker run -d \
  -p 5000:5000 \
  -e MONGO_URI="mongodb://mongo:27017/carpooling" \
  -e JWT_SECRET="your_secret_key" \
  -e NODE_ENV=production \
  --name carpooling \
  carpooling-app:latest
```

## Cloud Deployment

### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create carpooling-platform

# Add buildpacks
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add --index 1 heroku/root-npm-buildpack

# Set config variables
heroku config:set JWT_SECRET="your_production_key"
heroku config:set MONGO_URI="your_mongodb_uri"
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### AWS Deployment

#### Using Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-16 carpooling-platform

# Create environment
eb create production

# Set environment variables
eb setenv JWT_SECRET="your_key" MONGO_URI="your_uri" NODE_ENV=production

# Deploy
eb deploy
```

#### Using EC2
1. Launch EC2 instance (Ubuntu 20.04)
2. Install Node.js and MongoDB
3. Clone repository
4. Install dependencies
5. Setup PM2 for process management
6. Configure Nginx as reverse proxy
7. Setup SSL with Let's Encrypt

### DigitalOcean

#### Using App Platform
1. Connect GitHub repository
2. Configure build: `npm install && npm run build`
3. Set environment variables
4. Configure database component
5. Deploy

#### Using Droplet with Docker
```bash
# SSH into droplet
ssh root@your_droplet_ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone your_repo_url
cd carpooling-platform

# Create production env file
nano .env

# Start services
docker-compose up -d
```

### Google Cloud Run
```bash
# Authenticate
gcloud auth login

# Build image
gcloud builds submit --tag gcr.io/your-project/carpooling

# Deploy
gcloud run deploy carpooling \
  --image gcr.io/your-project/carpooling \
  --platform managed \
  --region us-central1 \
  --set-env-vars "MONGO_URI=your_uri,JWT_SECRET=your_secret"
```

## Environment Configuration

### Production Environment Variables

#### Required (.env)
```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/carpooling?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_very_long_secure_random_string_min_32_chars_12345678
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Best Practices

1. **Secrets Management**
   - Never commit .env to git
   - Use environment-specific secrets
   - Rotate secrets regularly
   - Use services like AWS Secrets Manager

2. **Database**
   - Use MongoDB Atlas with VPC peering
   - Enable authentication
   - Setup IP whitelisting
   - Regular backups

3. **SSL/TLS**
   - Use Let's Encrypt (free)
   - Auto-renew certificates
   - Force HTTPS redirect

4. **API Security**
   - Rate limiting enabled
   - Input validation
   - CORS properly configured
   - No sensitive data in logs

## Monitoring & Maintenance

### Health Checks
```bash
# Check server health
curl https://yourdomain.com/api/health

# Expected response
{
  "status": "OK",
  "message": "Server is running",
  "mongodb": "Connected",
  "uptime": 3600
}
```

### Logging
```bash
# Docker logs
docker-compose logs -f server

# View specific errors
docker-compose logs server | grep ERROR
```

### Performance Monitoring

#### Using PM2 (for non-Docker deployments)
```bash
# Install PM2
npm install -g pm2

# Start process
pm2 start server.js --name "carpooling-api"

# Monitor
pm2 monit

# Setup auto-restart
pm2 startup
pm2 save
```

### Database Maintenance

```bash
# Connect to MongoDB
mongosh

# Create indexes
db.rides.createIndex({ location: "2dsphere" })
db.bookings.createIndex({ userId: 1, createdAt: -1 })

# Monitor performance
db.rides.find({}).explain("executionStats")
```

### SSL Certificate Renewal
```bash
# Using Certbot with Nginx
sudo certbot renew --dry-run
sudo certbot renew  # Renew all certificates
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (NLB/ALB)
- Deploy multiple server instances
- Use centralized database
- Share session storage if needed

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching layer (Redis)
- Compress responses with gzip

## Rollback Procedure

### Docker
```bash
# View previous images
docker images

# Run previous version
docker run -d \
  -p 5000:5000 \
  -e MONGO_URI="..." \
  --name carpooling \
  carpooling-app:previous-tag
```

### Git
```bash
# Revert to previous commit
git revert <commit-hash>
git push

# Or reset (careful!)
git reset --hard <commit-hash>
git push --force
```

## Backup & Recovery

### MongoDB Backup
```bash
# Backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/carpooling" --out ./backup

# Restore
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/carpooling" ./backup
```

### Docker Volume Backup
```bash
# Backup MongoDB volume
docker run --rm -v carpooling-platform_mongodb-data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz -C /data .

# Restore
docker run --rm -v carpooling-platform_mongodb-data:/data -v $(pwd):/backup alpine tar xzf /backup/mongodb-backup.tar.gz -C /data
```

## Performance Optimization

### Frontend
- Use CDN for static assets
- Enable gzip compression
- Minify CSS/JS
- Lazy load images
- Cache static resources

### Backend
- Database query optimization
- Implement Redis caching
- Use pagination
- Compress HTTP responses
- Monitor slow queries

## Troubleshooting

### High Memory Usage
```bash
# Check Node.js memory
node -e "console.log(require('os').totalmem())"

# Monitor heap usage
npm install -g clinic
clinic doctor -- node server.js
```

### Database Connection Issues
```bash
# Test connection
mongo mongodb+srv://user:pass@cluster.mongodb.net/carpooling

# Check network connectivity
nc -zv cluster.mongodb.net 27017
```

### SSL Certificate Issues
```bash
# Check certificate
openssl s_client -connect yourdomain.com:443

# Verify expiration
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout | grep "Not After"
```

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Heroku Deployment](https://devcenter.heroku.com/)
- [AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/)
- [DigitalOcean Documentation](https://www.digitalocean.com/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## Support & Issues

For deployment issues:
1. Check logs for errors
2. Verify environment variables
3. Test database connectivity
4. Check firewall/security groups
5. Review resource usage
