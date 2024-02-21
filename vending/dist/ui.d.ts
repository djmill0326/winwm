export declare const evil_counter: {
    display_name: string;
    get: (inc?: number) => number;
};
export declare const mk_context: (root: HTMLElement, display_name?: string) => {
    display_name: string;
    root: HTMLElement;
    children?: Set<HTMLElement> | undefined;
    event_proxy?: {
        event_handlers: Map<HTMLElement, Map<string, (ev: Event, context: ReturnType<typeof mk_context>) => boolean>>;
        proxy_pass: (el: HTMLElement, event_name: string, ev: Event) => any;
        set_event_listener: (el: HTMLElement, event_name: string, f: (ev: Event, context?: ReturnType<typeof mk_context>) => boolean) => any;
    } | undefined;
};
export declare const mk_append: (context: ReturnType<typeof mk_context>) => (el: HTMLElement) => void;
export declare const mk_program: (context: ReturnType<typeof mk_context>) => {
    context: {
        display_name: string;
        root: HTMLElement;
        children?: Set<HTMLElement> | undefined;
        event_proxy?: {
            event_handlers: Map<HTMLElement, Map<string, (ev: Event, context: ReturnType<typeof mk_context>) => boolean>>;
            proxy_pass: (el: HTMLElement, event_name: string, ev: Event) => any;
            set_event_listener: (el: HTMLElement, event_name: string, f: (ev: Event, context?: ReturnType<typeof mk_context>) => boolean) => any;
        } | undefined;
    };
    append: (el: HTMLElement) => void;
};
declare const _default: (name: string) => {
    context: {
        display_name: string;
        root: HTMLElement;
        children?: Set<HTMLElement> | undefined;
        event_proxy?: {
            event_handlers: Map<HTMLElement, Map<string, (ev: Event, context: any) => boolean>>;
            proxy_pass: (el: HTMLElement, event_name: string, ev: Event) => any;
            set_event_listener: (el: HTMLElement, event_name: string, f: (ev: Event, context?: any | undefined) => boolean) => any;
        } | undefined;
    };
    append: (el: HTMLElement) => void;
};
export default _default;
