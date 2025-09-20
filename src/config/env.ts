import { config } from 'dotenv';

config();

export const env = {
  JWT_PRIVATE_KEY_PEM: process.env.JWT_PRIVATE_KEY_PEM,
  JWT_PUBLIC_KEY_PEM: process.env.JWT_PUBLIC_KEY_PEM,
  JWT_KEY_ID: process.env.JWT_KEY_ID || 'default-key-id',
  JWT_ISSUER: process.env.JWT_ISSUER || 'qr-manager',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/qr-manager',
  MONGODB_DATABASE: process.env.MONGODB_DATABASE || 'qr-manager',
  PORT: process.env.PORT || '3000',
  QR_MANAGER_URL: process.env.QR_MANAGER_URL || 'http://localhost:3000',
  TURNSTILE_SERVICE_URL: process.env.TURNSTILE_SERVICE_URL || 'http://localhost:3031',
};
