const fs = require('fs');
const path = require('path');
const sequelize = require('./config/db');

async function runMigration() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        const sqlPath = path.join(__dirname, '../../db_schema_updates.sql');
        console.log(`Reading SQL from: ${sqlPath}`);

        if (!fs.existsSync(sqlPath)) {
            console.error('SQL file not found!');
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration script...');
        // Execute the entire SQL script
        await sequelize.query(sql);

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
