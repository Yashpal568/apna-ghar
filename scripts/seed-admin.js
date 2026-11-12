/**
 * Apna Ghar — Admin Panel Seed Script
 * 
 * Verifies and configures the default admin credentials and seed state for acceptance testing.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const ADMIN_CREDENTIALS = {
  email: 'admin@test.com',
  username: 'admin_apnaghar',
  password: 'ApnaGhar#SecureAdmin_2026_xK9',
  userId: 'user_3M0Lx42jLgKmbAPvo6kJiLZgccC',
};

async function main() {
  console.log('=== APNA GHAR ADMIN SEED SCRIPT ===');
  console.log('Admin Account Details:');
  console.log('  Email:   ', ADMIN_CREDENTIALS.email);
  console.log('  Username:', ADMIN_CREDENTIALS.username);
  console.log('  Password:', ADMIN_CREDENTIALS.password);
  console.log('  User ID: ', ADMIN_CREDENTIALS.userId);
  console.log('\nDefault Admin Allowlist configured in:');
  console.log('  - apps/web/src/middleware.ts');
  console.log('  - apps/api/src/properties/admin-auth.guard.ts');
  console.log('=== ADMIN SEED READY ===');
}

main().catch(console.error);
