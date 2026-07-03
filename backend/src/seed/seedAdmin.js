import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed');
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted existing user ${email} to admin`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ email: email.toLowerCase(), passwordHash, role: 'admin' });
  console.log(`Seeded admin account for ${email}`);
}
