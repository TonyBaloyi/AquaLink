const db = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const supabaseAuth = require('../../services/supabase-auth.service');

const FIELDS = 'id, name, email, phone, role, status, last_login_at, created_at';

async function list({ role, search, status, limit, offset }) {
  const where = [];
  const params = [];
  if (role)   { params.push(role);   where.push(`role = $${params.length}`); }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { count } = await db.one(`SELECT COUNT(*)::int AS count FROM users ${clause}`, params);
  params.push(limit, offset);
  const rows = await db.many(
    `SELECT ${FIELDS} FROM users ${clause} ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { rows, count };
}

async function get(id) {
  const user = await db.one(`SELECT ${FIELDS} FROM users WHERE id = $1`, [id]);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function create(input) {
  const exists = await db.one('SELECT id FROM users WHERE email = $1', [input.email]);
  if (exists) throw ApiError.conflict('An account with that email already exists');

  const authUser = await supabaseAuth.createUser({
    email: input.email,
    password: input.password,
    name: input.name,
    phone: input.phone,
    role: input.role,
    emailConfirm: true,
  });

  try {
    return await db.one(
      `INSERT INTO users (id, name, email, phone, role, status)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6,'active')) RETURNING ${FIELDS}`,
      [authUser.id, input.name, input.email, input.phone || null, input.role, input.status]
    );
  } catch (err) {
    try { await supabaseAuth.deleteUser(authUser.id); } catch (cleanupError) {
      console.error('[users] failed to clean up Supabase user:', cleanupError.message);
    }
    throw err;
  }
}

async function update(id, input) {
  const user = await get(id);
  const merged = { ...user, ...input };
  const emailChanged = merged.email !== user.email;

  if (emailChanged) {
    await supabaseAuth.updateUser(id, { email: merged.email, email_confirm: true });
  }

  try {
    return await db.one(
      `UPDATE users SET name=$1, email=$2, phone=$3, role=$4, status=$5 WHERE id=$6
       RETURNING ${FIELDS}`,
      [merged.name, merged.email, merged.phone, merged.role, merged.status, id]
    );
  } catch (err) {
    if (emailChanged) {
      try { await supabaseAuth.updateUser(id, { email: user.email, email_confirm: true }); } catch (_) {}
    }
    throw err;
  }
}

async function setStatus(id, status) {
  const user = await get(id);
  const result = await db.one(`UPDATE users SET status=$1 WHERE id=$2 RETURNING ${FIELDS}`, [status, id]);
  if (status === 'suspended') {
    await supabaseAuth.updateUser(id, { ban_duration: '876000h' });
  } else if (user.status === 'suspended') {
    await supabaseAuth.updateUser(id, { ban_duration: 'none' });
  }
  return result;
}

async function remove(id) {
  await get(id);
  await supabaseAuth.deleteUser(id);
  await db.query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = { list, get, create, update, setStatus, remove };
