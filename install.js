const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
}

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✕ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
}

const exec = (command, cwd) => {
  try {
    execSync(command, { cwd, stdio: 'inherit' })
    return true
  } catch (error) {
    return false
  }
}

const main = async () => {
  log.title('🚗 CarPool Platform - Dependency Installation')

  const projectRoot = __dirname
  const clientDir = path.join(projectRoot, 'client')
  const serverDir = path.join(projectRoot, 'server')

  // Check if directories exist
  if (!fs.existsSync(clientDir)) {
    log.error(`Client directory not found: ${clientDir}`)
    process.exit(1)
  }

  if (!fs.existsSync(serverDir)) {
    log.error(`Server directory not found: ${serverDir}`)
    process.exit(1)
  }

  // Install Client Dependencies
  log.title('📦 Installing Client Dependencies')
  log.info(`Directory: ${clientDir}`)

  if (fs.existsSync(path.join(clientDir, 'node_modules'))) {
    log.warning('node_modules already exists, skipping...')
  } else {
    log.info('Running: npm install')
    if (exec('npm install', clientDir)) {
      log.success('Client dependencies installed successfully')
    } else {
      log.error('Failed to install client dependencies')
      process.exit(1)
    }
  }

  // Install Server Dependencies
  log.title('📦 Installing Server Dependencies')
  log.info(`Directory: ${serverDir}`)

  if (fs.existsSync(path.join(serverDir, 'node_modules'))) {
    log.warning('node_modules already exists, skipping...')
  } else {
    log.info('Running: npm install')
    if (exec('npm install', serverDir)) {
      log.success('Server dependencies installed successfully')
    } else {
      log.error('Failed to install server dependencies')
      process.exit(1)
    }
  }

  // Create .env file if it doesn't exist
  log.title('⚙️  Setting Up Environment Variables')

  const envPath = path.join(serverDir, '.env')
  if (!fs.existsSync(envPath)) {
    const envContent = `MONGO_URI=mongodb://localhost:27017/carpooling
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
`
    fs.writeFileSync(envPath, envContent)
    log.success('.env file created')
    log.warning('⚠️  Please update the JWT_SECRET in .env file with a secure key')
  } else {
    log.info('.env file already exists')
  }

  // Summary
  log.title('✨ Installation Complete!')
  log.success('All dependencies have been installed')

  console.log(`\n${colors.bright}Next Steps:${colors.reset}`)
  console.log(`\n1. ${colors.cyan}Start MongoDB${colors.reset}`)
  console.log(`   Make sure MongoDB is running on localhost:27017`)

  console.log(`\n2. ${colors.cyan}Start the Backend${colors.reset}`)
  console.log(`   cd server && npm run dev`)

  console.log(`\n3. ${colors.cyan}Start the Frontend${colors.reset}`)
  console.log(`   cd client && npm run dev`)

  console.log(`\n4. ${colors.cyan}Open in Browser${colors.reset}`)
  console.log(`   http://localhost:5173`)

  console.log(`\n${colors.yellow}Documentation:${colors.reset}`)
  console.log(`   Frontend: http://localhost:5173`)
  console.log(`   Backend API: http://localhost:5000/api`)

  console.log()
}

main().catch(error => {
  log.error(error.message)
  process.exit(1)
})
