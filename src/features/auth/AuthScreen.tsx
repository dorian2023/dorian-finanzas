import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  KeyRound,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Delete,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AuthService } from './authService';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [hasAccount, setHasAccount] = useState(() => AuthService.hasAccount());
  const [hasPin, setHasPin] = useState(() => AuthService.hasPin());
  const [authMode, setAuthMode] = useState<'pin' | 'login' | 'register'>(() => {
    if (!AuthService.hasAccount()) return 'register';
    if (AuthService.hasPin()) return 'pin';
    return 'login';
  });

  // Estado del PIN Pad
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Estado de Formularios (Login / Register)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const creds = AuthService.getStoredCredentials();
    if (creds) {
      setEmail(creds.email);
      setHasAccount(true);
      setHasPin(!!(creds.pinHash && creds.isPinEnabled));
    }
  }, []);

  // Manejar teclado numérico para PIN
  const handlePinDigit = async (digit: string) => {
    if (pinInput.length >= 4) return;
    const nextPin = pinInput + digit;
    setPinInput(nextPin);
    setPinError(false);

    if (nextPin.length === 4) {
      setIsLoading(true);
      const valid = await AuthService.verifyPin(nextPin);
      setIsLoading(false);
      if (valid) {
        onAuthenticated();
      } else {
        setPinError(true);
        setTimeout(() => {
          setPinInput('');
          setPinError(false);
        }, 600);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    const res = await AuthService.loginWithPassword(email, password);
    setIsLoading(false);

    if (res.success) {
      onAuthenticated();
    } else {
      setFormError(res.error || 'Credenciales incorrectas');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPin && newPin.length !== 4) {
      setFormError('El PIN de acceso rápido debe tener exactamente 4 dígitos');
      return;
    }

    setIsLoading(true);
    const res = await AuthService.register(email, password, newPin || undefined);
    setIsLoading(false);

    if (res.success) {
      onAuthenticated();
    } else {
      setFormError(res.error || 'Error al configurar cuenta');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg-primary, #080c14)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        overflowY: 'auto',
      }}
    >
      {/* Fondo con brillo fintech */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 320,
          height: 320,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(168, 85, 247, 0.08) 60%, transparent 80%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 2 }}>
        {/* Logo / Badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
              marginBottom: 12,
            }}
          >
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary, #ffffff)', letterSpacing: -0.5 }}>
            Dorian Finanzas
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 4 }}>
            Control Bimonetario Seguro (USD / VES)
          </p>
        </div>

        {/* ======================================================== */}
        {/* VISTA 1: DESBLOQUEO RÁPIDO CON PIN                       */}
        {/* ======================================================== */}
        {authMode === 'pin' && (
          <div
            className="glass-panel"
            style={{
              borderRadius: 24,
              padding: '24px 20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
              <Lock size={15} color="#10b981" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #ffffff)' }}>
                Hola, Dorian 👋
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginBottom: 20 }}>
              Ingresa tu PIN de 4 dígitos para desbloquear
            </p>

            {/* Los 4 puntos del PIN */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                marginBottom: 28,
              }}
            >
              {[0, 1, 2, 3].map((index) => {
                const filled = pinInput.length > index;
                return (
                  <div
                    key={index}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: pinError
                        ? '2px solid #ef4444'
                        : filled
                        ? '2px solid #10b981'
                        : '2px solid rgba(255, 255, 255, 0.2)',
                      background: pinError
                        ? '#ef4444'
                        : filled
                        ? '#10b981'
                        : 'transparent',
                      transform: filled ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.18s ease',
                      boxShadow: filled ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none',
                    }}
                  />
                );
              })}
            </div>

            {pinError && (
              <p style={{ fontSize: 12, color: '#f87171', fontWeight: 700, marginBottom: 16 }}>
                PIN incorrecto. Intenta de nuevo.
              </p>
            )}

            {/* Teclado numérico 3x4 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                maxWidth: 270,
                margin: '0 auto 20px',
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinDigit(num)}
                  disabled={isLoading}
                  style={{
                    height: 54,
                    borderRadius: 16,
                    fontSize: 20,
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-primary, #ffffff)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {num}
                </button>
              ))}

              {/* Botón vacío o cambio a clave */}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                style={{
                  height: 54,
                  borderRadius: 16,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #94a3b8)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Ingresar con contraseña"
              >
                <KeyRound size={18} />
              </button>

              {/* Tecla 0 */}
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                disabled={isLoading}
                style={{
                  height: 54,
                  borderRadius: 16,
                  fontSize: 20,
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-primary, #ffffff)',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
              >
                0
              </button>

              {/* Tecla Borrar */}
              <button
                type="button"
                onClick={handlePinDelete}
                style={{
                  height: 54,
                  borderRadius: 16,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Delete size={20} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAuthMode('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 12px',
              }}
            >
              ¿Prefieres ingresar con Correo y Clave?
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* VISTA 2: INICIAR SESIÓN CON CORREO / CONTRASEÑA           */}
        {/* ======================================================== */}
        {authMode === 'login' && (
          <form
            onSubmit={handleLoginSubmit}
            className="glass-panel"
            style={{
              borderRadius: 24,
              padding: '24px 20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
                Iniciar Sesión
              </h2>
              {hasPin && (
                <button
                  type="button"
                  onClick={() => setAuthMode('pin')}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.15)',
                    padding: '4px 8px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Usar PIN 4 Dígitos
                </button>
              )}
            </div>

            {formError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  padding: '10px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', marginBottom: 4, textTransform: 'uppercase' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px 11px 36px', fontSize: 13, borderRadius: 12 }}
                />
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', marginBottom: 4, textTransform: 'uppercase' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Tu contraseña secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '11px 36px 11px 36px', fontSize: 13, borderRadius: 12 }}
                />
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
              }}
            >
              {isLoading ? 'Verificando...' : 'Entrar a Dorian Finanzas'}
              <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                style={{ background: 'none', border: 'none', color: '#c084fc', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                ¿Quieres cambiar o crear nueva cuenta?
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* VISTA 3: REGISTRO / CONFIGURACIÓN DE CUENTA               */}
        {/* ======================================================== */}
        {authMode === 'register' && (
          <form
            onSubmit={handleRegisterSubmit}
            className="glass-panel"
            style={{
              borderRadius: 24,
              padding: '24px 20px',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={18} color="#c084fc" />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary, #ffffff)' }}>
                Configurar Cuenta y Seguridad
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginBottom: 16 }}>
              Protege tus finanzas con correo, contraseña y PIN de 4 dígitos.
            </p>

            {formError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  padding: '10px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', marginBottom: 4, textTransform: 'uppercase' }}>
                Tu Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="ej. dorian@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px 11px 36px', fontSize: 13, borderRadius: 12 }}
                />
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', marginBottom: 4, textTransform: 'uppercase' }}>
                Contraseña Maestra (mínimo 6 caracteres)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Crea una contraseña segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '11px 36px 11px 36px', fontSize: 13, borderRadius: 12 }}
                />
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 4, textTransform: 'uppercase' }}>
                PIN Rápido de 4 Dígitos (Estilo Bancario)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="Ej. 1234"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 36px',
                    fontSize: 14,
                    letterSpacing: 4,
                    fontWeight: 800,
                    borderRadius: 12,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <KeyRound size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                Te permitirá abrir la app en tu teléfono con 4 toques sin tener que escribir tu correo siempre.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(168, 85, 247, 0.35)',
              }}
            >
              {isLoading ? 'Guardando...' : 'Crear y Proteger mi App'}
              <CheckCircle2 size={16} />
            </button>

            {hasAccount && (
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Volver a Iniciar Sesión
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
