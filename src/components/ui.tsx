import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// ---------- Toasts (notificacionController) ----------

interface Toast {
  id: number;
  kind: 'ok' | 'error' | 'info';
  text: string;
}

const ToastCtx = createContext<{ push: (kind: Toast['kind'], text: string) => void }>({
  push: () => {},
});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'info' ? '' : t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Componentes base (AppButton, AppCard, AppTextField...) ----------

export function AppButton({
  label,
  loading,
  disabled,
  onClick,
  secondary,
  type,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  secondary?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type ?? 'button'}
      className={`btn${secondary ? ' btn-secondary' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? 'Cargando…' : label}
    </button>
  );
}

export function AppCard({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

// ---------- PasswordInput (ojo mostrar/ocultar, espejo de AppTextField isPassword) ----------

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-wrap">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-eye"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setVisible((v) => !v)}
      >
        <MIcon name={visible ? 'visibility' : 'visibility_off'} size={22} />
      </button>
    </div>
  );
}

// ---------- AppSwitch (Recordarme, espejo de app_switch.dart: fila tappable) ----------

export function AppSwitch({
  value,
  onChanged,
  label,
}: {
  value: boolean;
  onChanged: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div className="switch-row" onClick={() => onChanged(!value)}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label ?? 'Recordarme'}
        className={`switch${value ? ' switch-on' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onChanged(!value);
        }}
      >
        <span className="switch-thumb" />
      </button>
      {label && <span className="switch-label">{label}</span>}
    </div>
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} />;
}

export function EmptyState({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <div className="card empty">
      <h3>{titulo}</h3>
      {subtitulo && <p>{subtitulo}</p>}
    </div>
  );
}

// ---------- WideFormDialog (modal de formulario unificado) ----------

