/**
 * Generate Bcrypt Hash for Sample Data
 * Run: node src/models/generate-password-hash.js
 */

const bcrypt = require('bcryptjs');

const PASSWORD = 'Test@123';
const SALT_ROUNDS = 10;

async function generateHash() {
  console.log('Generating bcrypt hash for password:', PASSWORD);
  console.log('Salt rounds:', SALT_ROUNDS);
  console.log('-------------------\n');
  
  const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  
  console.log('Generated hash:');
  console.log(hash);
  console.log('\n-------------------');
  console.log('INSTRUCTIONS:');
  console.log('1. Copy the hash above');
  console.log('2. Open src/models/sample_data.sql');
  console.log('3. Find & Replace: $2b$10$XYZ123456789ABCDEF');
  console.log('4. Replace with the hash you just copied');
  console.log('5. Save the file and run the SQL script');
  console.log('-------------------\n');
  
  // Verify the hash works
  const isValid = await bcrypt.compare(PASSWORD, hash);
  console.log('Hash verification:', isValid ? '✓ Valid' : '✗ Invalid');
  
  // Generate command for sed (Unix) or PowerShell (Windows)
  console.log('\n-------------------');
  console.log('AUTO-REPLACE COMMANDS:');
  console.log('\nFor PowerShell (Windows):');
  console.log(`(Get-Content src/models/sample_data.sql) -replace '\\$2b\\$10\\$XYZ123456789ABCDEF', '${hash}' | Set-Content src/models/sample_data.sql`);
  
  console.log('\nFor Bash/Unix:');
  console.log(`sed -i 's|\\$2b\\$10\\$XYZ123456789ABCDEF|${hash}|g' src/models/sample_data.sql`);
  console.log('-------------------\n');
}

generateHash()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
