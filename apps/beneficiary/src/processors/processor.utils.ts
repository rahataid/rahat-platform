// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { SsePublisherService } from "@rahataid/sse";
import Redis from "ioredis";

export const SYNC_TRACKING_REDIS = 'SYNC_TRACKING_REDIS';

export type GroupValidationBatch = {
    groupUuid: string;
    batchId: string;
    total: number;
};

const GROUP_VALIDATION_TRACKING_TTL_SECONDS = 60 * 60;

export const publishGroupValidationEvent = async (
    redis: Redis,
    ssePublisher: SsePublisherService,
    jobId: string | number,
    batch: GroupValidationBatch | undefined,
    logger: Logger
) => {
    if (!batch || batch.total < 1) return;

    try {
        const key = `beneficiary:group-validation:${batch.batchId}`;
        const completed = await redis.eval(
            `
                redis.call('SADD', KEYS[1], ARGV[1])
                redis.call('EXPIRE', KEYS[1], ARGV[3])
                if redis.call('SCARD', KEYS[1]) < tonumber(ARGV[2]) then
                    return 0
                end
                return redis.call('SET', KEYS[2], '1', 'EX', ARGV[3], 'NX') and 1 or 0
            `,
            2,
            `${key}:jobs`,
            `${key}:completed`,
            String(jobId),
            String(batch.total),
            String(GROUP_VALIDATION_TRACKING_TTL_SECONDS)
        );

        if (Number(completed) === 1) {
            await ssePublisher.publishEvent('beneficiary.group.event', {
                uuid: batch.groupUuid,
            });
        }
    } catch (error) {
        const details = error instanceof Error ? error.stack : String(error);
        logger.error(
            `Failed to track completion for beneficiary group validation ${batch.batchId}`,
            details
        );
    }
};

export const findTempBenefGroups = async (prisma: PrismaClient, groupUUID: string) => {
    return await prisma.tempBeneficiaryGroup.findMany({
        where: {
            tempGroupUID: groupUUID
        },
        include: {
            tempBeneficiary: true
        }
    });
}

export const validateDupicatePhone = async (prisma: PrismaClient, beneficiaries: any[]) => {
    const existing = await prisma.beneficiaryPii.findMany({
        select: { beneficiaryId: true, phone: true }
    });
    const combined_benef = [...existing, ...beneficiaries];
    return checkDuplicatePhones(combined_benef);
}

export const validateDupicateWallet = async (prisma: PrismaClient, beneficiaries: any[]) => {
    const existing = await prisma.beneficiary.findMany({
        select: { id: true, walletAddress: true }
    });
    const combined_benef = [...existing, ...beneficiaries];
    return checkDuplicateWallet(combined_benef);
}



function checkDuplicatePhones(arr: any[]) {
    const duplicates = [];
    const phoneSet = new Set();

    for (const obj of arr) {
        if (phoneSet.has(obj.phone)) {
            duplicates.push(obj.phone);
        }
        phoneSet.add(obj.phone);
    }

    return duplicates;
}

function checkDuplicateWallet(arr: any[]) {
    const duplicates = [];
    const walletSet = new Set();

    for (const obj of arr) {
        if (walletSet.has(obj.walletAddress)) {
            duplicates.push(obj.walletAddress);
        }
        walletSet.add(obj.walletAddress);
    }

    return duplicates;
}