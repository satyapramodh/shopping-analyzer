@echo off
REM Simple Python HTTP Server Launcher for Costco Dashboard
REM No build system, no dependencies - just serve and open!

echo Starting Costco Dashboard...
echo.
echo Server will run at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

python -m http.server 8000
