"use client";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { atmospheres, type IrisValue } from "./atmospheres";

type PageTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type ModelDocument = Document & {
  modelContext?: {
    registerTool: (
      tool: PageTool,
      options: { signal: AbortSignal },
    ) => void | Promise<void>;
  };
};

export function useIrisAgent(
  value: IrisValue,
  onChange: (value: IrisValue) => void,
) {
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  useEffect(() => {
    const context = (document as ModelDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const read = () => {
      const current = latest.current.value;
      const theme = atmospheres.find((a) => a.id === current.atmosphere)!;
      return {
        ...current,
        tokens: {
          surface: theme.background,
          ink: theme.ink,
          accent: theme.accent,
        },
      };
    };
    const tools: PageTool[] = [
      {
        name: "get_iris_atmosphere",
        title: "Read Iris atmosphere",
        description:
          "Read the currently selected atmosphere, light intensity, and matching color tokens.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: () => read(),
      },
      {
        name: "set_iris_atmosphere",
        title: "Set Iris atmosphere",
        description:
          "Set the visible Iris atmosphere and light intensity. Updates the same controls as a person using the interface; no external effects or persistence.",
        inputSchema: {
          type: "object",
          properties: {
            atmosphere: { type: "string", enum: ["pearl", "dusk", "ember"] },
            intensity: { type: "integer", minimum: 0, maximum: 100 },
          },
          required: ["atmosphere", "intensity"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input) => {
          if (!input || typeof input !== "object" || Array.isArray(input))
            throw Error("Expected an atmosphere and intensity.");
          const v = input as Record<string, unknown>;
          if (
            Object.keys(v).some(
              (k) => !["atmosphere", "intensity"].includes(k),
            ) ||
            !atmospheres.some((a) => a.id === v.atmosphere) ||
            typeof v.intensity !== "number" ||
            !Number.isInteger(v.intensity) ||
            v.intensity < 0 ||
            v.intensity > 100
          )
            throw Error(
              "Choose pearl, dusk, or ember and an integer intensity from 0 to 100.",
            );
          flushSync(() => latest.current.onChange(v as IrisValue));
          return read();
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Unsupported registry versions must not interrupt the component. */
      }
    }
    return () => lifecycle.abort();
  }, []);
}
