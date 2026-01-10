#!/bin/bash
# Simple Python HTTP Server Launcher for Costco Dashboard
# No build system, no dependencies - just serve and open!

echo "Starting Costco Dashboard..."
echo ""
echo "Server will run at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000
