declare module 'apiUtils' {
    export function getApiUrl(endpoint: string): string;
    export function getHeaders(includeAuth?: boolean): Record<string, string>;
    export function handleApiError(error: any): string;
} 