const redis = require('ioredis');

const setCache = () => {
    return new Promise((resolve, reject) => {
        try {
            
        } catch (error) {
            console.error('RedisService.js : setCache => Unable to create cache in redis server',error);
            reject(error)
        }
    })
}

const getCache = () => {
    return new Promise((resolve, reject) => {
        try {
            
        } catch (error) {
            console.error('RedisService.js : getCache => Unable to retrieve cache in redis server',error);
            reject(error)
        }
    })
}

const delCache = () => {
    return new Promise((resolve, reject) => {
        try {
            
        } catch (error) {
            console.error('RedisService.js : delCache => Unable to delete cache from redis server',error);
            reject(error)
        }
    })
}

const checkCache = () => {
    return new Promise((resolve, reject) => {
        try {
            
        } catch (error) {
            console.error('RedisService.js : checkCache => Unable to verify cache on redis server',error);
            reject(error)
        }
    })
}

const LpushCache = () => {
    return new Promise((resolve, reject) => {
        try {
            
        } catch (error) {
            console.error('RedisService.js : LpushCache => Unable to push cache info into redis server',error);
            reject(error)
        }
    })
}

const LpopCache = () => {
    return new Promise((resolve, reject) => {
        try {
            
        } catch (error) {
            console.error('RedisService.js : LpopCache => Issue while removing history from redis server',error);
            reject(error)
        }
    })
}

const persistCache = () => {
    return new Promise((resolve, reject) => {
        try {
            
        } catch (error) {
            console.error('RedisService.js : persistCache => Something wrong while persist cache on redis server',error);
            reject(error)
        }
    })
}