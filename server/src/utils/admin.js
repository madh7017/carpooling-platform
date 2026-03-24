const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isAdminEmail = (email = "") => getAdminEmails().includes(String(email).trim().toLowerCase());

const isAdminUser = (user) => Boolean(user?.isAdmin || isAdminEmail(user?.email));

module.exports = {
  getAdminEmails,
  isAdminEmail,
  isAdminUser,
};