export function Modal({
  title,
  children,
  error,
  saveLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  saving,
  canSave = true,
  onSave,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  error?: string | null;
  saveLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  canSave?: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="card">
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>{title}</h2>
          {children}
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions-row" style={{ marginTop: 8 }}>
            <AppButton label={cancelLabel} secondary onClick={onCancel} />
            <AppButton label={saveLabel} loading={saving} disabled={!canSave} onClick={onSave} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- MIcon (ícono Material outline, igual que la app) ----------

export function MIcon({ name, size }: { name: string; size?: number }) {
  return (
    <span className="msym" style={size ? { fontSize: size } : undefined} aria-hidden>
      {name}
    </span>
  );
}

// ---------- PageHeader (flecha ← + título, como el header de la app) ----------

export function PageHeader({ title, backTo, action }: { title: string; backTo: string; action?: ReactNode }) {
  const nav = useNavigate();
  function back() {
    // Como la app: si se puede volver, vuelve; si no, va a la ruta base.
    if (window.history.length > 1) nav(-1);
    else nav(backTo);
  }
  return (
    <div className="page-head">
      <button className="back-btn" onClick={back} aria-label="Volver">
        <MIcon name="chevron_left" size={30} />
      </button>
      <h1>{title}</h1>
      {action}
    </div>
  );
}

// ---------- PostCard (tarjeta estilo publicación, espejo de DetailPostCard) ----------

export interface PostMenuEntry {
  value: string;
  label: string;
  icon?: string;
  danger?: boolean;
}

export function PostCard({
  avatarLetter,
  title,
  subtitle,
  trailing,
  menuEntries = [],
  onMenuSelected,
  bannerIcon,
  bannerTop,
  bannerChips = [],
  bannerBottom,
  body,
  actions,
}: {
  avatarLetter?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  menuEntries?: PostMenuEntry[];
  onMenuSelected?: (value: string) => void;
  bannerIcon?: string;
  bannerTop?: ReactNode;
  bannerChips?: ReactNode[];
  bannerBottom?: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inicial = (avatarLetter?.trim().charAt(0) || '?').toUpperCase();

  useEffect(() => {
    if (!menuAbierto) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAbierto(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuAbierto]);

  return (
    <div className="card">
      <div className="post-head">
        <span className="avatar avatar-post">{inicial}</span>
        <div className="post-titles">
          <strong className="post-title">{title}</strong>
          {subtitle && <span className="post-subtitle">{subtitle}</span>}
        </div>
        {trailing}
        {menuEntries.length > 0 && (
          <div className="post-menu-wrap" ref={menuRef}>
            <button className="post-menu-btn" aria-label="Opciones" onClick={() => setMenuAbierto((v) => !v)}>
              <MIcon name="more_vert" size={22} />
            </button>
            {menuAbierto && (
              <div className="post-menu">
                {menuEntries.map((e) => (
                  <button
                    key={e.value}
                    className={`post-menu-item${e.danger ? ' danger' : ''}`}
                    onClick={() => {
                      setMenuAbierto(false);
                      onMenuSelected?.(e.value);
                    }}
                  >
                    {e.icon && <MIcon name={e.icon} size={18} />} {e.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {(bannerIcon || bannerTop || bannerChips.length > 0 || bannerBottom) && (
        <div className="post-banner">
          {bannerIcon && (
            <div className="post-banner-icon">
              <MIcon name={bannerIcon} />
            </div>
          )}
          {bannerTop}
          {bannerChips.length > 0 && (
            <div className="banner-chips">
              {bannerChips.map((c, i) =>
                typeof c === 'string' ? (
                  <span key={i} className="post-chip">
                    {c}
                  </span>
                ) : (
                  <span key={i}>{c}</span>
                ),
              )}
            </div>
          )}
          {bannerBottom && <div className="actions-row">{bannerBottom}</div>}
        </div>
      )}
      {actions && <div className="actions-row">{actions}</div>}
      {body && (
        <>
          <hr className="post-divider" />
          <div className="post-body">{body}</div>
        </>
      )}
    </div>
  );
}

// ---------- RowMenu (⋯ de las filas, espejo del PopupMenuButton) ----------

export function RowMenu({
  entries,
  onSelect,
}: {
  entries: PostMenuEntry[];
  onSelect: (value: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [abierto]);

  return (
    <div className="post-menu-wrap" ref={ref}>
      <button className="post-menu-btn" aria-label="Opciones" onClick={() => setAbierto((v) => !v)}>
        <MIcon name="more_vert" size={22} />
      </button>
      {abierto && (
        <div className="post-menu">
          {entries.map((e) => (
            <button
              key={e.value}
              className={`post-menu-item${e.danger ? ' danger' : ''}`}
              onClick={() => {
                setAbierto(false);
                onSelect(e.value);
              }}
            >
              {e.icon && <MIcon name={e.icon} size={18} />} {e.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Requisitos de contraseña (checklist en vivo) ----------

export function passwordChecks(pw: string, confirm: string) {
  return {
    largo: pw.length >= 8,
    noNumerica: pw.length > 0 && !/^\d+$/.test(pw),
    coinciden: pw.length > 0 && pw === confirm,
  };
}

export function PasswordReqs({ pw, confirm }: { pw: string; confirm: string }) {
  const c = passwordChecks(pw, confirm);
  const rows: [boolean, string][] = [
    [c.largo, 'Mínimo 8 caracteres'],
    [c.noNumerica, 'No puede ser solo números'],
    [pw.length === 0 ? false : true, 'No uses una clave común (ej: 12345678, password)'],
    [c.coinciden, 'La confirmación debe coincidir'],
  ];
  return (
    <div className="info-box">
      <strong>Requisitos de la nueva contraseña</strong>
      {rows.map(([ok, txt], i) => (
        <div key={i} className={`req-row ${ok ? 'req-ok' : 'req-pending'}`}>
          <span>{ok ? '●' : '○'}</span>
          <span>{txt}</span>
        </div>
      ))}
      <div className="hint">El servidor también rechaza claves parecidas a tu email o nombre.</div>
    </div>
  );
}
