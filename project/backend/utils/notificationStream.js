const clients = new Map(); // hospitalId -> Set(res)

function addClient(hospitalId, res) {
  if (!clients.has(hospitalId)) clients.set(hospitalId, new Set());
  clients.get(hospitalId).add(res);
  res.on('close', () => removeClient(hospitalId, res));
}

function removeClient(hospitalId, res) {
  const set = clients.get(hospitalId);
  if (set) {
    set.delete(res);
    if (set.size === 0) clients.delete(hospitalId);
  }
}

function broadcastNotification(notification) {
  const hospitalId = notification.hospitalId?.toString();
  if (!hospitalId) {
    // Global broadcast (no hospitalId)
    const payload = `data: ${JSON.stringify({ type: 'notification', notification })}\n\n`;
    for (const [, set] of clients.entries()) {
      for (const res of set) res.write(payload);
    }
    return;
  }
  const set = clients.get(hospitalId);
  if (!set) return;
  const payload = `data: ${JSON.stringify({ type: 'notification', notification })}\n\n`;
  for (const res of set) {
    res.write(payload);
  }
}

module.exports = { addClient, removeClient, broadcastNotification };
