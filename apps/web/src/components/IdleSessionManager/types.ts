export type IdleSessionManagerProps = {
  timeoutMs?: number; // default 20 min
  autoLogoutMs?: number; // optional grace period after modal shows
  onLogout: () => Promise<void> | void;
};
