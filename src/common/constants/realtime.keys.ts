export const RealtimeKeys = {
  // hash deviceId -> socketIds
  deviceSockets: (deviceId: string) => `presence:device:${deviceId}:sockets`,
  // set of deviceIds
  userDevices: (userId: string) => `presence:user:${userId}:devices`,
  roomDevices: (roomId: string) => `presence:room:${roomId}:devices`,
  // hash jobId -> enqueuedAt
  devicePendingHash: (userId: string, deviceId: string) =>
    `presence:user:${userId}:device:${deviceId}:pending`,
  roomPendingHash: (roomId: string) => `presence:room:${roomId}:pending`,
  roomDevicesPendingHash: (roomId: string, deviceId: string) =>
    `presence:room:${roomId}:device:${deviceId}:pending`,
  // zset of score = expiryTs, value = "{userId}:{deviceId}:{jobId}"
  pendingExpiryZset: () => `presence:pending:expiry`,
  jobRoomDevicesZset: (jobId: string, roomId: string) =>
    `realtime:job:${jobId}:room:${roomId}:devices`,
  jobKey: (jobId: string) => `realtime:job:${jobId}`,
  dedupKey: (jobId: string, targetId: string) =>
    `realtime:dedup:${jobId}:${targetId}`,
  mutedNotifications: (userId: string) => `user:${userId}:muted_notifications`,
  // optional mapping key if needed
  pendingMapping: (jobId: string) => `realtime:pending:devices:${jobId}`,
  pendingJobValue: (userId: string, deviceId: string, jobId: string) =>
    `${userId}|${deviceId}|${jobId}`,
  deviceKey: (userId: string, deviceId: string) => `${userId}:${deviceId}`,
};
