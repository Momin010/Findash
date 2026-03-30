#!/bin/bash

echo "🚀 Financial Dashboard Setup"
echo "=============================="

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun is installed"

# Install root dependencies
echo "📦 Installing root dependencies..."
bun install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
bun install
cd ..

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
bun install
cd ..

# Create environment files if they don't exist
echo "📝 Setting up environment files..."

if [ ! -f client/.env ]; then
    cp client/.env.example client/.env
    echo "✅ Created client/.env"
else
    echo "⚠️  client/.env already exists"
fi

if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo "✅ Created server/.env"
else
    echo "⚠️  server/.env already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit client/.env and server/.env with your credentials"
echo "2. Set up your Supabase database using server/database/schema.sql"
echo "3. Run 'bun run dev' to start development"
echo ""
echo "Happy coding! 🎉"
