import z from "zod";

const EnvSchema = z.object({
    AUTH0_ISSUER_BASE_URL: z.string().optional(),
    AUTH0_CLIENT_ID: z.string().optional(),
    AUTH0_CLIENT_SECRET: z.string().optional(),
    AUTH0_SECRET: z.string().default("eaf87241f9b23f847bd8f981d00f94a7f803ff7c3d76650e21650ff9125c8a2f"),
    AUTH0_BASE_URL: z.url().default("http://localhost:3000"),
    // OPENAI_API_KEY: z.string().optional(),
    GOOGLE_AI_API_KEY: z.string().optional(),
    // OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    DRAFT_GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
    FINAL_GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
    // MISTRAL_MODEL: z.string().default("ministral-3b-2512"),
    DATABASE_URL: z.string().optional(),
    TAVILY_API_KEY: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),

});

export const env = EnvSchema.parse(process.env);