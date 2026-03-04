const { sequelize } = require('./index');

async function verifyData() {
  try {
    const [users] = await sequelize.query(`
      SELECT 
        ua.email,
        ua.account_type,
        ua.status,
        CASE 
          WHEN iu.full_name IS NOT NULL THEN iu.full_name
          WHEN bu.company_name IS NOT NULL THEN bu.company_name
          WHEN ao.department IS NOT NULL THEN ao.department
        END as name,
        STRING_AGG(r.name, ', ') as roles
      FROM user_account ua
      LEFT JOIN individual_user iu ON ua.user_id = iu.user_id
      LEFT JOIN business_user bu ON ua.user_id = bu.user_id
      LEFT JOIN administrative_officer ao ON ua.user_id = ao.user_id
      LEFT JOIN user_roles ur ON ua.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE ua.email LIKE '%@test.com'
      GROUP BY ua.email, ua.account_type, ua.status, iu.full_name, bu.company_name, ao.department
      ORDER BY ua.email;
    `);
    
    console.log('✨ Test Users in Database:\n');
    console.log('─'.repeat(80));
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`  Type: ${user.account_type}`);
      console.log(`  Name: ${user.name || 'N/A'}`);
      console.log(`  Roles: ${user.roles || 'None'}`);
      console.log(`  Status: ${user.status}`);
      console.log('');
    });
    console.log('─'.repeat(80));
    
    const [counts] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM user_account WHERE email LIKE '%@test.com') as users,
        (SELECT COUNT(*) FROM saved_location) as locations,
        (SELECT COUNT(*) FROM notification_preference) as preferences,
        (SELECT COUNT(*) FROM noti_event) as notifications;
    `);
    
    console.log('\n📊 Data Summary:');
    console.log(`   Test Users: ${counts[0].users}`);
    console.log(`   Saved Locations: ${counts[0].locations}`);
    console.log(`   Notification Preferences: ${counts[0].preferences}`);
    console.log(`   Notification Events: ${counts[0].notifications}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verifyData();
