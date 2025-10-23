@echo off
echo 🎯 GoalsGuild Landing Page - Local Test Server
echo =============================================

cd /d "%~dp0..\src"

echo 📁 Current directory: %CD%
echo 📋 Files in directory:
dir /b

echo.
echo 🚀 Starting HTTP server on port 9000...
echo 🌐 Open your browser and go to: http://localhost:9000
echo 📝 Press Ctrl+C to stop the server
echo.

python -m http.server 9000
