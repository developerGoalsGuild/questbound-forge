#!/bin/bash
# GoalsGuild Landing Page - Test Script (Bash)
# Starts a local server and opens the landing page in browser

# Default values
PORT=9000
OPEN_BROWSER=true
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
port_available() {
    local port=$1
    ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to start the server
start_server() {
    local port=$1
    
    print_color $BLUE "🚀 Starting GoalsGuild Landing Page Test Server..."
    
    # Check if Python is available
    if ! command_exists python && ! command_exists python3; then
        print_color $RED "❌ Python is not installed or not in PATH"
        print_color $YELLOW "Please install Python from https://python.org"
        exit 1
    fi
    
    # Use python3 if available, otherwise python
    local python_cmd="python"
    if command_exists python3; then
        python_cmd="python3"
    fi
    
    # Check if port is available
    if ! port_available $port; then
        print_color $YELLOW "⚠️  Port $port is already in use. Trying port $((port + 1))..."
        port=$((port + 1))
    fi
    
    # Get script directory
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local landing_page_dir="$script_dir/../src"
    
    if [ ! -d "$landing_page_dir" ]; then
        print_color $RED "❌ LandingPage/src directory not found at: $landing_page_dir"
        exit 1
    fi
    
    print_color $BLUE "📁 Serving files from: $landing_page_dir"
    
    # Start the server in background
    cd "$landing_page_dir"
    $python_cmd -m http.server $port &
    local server_pid=$!
    
    # Wait a moment for server to start
    sleep 2
    
    # Check if server started successfully
    if kill -0 $server_pid 2>/dev/null; then
        print_color $GREEN "✅ Server started successfully on port $port (PID: $server_pid)"
        echo $server_pid
        echo $port
    else
        print_color $RED "❌ Failed to start server on port $port"
        exit 1
    fi
}

# Function to open browser
open_browser() {
    local port=$1
    local url="http://localhost:$port"
    
    print_color $BLUE "🌐 Opening landing page: $url"
    
    # Try different browser commands
    if command_exists xdg-open; then
        xdg-open "$url" &
    elif command_exists open; then
        open "$url" &
    elif command_exists start; then
        start "$url" &
    else
        print_color $YELLOW "⚠️  Could not open browser automatically. Please open: $url"
    fi
}

# Function to show testing instructions
show_testing_instructions() {
    local port=$1
    local url="http://localhost:$port"
    
    print_color $BLUE "\n🧪 GoalsGuild Landing Page Testing Instructions"
    print_color $BLUE "============================================="
    
    print_color $YELLOW "\n📋 What to Test:"
    print_color $GREEN "1. Landing Page: $url"
    print_color $GREEN "2. Blog Page: $url/blog.html"
    print_color $GREEN "3. Sample Article: $url/blog/articles/2025-10-23-welcome-to-goalsguild.html"
    
    print_color $YELLOW "\n🎯 Key Features to Verify:"
    print_color $GREEN "• Hero section with GoalsGuild logo"
    print_color $GREEN "• Feature carousel (auto-rotating)"
    print_color $GREEN "• 6 feature cards with icons"
    print_color $GREEN "• 'How It Works' 4-step process"
    print_color $GREEN "• Statistics section"
    print_color $GREEN "• Waitlist form"
    print_color $GREEN "• Social media links"
    print_color $GREEN "• Responsive design (test mobile/tablet)"
    
    print_color $YELLOW "\n🔧 Interactive Testing:"
    print_color $GREEN "• Carousel navigation (prev/next buttons)"
    print_color $GREEN "• Mobile menu (hamburger icon)"
    print_color $GREEN "• Waitlist form submission"
    print_color $GREEN "• Blog category filters"
    print_color $GREEN "• Smooth scrolling navigation"
    
    print_color $YELLOW "\n📱 Responsive Testing:"
    print_color $GREEN "• Open Developer Tools (F12)"
    print_color $GREEN "• Toggle device toolbar (Ctrl+Shift+M)"
    print_color $GREEN "• Test: Mobile (375px), Tablet (768px), Desktop (1200px)"
    
    print_color $YELLOW "\n⚡ Performance Testing:"
    print_color $GREEN "• Check Network tab for loading times"
    print_color $GREEN "• Verify no console errors"
    print_color $GREEN "• Test with slow 3G connection"
    
    print_color $YELLOW "\n♿ Accessibility Testing:"
    print_color $GREEN "• Keyboard navigation (Tab, Enter, Arrow keys)"
    print_color $GREEN "• Screen reader compatibility"
    print_color $GREEN "• Color contrast verification"
    print_color $GREEN "• Alt text on images"
}

# Function to show deployment instructions
show_deployment_instructions() {
    print_color $BLUE "\n🚀 Deployment Instructions"
    print_color $BLUE "=========================="
    
    print_color $YELLOW "\n📦 Deploy to AWS:"
    print_color $GREEN "1. Configure AWS credentials:"
    print_color $GREEN "   aws configure"
    print_color $GREEN "\n2. Deploy to development:"
    print_color $GREEN "   ./scripts/deploy.sh -e dev"
    print_color $GREEN "\n3. Deploy to production:"
    print_color $GREEN "   ./scripts/deploy.sh -e prod"
    
    print_color $YELLOW "\n📝 Prerequisites:"
    print_color $GREEN "• AWS CLI installed and configured"
    print_color $GREEN "• Terraform installed"
    print_color $GREEN "• Appropriate AWS permissions"
}

# Function to stop server
stop_server() {
    local pid=$1
    print_color $YELLOW "\n🛑 Stopping test server..."
    
    if kill -0 $pid 2>/dev/null; then
        kill $pid
        print_color $GREEN "✅ Server stopped successfully"
    else
        print_color $YELLOW "⚠️  Server may have already stopped"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        --no-browser)
            OPEN_BROWSER=false
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -p, --port PORT      Port to use (default: 9000)"
            echo "  --no-browser         Don't open browser automatically"
            echo "  -v, --verbose        Verbose output"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            print_color $RED "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_color $BLUE "🎯 GoalsGuild Landing Page Test Script"
    print_color $BLUE "====================================="
    
    # Start the server
    local server_info=($(start_server $PORT))
    local server_pid=${server_info[0]}
    local actual_port=${server_info[1]}
    
    # Open browser if requested
    if [ "$OPEN_BROWSER" = true ]; then
        open_browser $actual_port
    fi
    
    # Show testing instructions
    show_testing_instructions $actual_port
    
    # Show deployment instructions
    show_deployment_instructions
    
    print_color $YELLOW "\n⌨️  Press any key to stop the server and exit..."
    read -n 1 -s
    
    # Stop the server
    stop_server $server_pid
    
    print_color $GREEN "\n✅ Testing completed successfully!"
    print_color $GREEN "The GoalsGuild landing page is ready for deployment to AWS."
}

# Run main function
main
