const mongoose = require('mongoose');
const seedPermissions = require('../api/components/authentication/permissions/permissionSeederService');
const seedRoles = require('../api/components/authentication/roles/roleSeederService');
const connectDB = require('../db/connect');

const runSeeders = async () => {
  try {
    await connectDB();
    await seedPermissions();
    await seedRoles();  
    console.log('All seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};
runSeeders();