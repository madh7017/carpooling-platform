const clientsByUser = new Map();

const addClient = (userId, res) => {
  if (!clientsByUser.has(userId)) {
    clientsByUser.set(userId, new Set());
  }
  clientsByUser.get(userId).add(res);
};

const removeClient = (userId, res) => {
  const set = clientsByUser.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clientsByUser.delete(userId);
};

const sendToUser = (userId, event, data) => {
  const set = clientsByUser.get(userId);
  if (!set) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    res.write(payload);
  }
};

const sendToUsers = (userIds, event, data) => {
  userIds.forEach((userId) => sendToUser(userId, event, data));
};

module.exports = {
  addClient,
  removeClient,
  sendToUser,
  sendToUsers,
};
