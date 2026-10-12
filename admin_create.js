const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

(async () => {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const name = String(process.env.ADMIN_NAME || 'Tripwise Administrator').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Set ADMIN_EMAIL to a valid email before creating the admin.'); process.exit(1);
  }
  if (password.length < 12) {
    console.error('Set ADMIN_PASSWORD to a strong password with at least 12 characters.'); process.exit(1);
  }
  const dir = path.join(__dirname, 'data');
  const file = path.join(dir, 'db.json');
  fs.mkdirSync(dir, { recursive: true });
  let db = { users: [], trips: [], expenses: [], bookings: [], customDestinations: [], destinationOverrides: {}, disabledDestinationIds: [], advisories: [], auditLogs: [] };
  if (fs.existsSync(file)) {
    try { db = { ...db, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; }
    catch (e) { console.error('Could not read data/db.json:', e.message); process.exit(1); }
  }
  db.users ||= [];
  const existing = db.users.find(u => String(u.email).toLowerCase() === email);
  if (existing) {
    existing.role = 'admin'; existing.active = true;
    if (!existing.passwordHash) existing.passwordHash = await bcrypt.hash(password, 12);
    else if (process.env.ADMIN_RESET_PASSWORD === 'true') existing.passwordHash = await bcrypt.hash(password, 12);
    existing.name = name || existing.name;
    console.log(`Promoted ${email} to admin. Password ${process.env.ADMIN_RESET_PASSWORD === 'true' ? 'was reset' : 'was left unchanged'}. Set ADMIN_RESET_PASSWORD=true if you need to reset it.`);
  } else {
    db.users.push({ id: crypto.randomUUID(), name, email, passwordHash: await bcrypt.hash(password, 12), role: 'admin', active: true, createdAt: new Date().toISOString() });
    console.log(`Created admin account: ${email}`);
  }
  const tmp = file + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(db, null, 2)); fs.renameSync(tmp, file);
  console.log('You can now sign in through the normal Tripwise login page. Keep ADMIN_PASSWORD private.');
})();
