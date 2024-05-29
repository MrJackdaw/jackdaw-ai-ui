import { sendParserMessage } from "mbox/Mbox";
import { FormEventHandler } from "react";
import {
  LS_EMBEDDER_KEY,
  LS_EMBEDDER_APIKEY,
  LS_ASSISTANT_KEY,
  LS_ASSISTANT_APIKEY,
  LS_USE_CLOUD_STORE,
  LS_COLOR_IDENT_OVERRIDE,
  LS_OWNER_KEY
} from "./strings";

export const SERVER_URL = import.meta.env.VITE_SERVER_URL;
export const SESSION_URL = `${SERVER_URL}/session`;
export const SUPABASE_URL = `${SERVER_URL}/supabase`;
export const AUTH_OPTS: RequestInit = {
  credentials: "include",
  method: "post"
};
export type AISource = "jackcom" | "huggingface" | "ollama" | "openai";
export type User = {
  anonymous: boolean;
  authenticated: boolean;
  avatar: string;
  email: string;
  lastSeen: string;
};
export type UserProject = {
  /** browser-assigned key for cache lookup */
  __cacheKey?: string;
  id?: number;
  project_name: string;
  description: string;
};

/**
 * @helper Regex-check string conforms to email pattern
 * @param email Email string
 * @returns `true` if email string is valid */
export function validateEmailString(email: string): boolean {
  return new RegExp(/^\w{3,}@\w+\.\w+$/).test(email);
}

export const noOp = () => {};

export const suppressEvent: FormEventHandler = (e) => {
  e.preventDefault();
  if (e.stopPropagation) e.stopPropagation();
};

/** Generate a pseudo-unique component notification channel for user alerts */
export function notificationChannel(str: string) {
  const start = str.slice(0, 18);
  // reduce all alphanumeric chars to a single number by adding their char codes
  const sum = stringToNumber(start);
  if (isNaN(sum)) return Math.floor(Math.random() * 1000);
  return sum % 10000;
}

/** Turn an alphanumeric string into a number */
export function stringToNumber(str?: string) {
  if (!str) return 0;
  return str.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
}

/** Turn a string into snake case */
export function toSnakeCase(str: string) {
  return str.toLowerCase().replace(/\s/, "-");
}

/**
 * Generate a predictable RGB color from some provided string. Restrict generation
 * to avoid dark colors with poor contrast */
export function stringToColor(t: string) {
  const num = stringToNumber(t);
  const red = Math.max(0, (num * 100) % 255);
  const green = Math.max(0, (num * 1000) % 255);
  const blue = Math.max(0, (num * 10000) % 255);
  // convert `rgb(...)` string to hex
  const hex = rgbToHex(red, green, blue);
  // check if color is too dark
  if (red < 128) return stringToColor(t + "a");

  return hex;
}

/** Convert RGB to hex */
export function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/** Convert a hex string to an RGB object */
export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Change embeddings model (so user can do it locally if they want)
 * @param data New embedder
 */
export function changeEmbedder(data: AISource, apiKey?: string) {
  localStorage.setItem(LS_EMBEDDER_KEY, data);
  if (data !== "openai") localStorage.removeItem(LS_EMBEDDER_APIKEY);
  else {
    if (!apiKey) throw new Error("OpenAI API key required");
    localStorage.setItem(LS_EMBEDDER_APIKEY, apiKey);
  }

  sendParserMessage("Mbox.changeEmbedder", {
    embedder: data,
    apiKey: localStorage.getItem(LS_EMBEDDER_APIKEY)
  });
}

/** Set the LLM that will help the user  */
export function changeLLMSource(src: string, apiKey?: string) {
  localStorage.setItem(LS_ASSISTANT_KEY, src);
  if (!src.startsWith("openAI")) localStorage.removeItem(LS_ASSISTANT_APIKEY);
  else {
    if (!apiKey) throw new Error("OpenAI API key required");
    localStorage.setItem(LS_ASSISTANT_APIKEY, apiKey);
  }
}

export type LocalUserSettings = {
  assistantAPIKey: string;
  assistantLLM: string;
  colorIdent: string;
  embedder: AISource;
  embedderAPIKey: string;
  enableCloudStorage: boolean;
  owner: string;
};

/** Load in LocalStorage settings as an object */
export function getUserSettings() {
  return {
    assistantAPIKey: localStorage.getItem(LS_ASSISTANT_APIKEY) ?? "",
    assistantLLM: localStorage.getItem(LS_ASSISTANT_KEY) ?? "huggingface",
    colorIdent: localStorage.getItem(LS_COLOR_IDENT_OVERRIDE) ?? "",
    embedderAPIKey: localStorage.getItem(LS_EMBEDDER_APIKEY) ?? "",
    embedder: (localStorage.getItem(LS_EMBEDDER_KEY) ??
      "huggingface") as AISource,
    enableCloudStorage:
      (localStorage.getItem(LS_USE_CLOUD_STORE) ?? "0") === "1",
    owner: localStorage.getItem(LS_OWNER_KEY) ?? ""
  };
}

/** Write user settings to device/localStorage */
export function updateUserSettings(d: LocalUserSettings) {
  const willRefresh =
    localStorage.getItem(LS_ASSISTANT_KEY) !== d.assistantLLM ||
    localStorage.getItem(LS_EMBEDDER_KEY) !== d.embedder;
  changeLLMSource(d.assistantLLM, d.assistantAPIKey);
  changeEmbedder(d.embedder, d.embedderAPIKey);
  if (d.enableCloudStorage) localStorage.setItem(LS_USE_CLOUD_STORE, "1");
  else localStorage.removeItem(LS_USE_CLOUD_STORE);
  if (d.owner) localStorage.setItem(LS_OWNER_KEY, d.owner);
  if (d.colorIdent) localStorage.setItem(LS_COLOR_IDENT_OVERRIDE, d.colorIdent);
  else localStorage.setItem(LS_COLOR_IDENT_OVERRIDE, stringToColor(d.owner));
  if (willRefresh) window.location.reload();
}