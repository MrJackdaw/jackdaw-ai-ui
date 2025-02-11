import { User, isJackCOMStr } from "utils/general";
import { UserStore } from "state/user";
import { updateAsWarning } from "state/notifications";
import {
  LS_ACTIVE_PROJECT,
  LS_ASSISTANT_KEY,
  LS_EMBEDDER_APIKEY,
  LS_EMBEDDER_KEY,
  LS_OWNER_KEY,
  LS_USE_CLOUD_STORE,
  SETTING__USER_KEY
} from "utils/strings";
import {
  cacheUserSetting,
  deleteCachedSetting,
  getCachedUser
} from "indexedDB";
import { DateTime } from "luxon";
import { sessionFetch } from "./requests.shared";
import { refreshSettingsFromCache } from "state/settings-store";

/** Check if user is logged in */
export async function isUserAuthenticated() {
  const cached: User = await getCachedUser();
  if (cached) {
    const expires = DateTime.fromISO(cached.lastSeen).plus({ minutes: 30 });
    const stillAuthed = expires.toMillis() >= DateTime.now().toMillis();
    if (stillAuthed) return cached; // exit with cached user
    deleteCachedSetting(SETTING__USER_KEY); // clear cache if stale
  }

  return sessionFetch<{ user: User }>("get-user")
    .then(({ user }) => {
      // TESTOSAURUS
      // stripeFetch("usage:storage").then(console.log);
      // TESTOSAURUS

      if (user) cacheUserSetting(SETTING__USER_KEY, JSON.stringify(user));
      return user;
    })
    .catch(() => {
      let err = `Could not connect to App server.`;
      err = `${err} You may still be able to use your private API key directly with some AI providers`;
      updateAsWarning(err, undefined, false);
      return null;
    });
}

let init = false;
export async function initializeUserState() {
  if (init) return;
  else init = true;

  try {
    migrateLegacyStorageKeys();
    const user = await isUserAuthenticated();
    const lastOwner = localStorage.getItem(LS_OWNER_KEY);
    if (user) {
      if (!lastOwner || lastOwner === "Guest")
        localStorage.setItem(
          LS_OWNER_KEY,
          user.email.split("@").shift() ?? user.email
        );
    }
    UserStore.multiple({
      ...user,
      email: user?.email,
      authenticated: Boolean(user),
      criticalError: false,
      initialized: true
    });
    refreshSettingsFromCache();
  } catch (error) {
    updateAsWarning("Could not connect to server", undefined, false);
    UserStore.multiple({ criticalError: true, initialized: true });
  } finally {
    init = false;
  }
  return UserStore.getState();
}

/** Navigate user to oauth consent screen */
export async function startOAuthGoogle() {
  const { url } = await sessionFetch<{ url: string }>("oauth:google");
  if (url) window.open(url, "_self");
}

/** Complete OAuth login flow */
export async function completeOAuthFlow(hash: string) {
  return sessionFetch("oauth:complete", { hash });
}

/** Logout */
export async function logoutUser() {
  await Promise.all([
    sessionFetch("session:logout"),
    deleteCachedSetting(SETTING__USER_KEY)
  ]);
  // Remove authenticated user stuff
  [LS_OWNER_KEY, LS_USE_CLOUD_STORE, LS_ACTIVE_PROJECT].map(
    localStorage.removeItem
  );
  // reset the assistant and embedder models if necessary
  [LS_ASSISTANT_KEY, LS_EMBEDDER_KEY].forEach((k) => {
    const v = localStorage.getItem(k) ?? "";
    if (isJackCOMStr(v)) localStorage.removeItem(LS_ASSISTANT_KEY);
  });
  // Refresh window
  UserStore.reset();
  window.location.reload();
}

/**
 * Initialize required LocalStorage keys: replace/update/remove any deprecated items */
function migrateLegacyStorageKeys() {
  // Add required defaults
  if (!localStorage.getItem(LS_EMBEDDER_KEY))
    localStorage.setItem(LS_EMBEDDER_KEY, "openai");
  if (!localStorage.getItem(LS_ASSISTANT_KEY))
    localStorage.setItem(LS_ASSISTANT_KEY, "openai");
  if (!localStorage.getItem(LS_OWNER_KEY))
    localStorage.setItem(LS_OWNER_KEY, "Guest");

  // Remove deprecated keys
  if (localStorage.getItem(LS_EMBEDDER_APIKEY))
    localStorage.removeItem(LS_EMBEDDER_APIKEY);
}
