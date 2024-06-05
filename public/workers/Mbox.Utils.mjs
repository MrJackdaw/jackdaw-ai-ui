export const STATUS = Object.freeze({
  ERROR: "error",
  OK: "ok",
  LOADING: "loading"
});

/**
 * Strip HTML characters and other non-essential parts from email content
 * @param {string} data Parsed text or HTML file as a string
 */
export function pruneHTMLString(data) {
  return (
    data
      // Remove script and style content
      .replace(/<(script|style)[^>]*>([\s\S]*?)<\/\1>/gim, "")
      // remove leading `>` from inlined reply-sections
      .replace(/>+(\s|\t|\n)+?/gim, "\n")
      // Remove all remaining HTML tags
      // .replace(/<.[^<>]*?>/gim, "")
      .replace(/<\/?[a-z][\s\S]*?>/gim, "")
      // Normalize white space
      .replace(/\s{2,}/g, " ")
      // Convert HTML entities to their corresponding characters
      .replace(/&[#A-Za-z0-9]+;/gim, decodeHtmlEntities)
      // Remove leading `>` from quoted lines
      .replace(/^>{3,}\s+/gm, "")
      // Remove excessive line-breaks
      .replace(/\n{3,}/g, "\n")
  );
}

/**
 * Manually parse out HTML chars from text string
 * @param {string} text  */
function decodeHtmlEntities(text) {
  const entities = {
    "&amp;": "&",
    "&mdash;": "-",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'"
    // Add more entities as needed
  };
  return text.replace(/&[#A-Za-z0-9]+;/g, (match) => entities[match] || match);
}

/** Removes cached huggingface models */
export async function clearCachedModels() {
  return caches.delete("transformers-cache");
}

/**
 * Post an error response to the UI
 * @param {string} message Message to return
 * @param {*} data Any additional error info to send
 * @returns Standardized error object
 */
export function workerError(message, data) {
  return self.postMessage({ status: STATUS.ERROR, message, data });
}

/**
 * Wrapper helper for `console.time` + `console.timeEnd` functions
 * @param {string} startTimerLabel Label of console timer to start
 * @param {string|undefined} stopTimerLabel Optional label of timer to stop
 */
export function startTimer(startTimerLabel, stopTimerLabel) {
  if (!import.meta.env.DEV) return;
  stopTimer(stopTimerLabel);
  console.log(`${startTimerLabel} \t ::start\n`);
  console.time(startTimerLabel);
}

/**
 * Wrapper helper for `console.timeEnd` function
 * @param {string} stopTimerLabel Optional label of timer to stop
 */
export function stopTimer(stopTimerLabel) {
  if (!import.meta.env.DEV) return;
  if (stopTimerLabel) console.timeEnd(stopTimerLabel);
}

/**
 * Get a list of column-names from CSV file, with an extra column for doc name
 * @param {string} csvContent Parsed CSV contents in a text blurb
 * @returns {string[]} list of column names
 */
function getColumnNames(csvContent) {
  const lines = csvContent.split("\n");
  let columnNames = lines[0].split(",");
  // Check the second row in case the first doesn't have the actual column names
  if (columnNames.length === 1 && lines[1].split(",").length !== 1) {
    columnNames = lines[1].split(",");
  }
  columnNames.push("meta__documentName");
  return columnNames;
}

/**
 * Convert a CSV to JSON before sending to server (or doing anything else)
 * @param {File} file CSV file
 * @param {number} [batchSize=300] Number of rows to process per batch
 * @returns {Promise<[{(): IterableIterator}|null, Error|null]>} Array with two items: 1) Generator function
 * that yields rows from the CSV, and 2) An error if one was encountered when opening the file.
 * One item will always be null: if there's a generator, Error will be `null` (and vice-versa)
 */
export async function csvToJson(file, batchSize = 300) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve([
        // A genererator function that yields rows until there are none left
        function* yieldCSVRows() {
          const csvContent = reader.result;
          const columnNames = getColumnNames(csvContent);
          const documentName = file.name;
          const lines = csvContent.split("\n").slice(1); // Skip header line
          let batch = [];

          for (const line of lines) {
            if (line.trim() === "") continue; // Skip empty lines
            const row = line.split(",");
            const jsonObject = {};

            for (let i = 0; i < columnNames.length - 1; i++) {
              jsonObject[columnNames[i]] = row[i];
            }

            jsonObject["meta__documentName"] = documentName;
            batch.push(jsonObject);

            if (batch.length === batchSize) {
              yield batch;
              batch = [];
            }
          }

          if (batch.length > 0) {
            yield batch;
          }
        },

        // No error for successful response
        null
      ]);
    };

    reader.onerror = (error) => {
      // Error resolves promise with no generator and an Error
      resolve([null, error?.message ?? JSON.stringify(error)]);
    };

    // Begin reading file
    reader.readAsText(file);
  });
}
