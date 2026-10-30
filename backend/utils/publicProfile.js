const PUBLIC_PROFILE_FIELDS = "_id username avatar bio interests";
function publicProfile(user) {
  return Object.fromEntries(PUBLIC_PROFILE_FIELDS.split(" ").map(field => [field, user[field]]));
}
module.exports = { PUBLIC_PROFILE_FIELDS, publicProfile };
