export const RealtimeKeys = {
  // hash deviceId -> socketIds
  deviceSockets: (deviceId: string) => `presence:device:${deviceId}:sockets`,
  // set of deviceIds
  userDevices: (userId: string) => `presence:user:${userId}:devices`,
  // hash jobId -> enqueuedAt
  devicePendingHash: (userId: string, deviceId: string) =>
    `presence:user:${userId}:device:${deviceId}:pending`,
  // zset of score = expiryTs, value = "{userId}:{deviceId}:{jobId}"
  pendingExpiryZset: () => `presence:pending:expiry`,
  jobKey: (jobId: string) => `realtime:job:${jobId}`,
  dedupKey: (jobId: string, deviceId: string) =>
    `realtime:dedup:${jobId}:${deviceId}`,
  mutedNotifications: (userId: string) => `user:${userId}:muted_notifications`,
  // optional mapping key if needed
  pendingMapping: (jobId: string) => `realtime:pending:devices:${jobId}`,
};
