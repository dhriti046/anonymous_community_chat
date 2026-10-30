export function publicProfile(user) {
  const { _id, username, avatar, bio, interests } = user;
  return { _id, username, avatar, bio, interests };
}
export function cleanStoredProfile(storage) {
  try {
    const stored = storage.getItem("user");
    if (stored) storage.setItem("user", JSON.stringify(publicProfile(JSON.parse(stored))));
  } catch {
    storage.removeItem("user");
  }
}
