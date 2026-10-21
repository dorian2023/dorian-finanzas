import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Check,
  RefreshCw,
  Building2,
  Coins
} from 'lucide-react';
import {
  ExchangeRateService,
  type RateConfig,
  type RateSource,
} from '../../shared/lib/exchangeRateService';

interface RateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRateConfigChanged: (config: RateConfig) => void;
}

export const RateModal: React.FC<RateModalProps> = ({
  isOpen,
  onClose,
  onRateConfigChanged,
}) => {
  const [config, setConfig] = useState<RateConfig>(ExchangeRateService.getConfig());
  const [bcvInput, setBcvInput] = useState('');
  const [binanceInput, setBinanceInput] = useState('');
  const [activeSource, setActiveSource] = useState<RateSource>('binance');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = ExchangeRateService.getConfig();
      setConfig(current);
      setBcvInput(current.bcv.toString());
      setBinanceInput(current.binance.toString());
      setActiveSource(current.activeSource);
      setAutoUpdate(current.autoUpdate);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFetchLive = async () => {
    setIsFetching(true);
    setStatusMessage(null);
    const result = await ExchangeRateService.fetchLiveRates();
    setIsFetching(false);

    if (result.success) {
      setConfig(result.config);
      setBcvInput(result.config.bcv.toString());
      setBinanceInput(result.config.binance.toString());
      setStatusMessage('¡Tasas actualizadas en vivo con éxito! ✅');
      onRateConfigChanged(result.config);
    } else {
      setStatusMessage('No se pudo conectar a la API en vivo. Puedes ajustar las tasas a mano.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBcv = parseFloat(bcvInput.replace(',', '.'));
    const parsedBinance = parseFloat(binanceInput.replace(',', '.'));

    const newConfig: RateConfig = {
      bcv: !isNaN(parsedBcv) && parsedBcv > 0 ? parsedBcv : config.bcv,
      binance: !isNaN(parsedBinance) && parsedBinance > 0 ? parsedBinance : config.binance,
      activeSource,
      autoUpdate,
      lastUpdated: new Date().toISOString(),
    };

    ExchangeRateService.saveConfig(newConfig);
    onRateConfigChanged(newConfig);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.2) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Tasas de Cambio</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                BCV Oficial vs. Binance P2P
              </p>
            </div>
          </div>

          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Botón de Actualización Automática en Vivo */}
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={handleFetchLive}
            disabled={isFetching}
            className="btn-secondary"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              color: '#38bdf8',
            }}
          >
            <RefreshCw size={16} className={isFetching ? 'spin' : ''} />
            {isFetching ? 'Consultando tasas en vivo...' : '🔄 Actualizar tasas en vivo (Automático)'}
          </button>

          {statusMessage && (
            <div style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: statusMessage.includes('éxito') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${statusMessage.includes('éxito') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontSize: 12,
              color: statusMessage.includes('éxito') ? '#34d399' : '#fbbf24',
              textAlign: 'center',
            }}>
              {statusMessage}
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
            Selecciona cuál usar para los cálculos:
          </div>

          {/* Tarjeta 1: Tasa Binance / Paralelo */}
          <div
            onClick={() => setActiveSource('binance')}
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md)',
              background: activeSource === 'binance' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border: activeSource === 'binance' ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              marginBottom: 12,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Coins size={18} color="#f59e0b" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>
                  Tasa Binance P2P / Paralelo
                </span>
              </div>
              {activeSource === 'binance' ? (
                <span className="badge badge-ves" style={{ fontSize: 10 }}>
                  <Check size={11} /> ACTIVA
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Toca para activar</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>Bs.</span>
              <input
                type="text"
                inputMode="decimal"
                value={binanceInput}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setBinanceInput(e.target.value)}
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#fbbf24',
                  padding: '8px 12px',
                }}
                placeholder="1006.20"
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
              💡 Puedes escribir el valor a mano si cambia en tu app de Binance.
            </div>
          </div>

          {/* Tarjeta 2: Tasa BCV Oficial */}
          <div
            onClick={() => setActiveSource('bcv')}
            style={{
              padding: 14,
              borderRadius: 'var(--radius-md)',
              background: activeSource === 'bcv' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border: activeSource === 'bcv' ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              marginBottom: 16,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} color="#60a5fa" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa' }}>
                  Tasa Oficial BCV
                </span>
              </div>
              {activeSource === 'bcv' ? (
                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', fontSize: 10 }}>
                  <Check size={11} /> ACTIVA
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Toca para activar</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)' }}>Bs.</span>
              <input
                type="text"
                inputMode="decimal"
                value={bcvInput}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setBcvInput(e.target.value)}
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#60a5fa',
                  padding: '8px 12px',
                }}
                placeholder="881.88"
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
              💡 Tasa fijada por el Banco Central de Venezuela.
            </div>
          </div>

          {/* Checkbox de actualización automática */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            marginBottom: 20,
            border: '1px solid var(--border-subtle)',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Actualización automática</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Consultar al abrir la aplicación</div>
            </div>
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={(e) => setAutoUpdate(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: 'var(--color-usd)', cursor: 'pointer' }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Check size={18} /> Aplicar y Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
};
