const fs = require('fs');
const path = require('path');

// Function to safely remove a file or directory
function safeRemove(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      const stats = fs.statSync(targetPath);
      
      if (stats.isDirectory()) {
        // Remove directory recursively
        fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 3 });
        console.log(`✓ Removed directory: ${targetPath}`);
      } else if (stats.isFile() || stats.isSymbolicLink()) {
        // Remove file or symlink
        try {
          fs.unlinkSync(targetPath);
          console.log(`✓ Removed file/symlink: ${targetPath}`);
        } catch (unlinkError) {
          // If unlink fails, try to remove as directory (for junction points on Windows)
          try {
            fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 3 });
            console.log(`✓ Removed (as directory): ${targetPath}`);
          } catch (rmError) {
            console.warn(`⚠ Could not remove: ${targetPath} - ${rmError.message}`);
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors for non-existent paths or permission issues
    if (error.code !== 'ENOENT') {
      console.warn(`⚠ Error processing ${targetPath}: ${error.message}`);
    }
  }
}

// Main cleanup function
function cleanBuild() {
  const nextDir = path.join(process.cwd(), '.next');
  
  console.log('🧹 Cleaning .next directory for Windows build...\n');
  
  // Check if .next directory exists
  if (!fs.existsSync(nextDir)) {
    console.log('✓ .next directory does not exist, nothing to clean.\n');
    return;
  }
  
  // Specific problematic paths that cause Windows symlink issues
  const problematicPaths = [
    path.join(nextDir, 'server', 'pages', 'lead'),
    path.join(nextDir, 'server', 'pages'),
    path.join(nextDir, 'server'),
    path.join(nextDir, 'cache'),
  ];
  
  // Try to remove specific problematic paths first
  problematicPaths.forEach(targetPath => {
    safeRemove(targetPath);
  });
  
  // If the entire .next directory still exists and we're on Windows, try a more aggressive cleanup
  if (process.platform === 'win32' && fs.existsSync(nextDir)) {
    console.log('\n🔧 Performing Windows-specific cleanup...');
    
    // Try to remove the entire .next directory
    try {
      // Prefer Node.js fs methods to avoid spawn issues on Windows
      safeRemove(nextDir);
      console.log('✓ Cleaned .next directory using Node.js\n');
    } catch (error) {
      console.warn(`⚠ Could not fully clean .next directory: ${error.message}`);
      console.log('⚠ You may need to manually delete the .next folder and try again.\n');
    }
  } else {
    // For non-Windows, just remove the entire .next directory
    safeRemove(nextDir);
  }
  
  console.log('✅ Cleanup complete!\n');
}

// Run cleanup
try {
  cleanBuild();
  process.exit(0);
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  // Don't exit with error code - let the build continue
  // The build might still work even if cleanup partially fails
  process.exit(0);
}

