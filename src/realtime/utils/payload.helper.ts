import { RealtimeJob } from '../interfaces/realtime-job.interface';

export const getNotificationPayload = (job: RealtimeJob) => {
  const { event, payload, jobId } = job;
  const { data = {}, wsData, pushData = {}, ...notification } = payload;
  const pushFinal = { ...data, ...pushData, event };
  const wsPayload = { ...wsData, event, ...data, ...notification, jobId };

  return { notification, pushData: pushFinal, wsPayload };
};
