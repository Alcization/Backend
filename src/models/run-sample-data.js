const fs = require('fs');
const path = require('path');
const { sequelize } = require('./index');

async function executeSampleData() {
  console.log('🚀 Inserting sample test data...\n');
  
  try {
    const sqlPath = path.join(__dirname, 'sample_data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await sequelize.query(sql);
    
    console.log('✅ Sample data inserted successfully!\n');
    
    console.log('📋 Test Accounts Created:');
    console.log('─'.repeat(60));
    console.log('Email: john.doe@test.com       | Password: Test@123');
    console.log('Email: nguyen.van.a@test.com   | Password: Test@123');
    console.log('Email: business@test.com       | Password: Test@123');
    console.log('Email: admin@test.com          | Password: Test@123');
    console.log('─'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  executeSampleData();
}

module.exports = executeSampleData;
