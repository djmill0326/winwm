export declare const array_iter: (input: any, offset?: number, reverse?: boolean) => () => any;
export declare const kv_iter: (input: any, offset?: number, reverse?: boolean) => () => any;
export declare const rev: (f: any) => (input: any, offset?: number) => any;
export declare const map: (next: any, f?: (x: any) => any) => () => any;
export declare const independent_filter: (next: any, condition?: () => boolean) => any;
export declare const filter: (next: any, condition?: (x: any) => boolean) => any;
export declare const collect: (next: any, extend?: () => never[]) => never[];
export declare const collect_map: (next: any, f?: (x: any) => any, extend?: () => never[]) => never[];
export declare const collect_filter: (next: any, condition?: (x: any) => boolean, extend?: () => never[]) => never[];
export declare const collect_filter_map: (next: any, f?: (x: any) => any, condition?: (x: any) => boolean, extend?: () => never[]) => never[];
export declare const reduce: (next: any, sauce?: (x: any, accumulator: any) => any, extend?: () => number) => number;
export declare const map_reduce: (next: any, f?: (x: any) => any, sauce?: (x: any, accumulator: any) => any, extend?: () => number) => number;
export declare const filter_reduce: (next: any, condition?: (x: any) => boolean, sauce?: (x: any, accumulator: any) => any, extend?: () => number) => number;
export declare const filter_map_reduce: (next: any, f?: (x: any) => any, condition?: (x: any) => boolean, sauce?: (x: any, accumulator: any) => any, extend?: () => number) => number;
export declare const lazy: (next: any, f?: (x: any) => any) => () => Promise<unknown>;
export declare const lazy_run: (lazy: any, on_next?: () => void, on_finish?: () => void, init?: () => {}) => Promise<unknown>;
export declare const lazy_collect: (lazy: any, accumulator?: (x: any, data: any) => any) => Promise<any>;