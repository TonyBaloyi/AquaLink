const { client, adminClient } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

async function createUser({ email, password, name, phone, role, emailConfirm = true }) {
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: emailConfirm,
    user_metadata: { name, phone: phone || null, role },
  });
  if (error) {
    if (/already registered|already exists|duplicate/i.test(error.message || '')) {
      throw ApiError.conflict('An account with that email already exists');
    }
    throw ApiError.badRequest(error.message);
  }
  return data.user;
}

async function findUserByEmail(email) {
  const { data, error } = await adminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function signIn(email, password) {
  const { data, error } = await client().auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  return data;
}

async function refresh(refreshToken) {
  const { data, error } = await client().auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session || !data.user) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
  return data;
}

async function getUser(accessToken) {
  const { data, error } = await client().auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

async function updateUser(userId, attributes) {
  const { data, error } = await adminClient().auth.admin.updateUserById(userId, attributes);
  if (error) throw ApiError.badRequest(error.message);
  return data.user;
}

async function signOut(accessToken) {
  const { error } = await adminClient().auth.admin.signOut(accessToken, 'local');
  if (error) throw ApiError.badRequest(error.message);
}

async function updatePassword(userId, password) {
  const { error } = await adminClient().auth.admin.updateUserById(userId, { password });
  if (error) throw ApiError.badRequest(error.message);
}

async function deleteUser(userId) {
  const { error } = await adminClient().auth.admin.deleteUser(userId);
  if (error) throw error;
}

async function resetEmail(email, redirectTo) {
  const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw ApiError.badRequest(error.message);
}

module.exports = {
  createUser,
  findUserByEmail,
  deleteUser,
  signIn,
  refresh,
  getUser,
  updateUser,
  signOut,
  updatePassword,
  resetEmail,
};
