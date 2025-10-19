#!/usr/bin/env node

/**
 * Create Admin User for Production
 * 
 * Usage:
 *   node create-admin-production.js
 * 
 * The script will prompt for username and password
 */

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function questionHidden(query) {
  return new Promise(resolve => {
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    
    process.stdout.write(query);
    let password = '';
    
    stdin.on('data', function onData(char) {
      char = char.toString('utf8');
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // backspace
          password = password.slice(0, -1);
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(query + '*'.repeat(password.length));
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function createAdmin() {
  try {
    console.log('='.repeat(70));
    console.log('  CREATE ADMIN USER FOR PRODUCTION');
    console.log('='.repeat(70));
    console.log('');
    
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('❌ ERROR: DATABASE_URL environment variable not set');
      console.error('');
      console.error('Make sure your .env file is loaded or set DATABASE_URL directly:');
      console.error('export DATABASE_URL="postgresql://user:pass@host:5432/dbname"');
      process.exit(1);
    }
    
    // Get credentials
    const username = await question('Enter admin username (default: admin): ') || 'admin';
    const password = await questionHidden('Enter admin password: ');
    
    if (!password) {
      console.error('\n❌ ERROR: Password cannot be empty');
      process.exit(1);
    }
    
    const confirmPassword = await questionHidden('Confirm admin password: ');
    
    if (password !== confirmPassword) {
      console.error('\n❌ ERROR: Passwords do not match');
      process.exit(1);
    }
    
    console.log('');
    console.log('Creating admin user...');
    
    // Hash password using scrypt (same as auth.ts but compatible format)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const passwordHash = `${hash}.${salt}`;
    
    // Connect to database
    const { URL } = require('url');
    const url = new URL(process.env.DATABASE_URL);
    
    const dbConfig = {
      host: url.hostname,
      port: url.port || 5432,
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      ssl: {
        rejectUnauthorized: false
      }
    };
    
    // Use pg module
    let pg;
    try {
      pg = require('pg');
    } catch (err) {
      console.log('Installing pg module...');
      const { execSync } = require('child_process');
      execSync('npm install --no-save pg', { stdio: 'inherit' });
      pg = require('pg');
    }
    
    const { Client } = pg;
    const client = new Client(dbConfig);
    
    await client.connect();
    console.log('✓ Connected to database');
    
    // Check if admin user exists
    const checkResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`⚠ Admin user "${username}" already exists, updating password...`);
      await client.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [passwordHash, username]
      );
      console.log('✓ Password updated successfully');
    } else {
      console.log(`Creating new admin user "${username}"...`);
      await client.query(
        'INSERT INTO users (username, password) VALUES ($1, $2)',
        [username, passwordHash]
      );
      console.log('✓ Admin user created successfully');
    }
    
    await client.end();
    
    console.log('');
    console.log('='.repeat(70));
    console.log('✅ SUCCESS!');
    console.log('='.repeat(70));
    console.log('');
    console.log('Login credentials:');
    console.log(`  Username: ${username}`);
    console.log(`  Password: [hidden for security]`);
    console.log('');
    console.log('Access the admin panel at: https://your-domain.com/admin');
    console.log('');
    console.log('⚠️  IMPORTANT: Save these credentials in a secure location!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();
