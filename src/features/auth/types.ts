export interface AuthUser {
  email: string;
  name?: string;
  hasPin: boolean;
  createdAt: string;
}

export interface StoredCredentials {
  email: string;
  passwordHash: string;
  pinHash?: string;
  isPinEnabled: boolean;
  lockOnExit: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLocked: boolean;
  user: AuthUser | null;
  hasStoredAccount: boolean;
}
