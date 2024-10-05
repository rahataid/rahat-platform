export type OfframpProvider<T> = {

    name: string;
    config: T;
    description?: string;
    extras?: any;

}