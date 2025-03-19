# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Green
npm install

# Install client dependencies with legacy-peer-deps to resolve conflicts
Write-Host "Installing client dependencies..." -ForegroundColor Green
Push-Location client
npm install --legacy-peer-deps
Pop-Location

Write-Host "All dependencies installed successfully!" -ForegroundColor Green 