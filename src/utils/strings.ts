/** @file Mirrors __PUBLIC__/workers/Worker.Strings.mjs */

export const ERR_FILE_OPEN = "Could not read file";
export const ERR_NO_ACTION = "Invalid action (or none provided)";
export const ERR_NO_DATA = "No 'data' parameter was sent with request";
export const ERR_NO_FILE = "No inbox found";

// response keys
export const RES_VECTOR_SEARCH = "Worker.VectorStore::Search";
export const RES_STATE_UPDATE = "Worker.State::Update";

// storage keys - AI
export const LS_ASSISTANT_KEY = "jc-assistant";
export const LS_AI_PROVIDER_APIKEY = "jc-assistant-APIKey";
export const LS_EMBEDDER_KEY = "jc-embedder";
export const LS_EMBEDDER_APIKEY = "jc-embedder-APIKey";
export const LS_OLLAMA_BASEURL = "jc-ollama-APIKey";
export const LS_USE_CLOUD_STORE = "jc-cloud-vectorstore";
export const LS_ACTIVE_PROJECT = "jc-project";

// storage keys - mailbox
export const LS_OWNER_KEY = "jc-owner";

// storage keys - localstorage - application user
export const LS_FORM_SAVE_KEY = "jc-dump";
export const LS_NEXT_PATH = "jc-next-rt";
export const LS_COLOR_IDENT_OVERRIDE = "jc-ident-hex";

// storage keys - indexeddb - application data sync
export const SETTING__USER_KEY = "jc-user";
export const SETTING__PROJECT_SYNC = "sync--projects-list";
