// Web app specific types only
// Most types are now imported from @cuptrail/core

// Web-specific snackbar state type
export type SnackState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
};
