const fs = require('fs');
const path = require('path');

// Update package.json for production
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Update module aliases for production
if (process.env.NODE_ENV === 'production') {
  packageJson._moduleAliases = {
    "@": "dist"
  };
} else {
  packageJson._moduleAliases = {
    "@": "src"
  };
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log(`Updated module aliases for ${process.env.NODE_ENV || 'development'} environment`);
