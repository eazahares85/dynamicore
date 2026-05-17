require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://dynamicore:dynamicore@localhost:5432/dynamicore_payments',
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8000',
  apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || '3000'}`,
};

module.exports = config;
