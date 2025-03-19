# Install server dependencies
echo "Installing server dependencies..."
npm install

# Install client dependencies with legacy-peer-deps to resolve conflicts
echo "Installing client dependencies..."
cd client
npm install --legacy-peer-deps

echo "All dependencies installed successfully!" 