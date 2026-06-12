export interface UserContext {
  sub: string;
  userId: number;
  name: string;
  roles: string[];
  permissions: CaslRule[];
  sessionId: string;
}

export interface CaslRule {
  action: string;
  subject: string;
  inverted: boolean;
  conditions?: Record<string, any>;
}
