import { query } from '../server/lib/db.mjs';

async function fixUserNames() {
  const usersRes = await query('SELECT id, full_name, email, role, onboarding_draft FROM users');
  for (const user of usersRes.rows) {
    let draft = user.onboarding_draft;
    if (typeof draft === 'string') {
      try { draft = JSON.parse(draft); } catch { draft = {}; }
    }
    draft = draft || {};

    let currentName = user.full_name || '';

    // Only touch users whose name contains ACEMS or is empty
    if (!currentName || currentName.toLowerCase().includes('acems') || currentName === 'User') {
      let newName = null;
      if (draft.workspace && draft.workspace.name) {
        newName = draft.workspace.name.trim();
      } else if (draft.handle) {
        newName = draft.handle.trim();
      } else if (draft.verifiedMeta && draft.verifiedMeta.handle) {
        newName = draft.verifiedMeta.handle.trim();
      } else if (user.email && !user.email.includes('acems.local') && !user.email.includes('crevio.local') && !user.email.includes('clerk-')) {
        const parts = user.email.split('@')[0].replace(/[._\d]+/g, ' ').trim();
        if (parts.length > 1) {
          newName = parts.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        }
      }

      if (!newName || newName.toLowerCase().includes('acems')) {
        newName = user.role === 'brand' ? 'Crevio Brand' : user.role === 'creator' ? 'Crevio Creator' : 'Crevio User';
      }

      let newEmail = user.email;
      if (newEmail && newEmail.includes('@acems.local')) {
        newEmail = newEmail.replace('@acems.local', '@crevio.local');
      }

      console.log(`Updating user ${user.id}: "${user.full_name}" -> "${newName}", email: "${user.email}" -> "${newEmail}"`);
      await query('UPDATE users SET full_name = $1, email = $2 WHERE id = $3', [newName, newEmail, user.id]);
    } else {
      // Fix b1, b2, a1 if needed
      if (user.id === 'b1') await query('UPDATE users SET full_name = $1 WHERE id = $2', ['Nike Digital', 'b1']);
      if (user.id === 'b2') await query('UPDATE users SET full_name = $1 WHERE id = $2', ['Spotify Ads', 'b2']);
      if (user.id === 'a1') await query('UPDATE users SET full_name = $1, email = $2 WHERE id = $3', ['System Admin', 'admin@crevio.io', 'a1']);
    }
  }
  console.log('✅ User database cleanup complete!');
  process.exit(0);
}

fixUserNames().catch((err) => {
  console.error('Error fixing user names:', err);
  process.exit(1);
});
