const { sequelize } = require('./index');
const fs = require('fs');
const path = require('path');

async function createRefreshTokenTable() {
  const sql = fs.readFileSync(path.join(__dirname, 'create-refresh-token-table.sql'), 'utf8');
  await sequelize.query(sql);
  console.log('refresh_token table created');
  await sequelize.close();
}

createRefreshTokenTable().catch(console.error);
