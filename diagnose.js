const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
}

const issues = []

const log = {
  error: (msg) => console.log(`${colors.red}✕ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
}

const checkFileExists = (filePath, description) => {
  if (!fs.existsSync(filePath)) {
    issues.push({ type: 'missing', file: filePath, description })
    log.error(`Missing: ${description} - ${filePath}`)
    return false
  }
  log.success(`Found: ${description}`)
  return true
}

const checkDirectoryExists = (dirPath, description) => {
  if (!fs.existsSync(dirPath)) {
    issues.push({ type: 'missing_dir', dir: dirPath, description })
    log.error(`Missing Directory: ${description} - ${dirPath}`)
    return false
  }
  log.success(`Found Directory: ${description}`)
  return true
}

const checkPackageJson = (pkgPath, type) => {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    
    if (!pkg.name) {
      issues.push({ type: 'config', file: pkgPath, issue: 'Missing name field' })
      log.error(`${type} package.json missing name field`)
      return false
    }
    
    if (!pkg.scripts) {
      issues.push({ type: 'config', file: pkgPath, issue: 'Missing scripts section' })
      log.error(`${type} package.json missing scripts`)
      return false
    }

    log.success(`${type} package.json is valid`)
    return true
  } catch (err) {
    issues.push({ type: 'syntax', file: pkgPath, error: err.message })
    log.error(`${type} package.json has syntax error: ${err.message}`)
    return false
  }
}

const checkFileContent = (filePath, requiredStrings, description) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const missing = requiredStrings.filter(str => !content.includes(str))
    
    if (missing.length > 0) {
      issues.push({ type: 'content', file: filePath, missing, description })
      log.error(`${description} - Missing content in ${filePath}`)
      return false
    }
    
    log.success(description)
    return true
  } catch (err) {
    issues.push({ type: 'read_error', file: filePath, error: err.message })
    log.error(`Cannot read ${filePath}: ${err.message}`)
    return false
  }
}

const main = () => {
  log.title('🔍 CarPool Project Diagnostic')

  const root = path.join(__dirname)
  const clientDir = path.join(root, 'client')
  const serverDir = path.join(root, 'server')

  // Check main structure
  log.title('📁 Checking Project Structure')
  checkDirectoryExists(clientDir, 'Client directory')
  checkDirectoryExists(serverDir, 'Server directory')

  // Check client files
  log.title('📦 Checking Client Files')
  checkFileExists(path.join(clientDir, 'package.json'), 'Client package.json')
  checkFileExists(path.join(clientDir, 'vite.config.js'), 'Client vite.config.js')
  checkFileExists(path.join(clientDir, 'tailwind.config.js'), 'Tailwind config')
  checkFileExists(path.join(clientDir, 'postcss.config.js'), 'PostCSS config')
  checkFileExists(path.join(clientDir, 'index.html'), 'Client index.html')
  checkFileExists(path.join(clientDir, 'src', 'main.jsx'), 'Client main.jsx')
  checkFileExists(path.join(clientDir, 'src', 'App.jsx'), 'Client App.jsx')
  checkFileExists(path.join(clientDir, 'src', 'index.css'), 'Client index.css')

  // Check client directories
  log.title('📂 Checking Client Directories')
  checkDirectoryExists(path.join(clientDir, 'src'), 'src directory')
  checkDirectoryExists(path.join(clientDir, 'src', 'components'), 'components directory')
  checkDirectoryExists(path.join(clientDir, 'src', 'pages'), 'pages directory')
  checkDirectoryExists(path.join(clientDir, 'src', 'context'), 'context directory')

  // Check server files
  log.title('🔧 Checking Server Files')
  checkFileExists(path.join(serverDir, 'package.json'), 'Server package.json')
  checkFileExists(path.join(serverDir, 'server.js'), 'Server server.js')
  checkFileExists(path.join(serverDir, '.env'), 'Server .env file')

  // Check server directories
  log.title('📂 Checking Server Directories')
  checkDirectoryExists(path.join(serverDir, 'models'), 'models directory')
  checkDirectoryExists(path.join(serverDir, 'routes'), 'routes directory')
  checkDirectoryExists(path.join(serverDir, 'middleware'), 'middleware directory')

  // Validate package.json files
  log.title('✅ Validating Configuration Files')
  checkPackageJson(path.join(clientDir, 'package.json'), 'Client')
  checkPackageJson(path.join(serverDir, 'package.json'), 'Server')

  // Check Vite config
  log.title('⚙️  Checking Configuration Content')
  checkFileContent(
    path.join(clientDir, 'vite.config.js'),
    ['defineConfig', '@vitejs/plugin-react', 'resolve.alias'],
    'Vite config has required exports'
  )

  checkFileContent(
    path.join(clientDir, 'tailwind.config.js'),
    ['content', 'theme', 'plugins'],
    'Tailwind config has required structure'
  )

  checkFileContent(
    path.join(serverDir, 'server.js'),
    ['express', 'mongoose.connect', 'PORT'],
    'Server.js has required setup'
  )

  // Check client components exist
  log.title('🎨 Checking Client Components')
  const requiredComponents = [
    'Navbar.jsx',
    'Loading.jsx',
    'ProtectedRoute.jsx',
    'Card.jsx',
    'Alert.jsx',
    'Badge.jsx',
  ]

  requiredComponents.forEach(comp => {
    checkFileExists(
      path.join(clientDir, 'src', 'components', comp),
      `Component: ${comp}`
    )
  })

  // Check client pages exist
  log.title('📄 Checking Client Pages')
  const requiredPages = [
    'Home.jsx',
    'Login.jsx',
    'Register.jsx',
    'SearchRides.jsx',
    'RideDetail.jsx',
    'PassengerDashboard.jsx',
    'DriverDashboard.jsx',
    'CreateRide.jsx',
    'MyBookings.jsx',
  ]

  requiredPages.forEach(page => {
    checkFileExists(
      path.join(clientDir, 'src', 'pages', page),
      `Page: ${page}`
    )
  })

  // Check context files
  log.title('📋 Checking Context Files')
  checkFileExists(
    path.join(clientDir, 'src', 'context', 'AuthContext.jsx'),
    'AuthContext.jsx'
  )

  // Check server models
  log.title('🗄️  Checking Server Models')
  const requiredModels = ['User.js', 'Ride.js', 'Booking.js']
  requiredModels.forEach(model => {
    checkFileExists(
      path.join(serverDir, 'models', model),
      `Model: ${model}`
    )
  })

  // Check server routes
  log.title('🛣️  Checking Server Routes')
  const requiredRoutes = ['auth.js', 'rides.js', 'bookings.js', 'passengers.js', 'drivers.js']
  requiredRoutes.forEach(route => {
    checkFileExists(
      path.join(serverDir, 'routes', route),
      `Route: ${route}`
    )
  })

  // Check middleware
  log.title('🔐 Checking Middleware')
  checkFileExists(
    path.join(serverDir, 'middleware', 'auth.js'),
    'Auth middleware'
  )

  // Check dependencies
  log.title('📚 Checking Dependencies Installation')
  const clientNodeModules = path.join(clientDir, 'node_modules')
  const serverNodeModules = path.join(serverDir, 'node_modules')

  if (fs.existsSync(clientNodeModules)) {
    log.success('Client node_modules installed')
  } else {
    issues.push({ type: 'dependencies', location: 'client', issue: 'node_modules not installed' })
    log.warning('Client dependencies not installed - Run: cd client && npm install')
  }

  if (fs.existsSync(serverNodeModules)) {
    log.success('Server node_modules installed')
  } else {
    issues.push({ type: 'dependencies', location: 'server', issue: 'node_modules not installed' })
    log.warning('Server dependencies not installed - Run: cd server && npm install')
  }

  // Summary
  log.title('📊 Diagnostic Summary')
  console.log(`Total Issues Found: ${colors.red}${issues.length}${colors.reset}\n`)

  if (issues.length === 0) {
    log.success('✨ All checks passed! Your project is ready.')
    return
  }

  // Group issues by type
  const groupedIssues = {}
  issues.forEach(issue => {
    if (!groupedIssues[issue.type]) {
      groupedIssues[issue.type] = []
    }
    groupedIssues[issue.type].push(issue)
  })

  // Display grouped issues
  Object.entries(groupedIssues).forEach(([type, typeIssues]) => {
    const typeLabel = {
      missing: '❌ Missing Files',
      missing_dir: '❌ Missing Directories',
      syntax: '⚠️  Syntax Errors',
      config: '⚙️  Configuration Issues',
      content: '📝 Content Issues',
      read_error: '🔍 Read Errors',
      dependencies: '📦 Dependency Issues',
    }

    console.log(`\n${typeLabel[type] || type}:`)
    typeIssues.forEach(issue => {
      if (issue.file) {
        console.log(`  - ${issue.file}`)
        if (issue.description) console.log(`    ${issue.description}`)
        if (issue.error) console.log(`    Error: ${issue.error}`)
        if (issue.missing) console.log(`    Missing: ${issue.missing.join(', ')}`)
      } else if (issue.dir) {
        console.log(`  - ${issue.dir}`)
        if (issue.description) console.log(`    ${issue.description}`)
      } else if (issue.location) {
        console.log(`  - ${issue.location}: ${issue.issue}`)
      }
    })
  })

  // Recommendations
  log.title('💡 Recommendations')
  if (groupedIssues['missing'] || groupedIssues['missing_dir']) {
    log.warning('Create missing files and directories from the provided templates')
  }
  if (groupedIssues['dependencies']) {
    log.warning('Run install scripts:')
    console.log(`  ${colors.cyan}cd client && npm install${colors.reset}`)
    console.log(`  ${colors.cyan}cd server && npm install${colors.reset}`)
  }
  if (groupedIssues['syntax']) {
    log.warning('Fix syntax errors in configuration files')
  }

  process.exit(issues.length > 0 ? 1 : 0)
}

main()
