const { sequelize } = require('./index');

async function cleanupSampleData() {
  console.log('🧹 Cleaning up test data...\n');
  
  try {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.warn('⚠️  This will delete all users with @test.com emails and related data.');
    const answer = await new Promise(resolve => {
      readline.question('Continue? (yes/N): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled.');
      process.exit(0);
    }
    
    console.log('\n⏳ Deleting test data...\n');
    
    const cleanupSql = `
      DELETE FROM risk_assessment WHERE trip_id IN (SELECT trip_id FROM trip WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com'));
      DELETE FROM trip WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
      DELETE FROM saved_route WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
      DELETE FROM saved_location WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
      DELETE FROM noti_event WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
      DELETE FROM notification_preference WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
      DELETE FROM refresh_token WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
      DELETE FROM user_roles WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
      DELETE FROM business_user WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
      DELETE FROM individual_user WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
      DELETE FROM administrative_officer WHERE user_id IN (SELECT user_id FROM user_account WHERE email LIKE '%@test.com');
      DELETE FROM user_account WHERE email LIKE '%@test.com';
    `;
    
    await sequelize.query(cleanupSql);
    
    console.log('✅ All test data successfully removed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  cleanupSampleData();
}

module.exports = cleanupSampleData;
