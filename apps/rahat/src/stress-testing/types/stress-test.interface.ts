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

// New interfaces for Open-Close Principle implementation
export interface IStressTestStrategy {
    execute(config: StressTestExecutionConfig): Promise<StressTestExecutionResult>;
    getName(): string;
    getDescription(): string;
    validateConfig(config: StressTestExecutionConfig): boolean;
}

export interface StressTestExecutionConfig {
    testType: StressTestType;
    parameters: Record<string, any>;
    metadata?: Record<string, any>;
}

export interface StressTestExecutionResult {
    success: boolean;
    message: string;
    data?: any;
    metrics?: Partial<TestMetrics>;
    errors?: string[];
}

export enum StressTestType {
    BENEFICIARY_IMPORT = 'beneficiary_import',
    VENDOR_MANAGEMENT = 'vendor_management',
    TRANSACTION_PROCESSING = 'transaction_processing',
    API_LOAD_TEST = 'api_load_test',
    DATABASE_STRESS = 'database_stress'
}

export interface BeneficiaryImportConfig {
    numberOfBeneficiaries: number;
    groupName?: string;
    batchSize?: number;
    enableValidation?: boolean;
    generateBankDetails?: boolean;
}

export interface BeneficiaryData {
    firstName: string;
    lastName: string;
    govtIDNumber: string;
    walletAddress: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    bankedStatus: 'BANKED' | 'UNBANKED' | 'UNDER_BANKED';
    phoneStatus: 'NO_PHONE' | 'FEATURE_PHONE' | 'SMART_PHONE';
    internetStatus: 'NO_INTERNET' | 'MOBILE_INTERNET' | 'HOME_INTERNET';
    email: string;
    phone: string;
    birthDate: string;
    location: string;
    latitude: number;
    longitude: number;
    notes: string;
    extras: Record<string, any>;
}