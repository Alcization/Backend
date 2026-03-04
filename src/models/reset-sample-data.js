/**
 * Reset Sample Data - Clean and Re-insert
 */

const cleanupSampleData = require('./cleanup-sample-data');
const insertSampleData = require('./run-sample-data');

async function resetSampleData() {
  console.log('🔄 Resetting sample data...\n');
  
  try {
    // Auto-cleanup without prompting (since this is a reset)
    const { sequelize } = require('./index');
    
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
    
    console.log('🧹 Cleaning up old test data...');
    await sequelize.query(cleanupSql);
    console.log('✅ Cleanup complete\n');
    
    await sequelize.close();
    
    // Re-insert
    console.log('📥 Inserting fresh test data...');
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  resetSampleData();
}

module.exports = resetSampleData;
