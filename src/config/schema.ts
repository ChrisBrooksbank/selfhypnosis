/**
 * Configuration Schema
 * Define and validate app configuration with Zod
 */

import { z } from 'zod';

export const ConfigSchema = z.object({
    debug: z.boolean().default(false),
    app: z
        .object({
            defaultSessionDuration: z.number().positive().default(20),
            maxSessionDuration: z.number().positive().default(60),
        })
        .default({}),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export class ConfigValidationError extends Error {
    constructor(
        message: string,
        public errors: z.ZodError
    ) {
        super(message);
        this.name = 'ConfigValidationError';
    }
}
