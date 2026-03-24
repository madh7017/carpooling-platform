#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Helper functions
print_title() {
    echo -e "\n${BOLD}${CYAN}$1${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✕ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Check if Node.js is installed
print_title "🚗 CarPool Platform - Installation"

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

print_info "Node.js version: $(node --version)"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CLIENT_DIR="$SCRIPT_DIR/client"
SERVER_DIR="$SCRIPT_DIR/server"

print_info "Project Root: $SCRIPT_DIR"

# Check directories exist
if [ ! -d "$CLIENT_DIR" ]; then
    print_error "Client directory not found: $CLIENT_DIR"
    exit 1
fi

if [ ! -d "$SERVER_DIR" ]; then
    print_error "Server directory not found: $SERVER_DIR"
    exit 1
fi

# Install Client Dependencies
print_title "📦 Installing Client Dependencies"
print_info "Directory: $CLIENT_DIR"

cd "$CLIENT_DIR"
if [ -d "node_modules" ]; then
    print_warning "node_modules already exists, skipping..."
else
    print_info "Running: npm install"
    npm install
    if [ $? -eq 0 ]; then
        print_success "Client dependencies installed"
    else
        print_error "Failed to install client dependencies"
        exit 1
    fi
fi

# Install Server Dependencies
print_title "📦 Installing Server Dependencies"
print_info "Directory: $SERVER_DIR"

cd "$SERVER_DIR"
if [ -d "node_modules" ]; then
    print_warning "node_modules already exists, skipping..."
else
    print_info "Running: npm install"
    npm install
    if [ $? -eq 0 ]; then
        print_success "Server dependencies installed"
    else
        print_error "Failed to install server dependencies"
        exit 1
    fi
fi

# Create .env file if it doesn't exist
print_title "⚙️  Setting Up Environment Variables"

ENV_FILE="$SERVER_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << 'EOF'
MONGO_URI=mongodb://localhost:27017/carpooling
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
EOF
    print_success ".env file created"
    print_warning "Please update JWT_SECRET with a secure key"
else
    print_info ".env file already exists"
fi

# Summary
print_title "✨ Installation Complete!"
print_success "All dependencies have been installed"

echo -e "${BOLD}Next Steps:${NC}"
echo ""
echo "1. ${CYAN}Start MongoDB${NC}"
echo "   Make sure MongoDB is running on localhost:27017"
echo ""
echo "2. ${CYAN}Start the Backend${NC}"
echo "   cd server && npm run dev"
echo ""
echo "3. ${CYAN}Start the Frontend${NC}"
echo "   cd client && npm run dev"
echo ""
echo "4. ${CYAN}Open in Browser${NC}"
echo "   http://localhost:5173"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:5000/api"
echo ""
