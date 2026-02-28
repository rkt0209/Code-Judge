const Queue = require('bull');
const path = require('path');

// Connect to Redis (Use standard port 6379)
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
};

if (process.env.REDIS_PASSWORD) {
    redisConfig.password = process.env.REDIS_PASSWORD;
}

// Create the Queue named "job-queue"
const jobQueue = new Queue('job-queue', {
    redis: redisConfig
});

// Create the Retry Queue
const retryQueue = new Queue('retry-submissions', {
    redis: redisConfig
});

const addJobToQueue = async (jobId) => {
    await jobQueue.add({
        id: jobId
    });
    console.log(`Job ${jobId} added to queue`);
};

const addJobToRetryQueue = async (jobData, options = {}) => {
    await retryQueue.add(jobData, options);
    console.log(`Retry job for submission ${jobData.submission_id} added to retry queue (Attempt ${jobData.retry_count})`);
};

module.exports = { 
    addJobToQueue, 
    jobQueue, 
    addJobToRetryQueue, 
    retryQueue 
};