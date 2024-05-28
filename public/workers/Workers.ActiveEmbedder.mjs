import { HFEmbedder, JackComEmbedder, OpenAIEmbedder } from "./Workers.Models";

/** @type {AsyncSingleton} Active embedding (user can conditionally override) */
let activeEmbedder = null;
/**
 * Get active embeddings model (allows user to override with
 * huggingface (local), personal open-ai, or proxy-openai (jackcom))
 * @returns {Promise<AsyncSingleton>} */
export async function getEmbedder() {
  return activeEmbedder || setActiveEmbedder("jackcom");
}

/**
 * Override active embedder class (user can conditionally override)
 * @param {"jackcom"|"huggingface"|"openai"} e New Embedder target
 * @param {string?} apiKey  */

export async function setActiveEmbedder(e, apiKey = "") {
  switch (e) {
    case "jackcom": {
      activeEmbedder = await JackComEmbedder.getInstance();
      break;
    }
    case "huggingface": {
      activeEmbedder = await HFEmbedder.getInstance();
      break;
    }
    case "openai": {
      // requires user to provide their own API key
      if (!apiKey) return console.error("API key required");
      activeEmbedder = await OpenAIEmbedder.getInstance(apiKey);
      break;
    }

    default:
      console.error("Invalid embedder");
      break;
  }

  return activeEmbedder;
}
