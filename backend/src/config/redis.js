import Redis from 'ioredis';

const url = process.env.REDIS_URL;

if (!url) {
  throw new Error('REDIS_URL is not defined in the environment');
}

export const redis = new Redis(url);

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});
