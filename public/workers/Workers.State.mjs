import createState from "@jackcom/raphsducks";
import { STATUS } from "./Mbox.Utils.mjs";
import { RES_STATE_UPDATE } from "./Mbox.Strings.mjs";

/** Values for loading */
export const STATE__LOADING = {
  loading: true,
  messagesLoaded: false,
  vectorStoreLoaded: false,
  docsCount: 0
};

/** Values for initial state */
export const STATE__INIT = {
  ...STATE__LOADING,
  initialized: false,
  loading: false
};

/** Shared worker state */
export const MboxWorkerStore = createState(STATE__INIT);

/**
 * Export Worker state to UI listener
 * @param {Partial<ReturnType<typeof MboxWorkerStore.getState>>|null} state State updates to apply
 * @param {"ok"|"error"|"loading"} [status=STATUS.OK] Response status (default "ok")
 * @param {string|undefined} error (Optional) Response error details if any
 */
export function exportWorkerState(state = null, status = STATUS.OK, error) {
  if (state) MboxWorkerStore.multiple(state);

  self.postMessage({
    state: MboxWorkerStore.getState(),
    status,
    message: RES_STATE_UPDATE,
    error
  });
}
