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
  jobDevicesMapping: (jobId: string) => `realtime:job:${jobId}:devices`,
  // optional mapping key if needed
  pendingMapping: (jobId: string) => `realtime:pending:devices:${jobId}`,
  pendingJobValue: (userId: string, deviceId: string, jobId: string) =>
    `${userId}|${deviceId}|${jobId}`,
  deviceKey: (userId: string, deviceId: string) => `${userId}:${deviceId}`,
  deviceActiveRoom: (userId: string, deviceId: string) =>
    `presence:user:${userId}:device:${deviceId}:active_room`,
};
