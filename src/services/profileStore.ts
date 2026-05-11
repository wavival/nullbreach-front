const AVATAR_PREFIX = "nb:avatar:";
const CURRENT_LOGIN_PREFIX = "nb:currentLogin:";
const LAST_LOGIN_PREFIX = "nb:lastLogin:";

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function key(prefix: string, email: string): string {
  return `${prefix}${email.toLowerCase()}`;
}

export const profileStore = {
  getAvatar(email: string): string | null {
    if (!hasStorage()) return null;
    try {
      return window.localStorage.getItem(key(AVATAR_PREFIX, email));
    } catch {
      return null;
    }
  },
  setAvatar(email: string, dataUrl: string): void {
    if (!hasStorage()) return;
    try {
      window.localStorage.setItem(key(AVATAR_PREFIX, email), dataUrl);
    } catch {
      /* quota exceeded — ignore */
    }
  },
  clearAvatar(email: string): void {
    if (!hasStorage()) return;
    try {
      window.localStorage.removeItem(key(AVATAR_PREFIX, email));
    } catch {
      /* ignore */
    }
  },
  getLastLogin(email: string): string | null {
    if (!hasStorage()) return null;
    try {
      return window.localStorage.getItem(key(LAST_LOGIN_PREFIX, email));
    } catch {
      return null;
    }
  },
  recordLogin(email: string): void {
    if (!hasStorage()) return;
    try {
      const prev = window.localStorage.getItem(key(CURRENT_LOGIN_PREFIX, email));
      if (prev) {
        window.localStorage.setItem(key(LAST_LOGIN_PREFIX, email), prev);
      }
      window.localStorage.setItem(
        key(CURRENT_LOGIN_PREFIX, email),
        new Date().toISOString(),
      );
    } catch {
      /* ignore */
    }
  },
};
