const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  distDir: path.resolve(__dirname, '../dist'),
  deploymentDir: process.env.DEPLOYMENT_DIR || '/var/www/html',
  backupDir: path.resolve(__dirname, '../backups'),
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
};

// Ensure directories exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Create backup of current deployment
function createBackup() {
  console.log('Creating backup of current deployment...');
  if (fs.existsSync(config.deploymentDir)) {
    const backupPath = path.join(config.backupDir, `backup-${config.timestamp}`);
    ensureDirectoryExists(config.backupDir);
    execSync(`cp -r "${config.deploymentDir}" "${backupPath}"`);
    console.log(`Backup created at: ${backupPath}`);
  }
}

// Deploy the build
function deploy() {
  console.log('Starting deployment process...');

  try {
    // Verify build exists
    if (!fs.existsSync(config.distDir)) {
      throw new Error('Build directory not found. Run npm run build first.');
    }

    // Create backup
    createBackup();

    // Clear deployment directory
    console.log('Clearing deployment directory...');
    execSync(`rm -rf "${config.deploymentDir}/*"`);

    // Copy new build
    console.log('Copying new build...');
    execSync(`cp -r "${config.distDir}/"* "${config.deploymentDir}/"`);

    // Set permissions
    console.log('Setting permissions...');
    execSync(`chmod -R 755 "${config.deploymentDir}"`);

    console.log('Deployment completed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error.message);
    
    // Attempt to restore from latest backup
    const backups = fs.readdirSync(config.backupDir).sort().reverse();
    if (backups.length > 0) {
      console.log('Attempting to restore from latest backup...');
      const latestBackup = path.join(config.backupDir, backups[0]);
      execSync(`cp -r "${latestBackup}/"* "${config.deploymentDir}/"`);
      console.log('Restored from backup successfully.');
    }
    
    process.exit(1);
  }
}

// Run deployment
deploy(); 