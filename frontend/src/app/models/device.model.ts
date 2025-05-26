export interface Device {
  id: string;
  name: string;
  serial: string;
  pin: string;
  phone: number;
  accounts: string[];
  isConnected?: boolean;
}
