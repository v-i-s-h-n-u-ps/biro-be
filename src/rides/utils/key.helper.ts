export const getRideCacheKey = (rideId: string) => `ride:${rideId}`;
export const getRideLocationCacheKey = (rideId: string) =>
  `ride:${rideId}:locations`;
export const getUserRidesCacheKey = (userId: string) => `user:${userId}:rides`;
