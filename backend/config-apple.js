// Apple-inspired configuration for VPS deployment
require('dotenv').config();

const config = {
  port: process.env.PORT || 4004,
  jwtSecret: process.env.JWT_SECRET || 'u+CQbmm/4Mjt4uATsSLhzAB0+q1UxH8wLhtrdeD4hnLn0fy5VPMUTzGUdma10Ff9tH3rN3N7Ms8j6luguJKu6Q==',
  dbUrl: process.env.PGHOST ? 
    `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}` : 
    'postgresql://localhost/tradebuddy',
  nodeEnv: process.env.NODE_ENV || 'production',
  corsOrigin: process.env.CORS_ORIGIN || 'https://www.mytradebuddy.ru'
};

module.exports = config;
