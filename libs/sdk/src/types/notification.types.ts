// rahat-platform/libs/sdk/src/types/notification.types.ts
import { NotificationChannel } from '../enums';

export type NotificationPermission = {
    action: string;
    subject: string;
};

export type NotificationAudienceSelector = {
    permissions?: NotificationPermission[];
    roles?: string[];
    userIds?: string[];
    projectMembers?: boolean;
    all?: boolean;
};

export type NotificationAudience = NotificationAudienceSelector & {
    exclude?: NotificationAudienceSelector;
};

export type NotificationPayload = {
    projectId?: string;
    title: string;
    description: string;
    group: string;
    audience: NotificationAudience;
    channels: NotificationChannel[];
};