export interface DeviceRegistration {
  userId: string;
  deviceToken: string;
  platform: 'ios' | 'android';
}
