require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_legalconnect_2024_min_32_chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_legalconnect_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  sslcommerz: {
    storeId: process.env.SSLCOMMERZ_STORE_ID || 'test_store_id',
    storePass: process.env.SSLCOMMERZ_STORE_PASSWD || 'test_store_password',
    isLive: process.env.SSLCOMMERZ_IS_LIVE === 'true',
    successUrl: process.env.SSLCOMMERZ_SUCCESS_URL || 'http://localhost:5000/api/payments/success',
    failUrl: process.env.SSLCOMMERZ_FAIL_URL || 'http://localhost:5000/api/payments/fail',
    cancelUrl: process.env.SSLCOMMERZ_CANCEL_URL || 'http://localhost:5000/api/payments/cancel',
    ipnUrl: process.env.SSLCOMMERZ_IPN_URL || 'http://localhost:5000/api/payments/ipn',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@legalconnect.com',
    fromName: process.env.EMAIL_FROM_NAME || 'LegalConnect',
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    maxSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@legalconnect.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@LegalConnect2024!',
  }
};
