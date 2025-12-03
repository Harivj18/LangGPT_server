const redis = require('ioredis');
module.exports = {
    redisInfo : () => {
        try {
            return {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                db: process.env.REDIS_DB,
                password: process.env.REDIS_PWD
            }
        } catch (error) {
            console.error('RedisConnection.js : redisInfo => Issue on redis config info',error);
            return error
        }
    },

    connectRedisCache: () => {
        try {
            const redisConnection = new redis({
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                db: process.env.REDIS_DB,
                password: process.env.REDIS_PWD
            })
            return redisConnection
        } catch (error) {
            console.error('RedisConnection.js : redisInfo => Issue on redis config info',error);
            return error
        }
    }
}