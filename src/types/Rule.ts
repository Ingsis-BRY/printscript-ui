export type Rule = {
    id: string,
    name: string,
    isActive: boolean,
    value?: string | number | null,
    type?: 'boolean' | 'integer' | 'enum',
    description?: string,
    default?: string | number | boolean | null,
    options?: string[] | null,
    min?: number | null,
    max?: number | null,
    since?: string,
}
