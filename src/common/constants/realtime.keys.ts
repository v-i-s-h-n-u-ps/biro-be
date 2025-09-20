export const RealtimeKeys = {
  userDevices: (userId: string) => `presence:user:${userId}:devices`, // hash deviceId -> socketId
  devicePendingHash: (userId: string, deviceId: string) =>
    `presence:user:${userId}:device:${deviceId}:pending`, // hash jobId -> enqueuedAt
  pendingExpiryZset: () => `presence:pending:expiry`, // zset of score = expiryTs, value = "{userId}:{deviceId}:{jobId}"
  jobKey: (jobId: string) => `realtime:job:${jobId}`,
  dedupKey: (jobId: string, deviceId: string) =>
    `realtime:dedup:${jobId}:${deviceId}`,
  mutedNotifications: (userId: string) => `user:${userId}:muted_notifications`,
  pendingMapping: (jobId: string) => `realtime:pending:devices:${jobId}`, // optional mapping key if needed
};
