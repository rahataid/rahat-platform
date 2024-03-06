export type Response<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, any>;
};

export type Stats = {
  name: string;
  data: any;
};
