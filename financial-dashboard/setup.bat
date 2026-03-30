@echo off
chcp 65001 >nul
echo 🚀 Financial Dashboard Setup
echo ==============================

REM Check if Bun is installed
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Bun is not installed. Please install Bun first:
    echo    powershell -c "irm bun.sh/install.ps1|iex"
    pause
    exit /b 1
)

echo ✅ Bun is installed

REM Install root dependencies
echo 📦 Installing root dependencies...
call bun install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

REM Install client dependencies
echo 📦 Installing client dependencies...
cd client
call bun install
if %errorlevel% neq 0 (
    echo ❌ Failed to install client dependencies
    pause
    exit /b 1
)
cd ..

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
call bun install
if %errorlevel% neq 0 (
    echo ❌ Failed to install server dependencies
    pause
    exit /b 1
)
cd ..

REM Create environment files if they don't exist
echo 📝 Setting up environment files...

if not exist client\.env (
    copy client\.env.example client\.env
    echo ✅ Created client\.env
) else (
    echo ⚠️  client\.env already exists
)

if not exist server\.env (
    copy server\.env.example server\.env
    echo ✅ Created server\.env
) else (
    echo ⚠️  server\.env already exists
)

echo.
echo ✨ Setup complete!
echo.
echo Next steps:
echo 1. Edit client\.env and server\.env with your credentials
echo 2. Set up your Supabase database using server\database\schema.sql
echo 3. Run 'bun run dev' to start development
echo.
echo Happy coding! 🎉
pause
