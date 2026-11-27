// rahat-platform/apps/rahat/src/notification/audience.mapper.ts
import { AudienceType, Prisma } from '@prisma/client';
import type { NotificationAudience, NotificationAudienceSelector } from '@rahataid/sdk';

type AudienceRowInput = Prisma.NotificationAudienceCreateWithoutNotificationInput;

/** payload.audience -> tbl_notifications_audience rows (includes first, then excludes). */
export function toAudienceRows(audience?: NotificationAudience): AudienceRowInput[] {
    const rows: AudienceRowInput[] = [];
    if (!audience) return rows;

    const add = (selector: NotificationAudienceSelector | undefined, exclude: boolean) => {
        if (!selector) return;
        selector.userIds?.forEach((value) => rows.push({ type: AudienceType.USER, value, exclude }));
        selector.roles?.forEach((value) => rows.push({ type: AudienceType.ROLE, value, exclude }));
        selector.permissions?.forEach((p) =>
            rows.push({
                type: AudienceType.PERMISSION,
                value: { action: p.action, subject: p.subject },
                exclude,
            })
        );
        if (selector.projectMembers) rows.push({ type: AudienceType.PROJECT_MEMBERS, exclude });
        if (selector.all) rows.push({ type: AudienceType.ALL, exclude });
    };

    add(audience, false);
    add(audience.exclude, true);
    return rows;
}