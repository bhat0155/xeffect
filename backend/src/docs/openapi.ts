// src/docs/openapi.ts
import type { OpenAPIV3 } from "openapi-types";

export const openapiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "XEffect API",
    version: "1.0.0",
    description: "Backend API for XEffect (habits + streak engine + auth).",
  },
  servers: [{ url: "http://localhost:4000" }],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "xeffect_token",
        description: "JWT stored in httpOnly cookie (set by Google OAuth callback).",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "Habit name should be between 1 and 60 characters" },
        },
      },

      HabitBox: {
        type: "object",
        required: ["day", "status", "canEdit"],
        properties: {
          day: { type: "integer", minimum: 1, maximum: 21, example: 1 },
          status: { type: "boolean", example: false },
          canEdit: { type: "boolean", example: true },
        },
      },

      HabitMeta: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "string", example: "4975a8ce-0d66-4026-a56f-c8b16c86122f" },
          name: { type: "string", example: "No Sugar" },
          bestStreak: { type: "integer", example: 7 },
          allDone: { type: "boolean", example: false },
          isPublic: { type: "boolean", example: true },
          publicSlug: { type: "string", nullable: true, example: "ekam-xeffect" },
        },
      },

      AIMessage: {
        type: "object",
        required: ["milestoneDay", "message"],
        properties: {
          milestoneDay: { type: "integer", enum: [1, 3, 7, 14, 21], example: 7 },
          message: { type: "string", example: "Day 7! You're building real momentum—keep showing up." },
        },
      },

      HabitState: {
        type: "object",
        required: ["habit", "todayUTC", "checkedInToday", "currentStreak", "boxes"],
        properties: {
          habit: { $ref: "#/components/schemas/HabitMeta" },
          todayUTC: { type: "string", example: "2026-01-15" },
          checkedInToday: { type: "boolean", example: false },
          currentStreak: { type: "integer", minimum: 0, maximum: 21, example: 5 },
          boxes: {
            type: "array",
            minItems: 21,
            maxItems: 21,
            items: { $ref: "#/components/schemas/HabitBox" },
          },
          ai: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/AIMessage" }],
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "Server is up",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "message"],
                  properties: {
                    ok: { type: "boolean", example: true },
                    message: { type: "string", example: "Sab changa si" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ---- AUTH ----
    "/auth/google": {
      get: {
        summary: "Start Google OAuth login",
        description: "Redirects user to Google consent screen.",
        responses: { "302": { description: "Redirect to Google" } },
      },
    },
    "/auth/google/callback": {
      get: {
        summary: "Google OAuth callback",
        description:
          "Exchanges code, finds/creates user, sets httpOnly JWT cookie, then redirects to frontend.",
        responses: { "302": { description: "Redirect to frontend" } },
      },
    },

    // ---- PRIVATE HABIT API (cookieAuth) ----
    "/api/habits/me": {
      get: {
        summary: "Get my habit state",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "HabitState",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HabitState" },
              },
            },
          },
          "401": {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/habits": {
      post: {
        summary: "Create new habit (deletes old one)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: { name: { type: "string", example: "Cold Shower" } },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "HabitState",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HabitState" } } },
          },
          "400": {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/habits/{id}": {
      patch: {
        summary: "Rename habit",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: { name: { type: "string", example: "No Caffeine" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "HabitState",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HabitState" } } },
          },
          "400": {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/habits/{id}/save": {
      post: {
        summary: "Save today's completion (no undo)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "201": {
            description: "HabitState (may include ai message)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HabitState" } } },
          },
          "400": {
            description: "Validation / completed habit",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": {
            description: "Not authenticated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Habit not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    // ---- PUBLIC LANDING ----
    "/api/public/{publicSlug}": {
      get: {
        summary: "Get public habit state by slug (read-only)",
        parameters: [
          { name: "publicSlug", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "HabitState (all boxes canEdit=false)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HabitState" } } },
          },
          "404": {
            description: "Public habit not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
  },
};
