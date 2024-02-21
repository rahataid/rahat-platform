export type Response<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, any>;
};

export type TStats = {
  name: string;
  data: any;
};
