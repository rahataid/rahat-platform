import { CurrentUserInterface } from '@rumsan/user';

export type NotificationUserContext = Partial<
  Pick<CurrentUserInterface, 'id' | 'uuid'>
>;
