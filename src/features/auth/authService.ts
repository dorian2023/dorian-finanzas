import { supabase } from '../../shared/lib/supabaseClient';
import type { AuthState, AuthUser, StoredCredentials } from './types';

const AUTH_STORAGE_KEY = 'dorian_auth_credentials_v1';
const SESSION_STORAGE_KEY = 'dorian_auth_session_v1';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AuthService = {
  getStoredCredentials(): StoredCredentials | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  hasAccount(): boolean {
    return !!this.getStoredCredentials();
  },

  hasPin(): boolean {
    const creds = this.getStoredCredentials();
    return !!(creds && creds.pinHash && creds.isPinEnabled);
  },

  isSessionActive(): boolean {
    try {
      const active = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (active === 'true') return true;
      // Si no hay sessionStorage, verificar si hay sesión persistente
      const localActive = localStorage.getItem(SESSION_STORAGE_KEY);
      return localActive === 'true';
    } catch {
      return false;
    }
  },

  getAuthState(): AuthState {
    const creds = this.getStoredCredentials();
    const isActive = this.isSessionActive();

    if (!creds) {
      return {
        isAuthenticated: false,
        isLocked: false,
        user: null,
        hasStoredAccount: false,
      };
    }

    const user: AuthUser = {
      email: creds.email,
      name: 'Dorian',
      hasPin: !!(creds.pinHash && creds.isPinEnabled),
      createdAt: new Date().toISOString(),
    };

    return {
      isAuthenticated: isActive,
      isLocked: !isActive,
      user,
      hasStoredAccount: true,
    };
  },

  /**
   * Registra o configura las credenciales de la cuenta (Correo, Clave y PIN opcional)
   */
  async register(
    email: string,
    password: string,
    pin?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Ingresa un correo electrónico válido' };
      }
      if (password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      const passwordHash = await sha256(password);
      let pinHash: string | undefined = undefined;

      if (pin && pin.trim().length === 4) {
        pinHash = await sha256(pin.trim());
      }

      const creds: StoredCredentials = {
        email: cleanEmail,
        passwordHash,
        pinHash,
        isPinEnabled: !!pinHash,
        lockOnExit: false,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(creds));
      this.setSessionActive(true);

      // Intentar vincular silenciosamente con Supabase Auth si está disponible
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
      } catch {
        // Ignorar fallo de red en Supabase, la seguridad local queda activa
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error registrando cuenta' };
    }
  },

  /**
   * Inicia sesión con Correo y Contraseña
   */
  async loginWithPassword(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const creds = this.getStoredCredentials();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Verificación contra credenciales guardadas
    if (creds) {
      const inputPassHash = await sha256(password);
      if (creds.email === cleanEmail && creds.passwordHash === inputPassHash) {
        this.setSessionActive(true);
        return { success: true };
      }
    }

    // 2. Si no coincide o es un nuevo dispositivo, intentar con Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
        // Guardar credenciales validadas por Supabase localmente para soporte offline
        const passwordHash = await sha256(password);
        const newCreds: StoredCredentials = {
          email: cleanEmail,
          passwordHash,
          isPinEnabled: false,
          lockOnExit: false,
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newCreds));
        this.setSessionActive(true);
        return { success: true };
      }
    } catch {
      // Continuar al error general
    }

    return {
      success: false,
      error: 'Correo o contraseña incorrectos. Verifica tus datos.',
    };
  },

  /**
   * Desbloqueo rápido mediante PIN de 4 dígitos
   */
  async verifyPin(pin: string): Promise<boolean> {
    const creds = this.getStoredCredentials();
    if (!creds || !creds.pinHash || !creds.isPinEnabled) return false;

    const inputPinHash = await sha256(pin.trim());
    const valid = creds.pinHash === inputPinHash;
    if (valid) {
      this.setSessionActive(true);
    }
    return valid;
  },

  /**
   * Actualiza el PIN de 4 dígitos
   */
  async updatePin(pin: string): Promise<boolean> {
    const creds = this.getStoredCredentials();
    if (!creds) return false;

    if (!pin || pin.length !== 4) {
      creds.isPinEnabled = false;
      creds.pinHash = undefined;
    } else {
      creds.pinHash = await sha256(pin);
      creds.isPinEnabled = true;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(creds));
    return true;
  },

  setSessionActive(active: boolean): void {
    if (active) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      localStorage.setItem(SESSION_STORAGE_KEY, 'true');
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  },

  lock(): void {
    this.setSessionActive(false);
  },

  async logout(): Promise<void> {
    this.setSessionActive(false);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar error de red al salir
    }
  },
};
