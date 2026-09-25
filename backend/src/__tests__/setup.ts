import { TEST_DATABASE_URL } from './globalSetup.js';

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = 'test-secret-key';
process.env.COOKIE_SECURE = 'false';