export interface StressTestConfig {
    duration: number; // in seconds
    rampUpSteps: number[];
    jobTypes: JobType[];
    concurrency: number;
    targetThroughput: number; // jobs per second
}

export interface JobType {
    name: string;
    weight: number; // percentage of total jobs
    priority: number;
    processingTime: number; // simulated processing time in ms
    payloadSize: number; // in bytes
}

export interface StressTestResult {
    testId: string;
    config: StressTestConfig;
    metrics: TestMetrics;
    startTime: Date;
    endTime: Date;
    status: 'running' | 'completed' | 'failed';
}

export interface TestMetrics {
    totalJobsSubmitted: number;
    totalJobsCompleted: number;
    totalJobsFailed: number;
    averageProcessingTime: number;
    peakThroughput: number;
    averageThroughput: number;
    queueDepthPeak: number;
    memoryUsagePeak: number;
    redisMetrics: RedisMetrics;
}

export interface RedisMetrics {
    memoryUsage: number;
    connectedClients: number;
    commandsPerSecond: number;
    keyspaceHits: number;
    keyspaceMisses: number;
}