import { sectionTypes } from "./shared";

export const pageSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "PageDocument",
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "title", "sections"],
  properties: {
    schemaVersion: { type: "string", minLength: 1 },
    title: { type: "string", minLength: 1 },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "type", "variant", "props", "slots"],
        properties: {
          id: { type: "string", minLength: 1 },
          type: { type: "string", enum: [...sectionTypes] },
          variant: { type: "string", minLength: 1 },
          props: {
            type: "object",
            additionalProperties: true
          },
          slots: {
            type: "object",
            additionalProperties: true
          }
        }
      }
    }
  }
} as const;
