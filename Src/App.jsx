import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Plus, Settings, X, Trash2,
  Download, Clock, Check, AlertCircle, Target, Sliders, Users,
  TrendingUp, AlertTriangle, Star, Award, Flame, Activity,
} from 'lucide-react';

// ─── Design Tokens · BOX04 Industrial Premium · Grayscale ──────
const C = {
  bgDeep: '#050505',
  bg: '#0A0A0A',
  surface: '#111111',
  surface2: '#161616',
  surface3: '#1C1C1C',
  border: '#222222',
  borderSoft: '#171717',
  borderGlow: '#3A3D42',
  accent: '#D4D8DD',         // prata premium (brand)
  accentDeep: '#8B9199',     // cinza médio
  accentDarker: '#3A3D42',
  accentGlow: 'rgba(212, 216, 221, 0.08)',
  text: '#E8E8E8',
  textDim: '#8B8B8B',
  textFaint: '#4A4A4A',
  positive: '#86EFAC',       // verde sutil pra deltas (não brand)
  negative: '#F87171',
  warning: '#FBBF24',
};

const PRESET_FIELDS = [
  { id: 'faturamento', label: 'Faturamento', type: 'currency', enabled: true, isPreset: true, isPrimary: true },
  { id: 'atendimentos', label: 'Atendimentos', type: 'number', enabled: true, isPreset: true },
  { id: 'ticketMedio', label: 'Ticket Médio', type: 'currency', enabled: true, isPreset: true },
  { id: 'avaliacao', label: 'Avaliação', type: 'rating', enabled: true, isPreset: true },
  { id: 'comissao', label: 'Comissão paga', type: 'currency', enabled: false, isPreset: true },
  { id: 'retencao', label: 'Retenção', type: 'percent', enabled: false, isPreset: true },
  { id: 'clientesNovos', label: 'Clientes novos', type: 'number', enabled: false, isPreset: true },
  { id: 'ocupacao', label: 'Ocupação', type: 'percent', enabled: false, isPreset: true },
  { id: 'cancelamentos', label: 'Cancelamentos', type: 'number', enabled: false, isPreset: true },
  { id: 'faltas', label: 'No-show', type: 'number', enabled: false, isPreset: true },
];

// ─── Storage (localStorage do navegador) ───────────────────────
const _get = (key, fallback) => {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : fallback;
  } catch { return fallback; }
};
const _set = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
};
const Storage = {
  async getBarbers() { return _get('box04_barbers', []); },
  async setBarbers(b) { return _set('box04_barbers', b); },
  async getEntries() { return _get('box04_entries', []); },
  async setEntries(e) { return _set('box04_entries', e); },
  async getFields() { return _get('box04_fields', null); },
  async setFields(f) { return _set('box04_fields', f); },
  async getMetas() { return _get('box04_metas', {}); },
  async setMetas(m) { return _set('box04_metas', m); },
};

const seedDemo = () => {
  const barbers = [
    { id: 1, name: 'Ricardo Mendes', nickname: 'o veterano', years: 12, avatar: 'RM' },
    { id: 2, name: 'Diego Almeida', nickname: 'o clássico', years: 8, avatar: 'DA' },
    { id: 3, name: 'Lucas Ferreira', nickname: 'o estiloso', years: 5, avatar: 'LF' },
  ];
  const periods = ['Dez 2025', 'Jan 2026', 'Fev 2026', 'Mar 2026', 'Abr 2026', 'Mai 2026'];
  const dates = ['2025-12-31', '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-08'];
  const entries = [];
  let id = 1;
  barbers.forEach((b, bi) => {
    periods.forEach((p, pi) => {
      const base = 8000 - bi * 1500 + pi * 800 + Math.floor(Math.random() * 1500);
      const att = 100 - bi * 15 + pi * 8 + Math.floor(Math.random() * 20);
      entries.push({
        id: id++, barbeiroId: b.id, periodLabel: p, date: dates[pi],
        values: {
          faturamento: base, atendimentos: att,
          ticketMedio: Math.round((base / att) * 100) / 100,
          avaliacao: 4.3 + Math.random() * 0.6,
        },
      });
    });
  });
  const metas = {
    '1_faturamento': 12000, '1_atendimentos': 130,
    '2_faturamento': 9000, '2_atendimentos': 110,
    '3_faturamento': 7000, '3_atendimentos': 90,
  };
  return { barbers, entries, metas };
};

// ─── Responsive hook ───────────────────────────────────────────
const useScreenSize = () => {
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  });
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setSize(w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return size;
};

// ─── Utility components ────────────────────────────────────────
const Rule = ({ style }) => <div style={{ height: 1, background: C.border, ...style }} />;

const Eyebrow = ({ children, style }) => (
  <div style={{
    fontFamily: 'Geist, sans-serif', fontSize: 10, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: C.textDim, fontWeight: 500, ...style,
  }}>{children}</div>
);

const Sparkline = ({ data, color = C.accent, width = 110, height = 28 }) => {
  if (!data || data.length < 2 || data.every(v => !v)) {
    return <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textFaint, fontSize: 11 }}>—</div>;
  }
  const valid = data.map(v => Number(v) || 0);
  const min = Math.min(...valid), max = Math.max(...valid);
  const range = max - min || 1;
  const points = valid.map((v, i) => `${(i / (valid.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  const areaPath = `M0,${height} L${points.split(' ').join(' L')} L${width},${height} Z`;
  const gradId = `spk-${color.replace('#', '').replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={width} cy={height - ((valid[valid.length - 1] - min) / range) * height} r={2.4} fill={color} />
    </svg>
  );
};

const Delta = ({ value, size = 12 }) => {
  if (value === null || value === undefined || !isFinite(value)) {
    return <span style={{ fontSize: size, color: C.textFaint, fontFamily: 'Geist Mono, monospace' }}>—</span>;
  }
  const positive = value >= 0;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontFamily: 'Geist Mono, monospace', fontSize: size, fontWeight: 500,
      color: positive ? C.positive : C.negative, fontVariantNumeric: 'tabular-nums',
    }}>
      <Arrow size={size + 2} strokeWidth={2.2} />
      {positive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
};

const Field = ({ label, children }) => (
  <label style={{ display: 'block', marginBottom: 16 }}>
    <Eyebrow style={{ marginBottom: 8 }}>{label}</Eyebrow>
    {children}
  </label>
);

const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: C.bg, border: `1px solid ${C.border}`,
  color: C.text, fontFamily: 'Geist, sans-serif', fontSize: 14,
  outline: 'none', borderRadius: 0, boxSizing: 'border-box',
};

const Input = (props) => (
  <input {...props} style={{ ...inputStyle, ...(props.style || {}) }}
    onFocus={e => { e.target.style.borderColor = C.accent; props.onFocus?.(e); }}
    onBlur={e => { e.target.style.borderColor = C.border; props.onBlur?.(e); }} />
);

const Select = ({ children, ...props }) => (
  <select {...props} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', ...(props.style || {}) }}
    onFocus={e => { e.target.style.borderColor = C.accent; props.onFocus?.(e); }}
    onBlur={e => { e.target.style.borderColor = C.border; props.onBlur?.(e); }}>{children}</select>
);

const Button = ({ children, variant = 'primary', ...props }) => {
  const styles = {
    primary: { background: C.accent, color: C.bgDeep, border: `1px solid ${C.accent}` },
    secondary: { background: 'transparent', color: C.text, border: `1px solid ${C.border}` },
  };
  return (
    <button {...props} style={{
      padding: '12px 20px', fontFamily: 'Geist, sans-serif',
      fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
      fontWeight: 600, cursor: 'pointer', borderRadius: 0,
      transition: 'all 0.18s', ...styles[variant], ...(props.style || {}),
    }}>{children}</button>
  );
};

const Modal = ({ open, onClose, title, subtitle, children, width = 480, screen = 'desktop' }) => {
  if (!open) return null;
  const isMobile = screen === 'mobile';
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(2, 2, 2, 0.84)',
      backdropFilter: 'blur(8px)', zIndex: 100,
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      padding: isMobile ? 0 : 20, animation: 'fadeIn 0.18s',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, border: `1px solid ${C.border}`,
        width: '100%', maxWidth: isMobile ? '100%' : width,
        maxHeight: isMobile ? '94vh' : '92vh', overflow: 'auto',
        animation: 'slideUp 0.22s',
      }}>
        <div style={{ padding: isMobile ? '20px 20px 14px' : '24px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: isMobile ? 20 : 24, fontWeight: 600, margin: 0, color: C.text, letterSpacing: '-0.02em' }}>
              {title}
            </h3>
            {subtitle && (
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{subtitle}</div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            padding: 8, color: C.textDim, cursor: 'pointer',
          }}><X size={16} /></button>
        </div>
        <Rule />
        <div style={{ padding: isMobile ? 20 : 28 }}>{children}</div>
      </div>
    </div>
  );
};

const Toast = ({ message, type = 'success', visible }) => {
  if (!visible) return null;
  const Icon = type === 'success' ? Check : AlertCircle;
  return (
    <div style={{
      position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
      background: C.surface, border: `1px solid ${type === 'success' ? C.accent : C.negative}`,
      padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10,
      color: C.text, fontSize: 13, fontFamily: 'Geist, sans-serif',
      zIndex: 200, animation: 'slideUp 0.22s', maxWidth: 'calc(100% - 32px)',
    }}>
      <Icon size={16} color={type === 'success' ? C.accent : C.negative} />
      {message}
    </div>
  );
};

// ─── Format helpers ────────────────────────────────────────────
const fmtValue = (value, type) => {
  if (value === null || value === undefined || value === '' || isNaN(value)) return '—';
  const n = Number(value);
  switch (type) {
    case 'currency': return 'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    case 'percent': return n.toFixed(1) + '%';
    case 'rating': return n.toFixed(1);
    default: return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }
};
const fmtUnit = (type) => ({ currency: 'R$', percent: '%', rating: '★', number: '' }[type] || '');

const monthsPT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const suggestedPeriodLabel = (date) => {
  const d = date instanceof Date ? date : new Date(date + 'T12:00:00');
  return `${monthsPT[d.getMonth()]} ${d.getFullYear()}`;
};

// ─── Health Score ──────────────────────────────────────────────
function calculateHealthScore(barbersWithStats, fields, metas, entries) {
  const components = { growth: 0, metas: 0, rating: 0, consistency: 0 };
  const enabled = fields.filter(f => f.enabled);

  let growthSum = 0, growthCount = 0;
  enabled.slice(0, 4).forEach(f => {
    barbersWithStats.forEach(b => {
      if (b.current?.values[f.id] !== undefined && b.previous?.values[f.id] !== undefined) {
        const prev = Number(b.previous.values[f.id]);
        const curr = Number(b.current.values[f.id]);
        if (prev > 0) { if (curr >= prev) growthSum++; growthCount++; }
      }
    });
  });
  components.growth = growthCount > 0 ? Math.round((growthSum / growthCount) * 30) : 15;

  let metasSum = 0, metasCount = 0;
  Object.entries(metas).forEach(([key, target]) => {
    const [bIdStr, fieldId] = key.split('_');
    const barber = barbersWithStats.find(b => b.id === Number(bIdStr));
    if (barber?.current?.values[fieldId] !== undefined) {
      if (Number(barber.current.values[fieldId]) >= Number(target)) metasSum++;
      metasCount++;
    }
  });
  components.metas = metasCount > 0 ? Math.round((metasSum / metasCount) * 30) : 15;

  if (enabled.find(f => f.id === 'avaliacao')) {
    let rSum = 0, rCount = 0;
    barbersWithStats.forEach(b => {
      if (b.current?.values.avaliacao) { rSum += Number(b.current.values.avaliacao); rCount++; }
    });
    if (rCount > 0) {
      const avg = rSum / rCount;
      components.rating = avg >= 4.7 ? 20 : avg >= 4.3 ? 16 : avg >= 4.0 ? 12 : avg >= 3.5 ? 8 : 4;
    } else components.rating = 10;
  } else components.rating = 10;

  if (entries.length > 0) {
    const latest = Math.max(...entries.map(e => new Date(e.date + 'T12:00:00').getTime()));
    const daysAgo = (Date.now() - latest) / (24 * 3600 * 1000);
    components.consistency = daysAgo <= 7 ? 20 : daysAgo <= 30 ? 15 : daysAgo <= 60 ? 10 : daysAgo <= 90 ? 5 : 0;
  }

  const score = components.growth + components.metas + components.rating + components.consistency;
  return { score: Math.round(score), components };
}

function generateInsights(barbersWithStats, fields, metas, entries, healthScore) {
  const insights = [];
  const primaryField = fields.find(f => f.isPrimary && f.enabled) || fields.find(f => f.enabled);
  if (!primaryField) return insights;

  const growers = barbersWithStats.filter(b => b.primaryChange !== null && b.primaryChange > 0);
  if (growers.length > 0) {
    const top = growers.sort((a, b) => b.primaryChange - a.primaryChange)[0];
    if (top.primaryChange > 8) {
      insights.push({ type: 'positive', icon: TrendingUp, title: `${top.name.split(' ')[0]} em alta`, text: `cresceu ${top.primaryChange.toFixed(0)}% em ${primaryField.label.toLowerCase()} vs período anterior` });
    }
  }

  const decliners = barbersWithStats.filter(b => b.primaryChange !== null && b.primaryChange < 0);
  if (decliners.length > 0) {
    const worst = decliners.sort((a, b) => a.primaryChange - b.primaryChange)[0];
    if (worst.primaryChange < -12) {
      insights.push({ type: 'warning', icon: AlertTriangle, title: `${worst.name.split(' ')[0]} em queda`, text: `${Math.abs(worst.primaryChange).toFixed(0)}% abaixo — vale uma conversa` });
    }
  }

  const smashed = Object.entries(metas).filter(([key, target]) => {
    const [bId, fId] = key.split('_');
    const barber = barbersWithStats.find(b => b.id === Number(bId));
    return barber?.current?.values[fId] !== undefined && Number(barber.current.values[fId]) >= Number(target);
  });
  if (smashed.length > 0) {
    insights.push({ type: 'positive', icon: Award, title: `${smashed.length} meta${smashed.length > 1 ? 's' : ''} batida${smashed.length > 1 ? 's' : ''}`, text: smashed.length === Object.keys(metas).length ? 'todas batidas — celebra' : 'parabenize quem entregou' });
  }

  const missed = Object.entries(metas).filter(([key, target]) => {
    const [bId, fId] = key.split('_');
    const barber = barbersWithStats.find(b => b.id === Number(bId));
    if (barber?.current?.values[fId] !== undefined) return Number(barber.current.values[fId]) < Number(target) * 0.7;
    return false;
  });
  if (missed.length > 0) {
    insights.push({ type: 'warning', icon: Target, title: `${missed.length} meta${missed.length > 1 ? 's' : ''} longe`, text: 'abaixo de 70% — sinaliza ajuste de plano' });
  }

  if (entries.length >= 4) {
    const byPeriod = new Map();
    entries.forEach(e => {
      const v = Number(e.values[primaryField.id]) || 0;
      const cur = byPeriod.get(e.periodLabel) || { date: e.date, total: 0 };
      cur.total += v;
      if (e.date > cur.date) cur.date = e.date;
      byPeriod.set(e.periodLabel, cur);
    });
    const sorted = Array.from(byPeriod.entries()).sort((a, b) => b[1].total - a[1].total);
    if (sorted.length >= 2) {
      const top = sorted[0];
      const latestPeriod = entries.sort((a, b) => b.date.localeCompare(a.date))[0]?.periodLabel;
      if (top[0] === latestPeriod) {
        insights.push({ type: 'positive', icon: Flame, title: `melhor ${primaryField.label.toLowerCase()} histórico`, text: `${latestPeriod} superou todos os meses anteriores` });
      }
    }
  }

  if (entries.length > 0) {
    const latest = Math.max(...entries.map(e => new Date(e.date + 'T12:00:00').getTime()));
    const daysAgo = Math.floor((Date.now() - latest) / (24 * 3600 * 1000));
    if (daysAgo > 14) {
      insights.push({ type: 'info', icon: Clock, title: 'lançamento desatualizado', text: `último foi há ${daysAgo} dias — atualize` });
    }
  }

  return insights.slice(0, 5);
}

// ─── Health Gauge ──────────────────────────────────────────────
function HealthGauge({ score, components, screen }) {
  const isMobile = screen === 'mobile';
  const radius = 78;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const status = score >= 80 ? 'ÓTIMO' : score >= 60 ? 'BOM' : score >= 40 ? 'ATENÇÃO' : 'CRÍTICO';
  const statusColor = score >= 80 ? C.accent : score >= 60 ? C.accent : score >= 40 ? C.warning : C.negative;

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.borderSoft}`,
      padding: isMobile ? '20px 18px' : '28px 32px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${C.borderSoft} 1px, transparent 1px), linear-gradient(90deg, ${C.borderSoft} 1px, transparent 1px)`,
        backgroundSize: '24px 24px', opacity: 0.4, pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 18 : 36,
      }}>
        <div style={{ position: 'relative', width: 200, height: 120, flexShrink: 0, margin: isMobile ? '0 auto' : 0 }}>
          <svg width="200" height="120" viewBox="0 0 200 120" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="healthGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor={C.negative} />
                <stop offset="50%" stopColor={C.warning} />
                <stop offset="100%" stopColor={C.accent} />
              </linearGradient>
            </defs>
            <path d={`M 22 100 A ${radius} ${radius} 0 0 1 178 100`} fill="none" stroke={C.border} strokeWidth={3} strokeLinecap="round" />
            <path d={`M 22 100 A ${radius} ${radius} 0 0 1 178 100`} fill="none" stroke="url(#healthGrad)" strokeWidth={4} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.32, 0.72, 0, 1)' }} />
            {[0, 25, 50, 75, 100].map(t => {
              const angle = Math.PI - (t / 100) * Math.PI;
              const x1 = 100 + Math.cos(angle) * (radius - 6);
              const y1 = 100 - Math.sin(angle) * (radius - 6);
              const x2 = 100 + Math.cos(angle) * (radius - 12);
              const y2 = 100 - Math.sin(angle) * (radius - 12);
              return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.textFaint} strokeWidth={1} />;
            })}
          </svg>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Geist, sans-serif', fontSize: 56, fontWeight: 700,
              lineHeight: 1, color: C.text, letterSpacing: '-0.04em',
              fontVariantNumeric: 'tabular-nums',
            }}>{score}</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: statusColor, marginTop: 4, fontWeight: 600 }}>
              {status}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, width: '100%' }}>
          <Eyebrow style={{ marginBottom: 14 }}>Índice de saúde · BOX04</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
            {[
              { label: 'Crescimento', value: components.growth, max: 30 },
              { label: 'Metas', value: components.metas, max: 30 },
              { label: 'Avaliação', value: components.rating, max: 20 },
              { label: 'Consistência', value: components.consistency, max: 20 },
            ].map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: C.textDim, letterSpacing: '0.04em' }}>{c.label}</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: C.text, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {c.value}<span style={{ color: C.textFaint }}>/{c.max}</span>
                  </span>
                </div>
                <div style={{ height: 2, background: C.bg, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    width: `${(c.value / c.max) * 100}%`,
                    background: c.value / c.max >= 0.7 ? C.accent : c.value / c.max >= 0.4 ? C.warning : C.negative,
                    transition: 'width 1.2s cubic-bezier(0.32, 0.72, 0, 1)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Insights Panel ────────────────────────────────────────────
function InsightsPanel({ insights, screen }) {
  const isMobile = screen === 'mobile';
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.borderSoft}`,
      padding: isMobile ? '20px' : '24px 28px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <Eyebrow>Observações da operação</Eyebrow>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: C.textFaint, letterSpacing: '0.1em' }}>
          AUTO · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
      {insights.length === 0 ? (
        <div style={{ padding: '20px 0', color: C.textDim, fontSize: 13 }}>
          lance pelo menos 2 períodos pra começar a gerar observações automáticas.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {insights.map((ins, i) => {
            const Icon = ins.icon;
            const accentColor = ins.type === 'positive' ? C.accent : ins.type === 'warning' ? C.warning : C.textDim;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, flexShrink: 0,
                  border: `1px solid ${C.border}`,
                  background: ins.type === 'positive' ? `${C.accent}10` : ins.type === 'warning' ? `${C.warning}10` : 'transparent',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon size={13} color={accentColor} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, paddingTop: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 2 }}>{ins.title}</div>
                  <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.4 }}>{ins.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── KPI Entry Form ────────────────────────────────────────────
function KpiEntryForm({ barbers, fields, existingEntry, defaultBarbeiroId, onSave, onCancel, screen }) {
  const isMobile = screen === 'mobile';
  const [barbeiroId, setBarbeiroId] = useState(existingEntry?.barbeiroId || defaultBarbeiroId || barbers[0]?.id || '');
  const [date, setDate] = useState(existingEntry?.date || new Date().toISOString().slice(0, 10));
  const [periodLabel, setPeriodLabel] = useState(existingEntry?.periodLabel || suggestedPeriodLabel(new Date()));
  const [values, setValues] = useState(existingEntry?.values || {});

  const enabledFields = fields.filter(f => f.enabled);
  const updateValue = (id, val) => setValues(v => ({ ...v, [id]: val }));

  useEffect(() => {
    const fat = Number(values.faturamento), att = Number(values.atendimentos), tk = values.ticketMedio;
    if (fat > 0 && att > 0 && (tk === undefined || tk === '' || tk === null)) {
      setValues(v => ({ ...v, ticketMedio: Math.round((fat / att) * 100) / 100 }));
    }
  }, [values.faturamento, values.atendimentos]);

  const submit = () => {
    if (!barbeiroId || !periodLabel.trim()) return;
    const cleaned = {};
    enabledFields.forEach(f => {
      const v = values[f.id];
      if (v !== undefined && v !== '' && v !== null && !isNaN(Number(v))) cleaned[f.id] = Number(v);
    });
    onSave({ id: existingEntry?.id || Date.now(), barbeiroId: Number(barbeiroId), periodLabel: periodLabel.trim(), date, values: cleaned });
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    if (periodLabel === suggestedPeriodLabel(date)) setPeriodLabel(suggestedPeriodLabel(newDate));
  };

  return (
    <div>
      <div style={{ marginBottom: 18, padding: 14, background: C.bg, border: `1px solid ${C.borderSoft}`, fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>
        <strong style={{ color: C.text, fontWeight: 500 }}>Lance um barbeiro por vez.</strong> Escolha o barbeiro, o período (mês de referência) e preencha os números dele. Pra outro barbeiro, salve este e abra um novo lançamento.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Field label="Barbeiro">
          <Select value={barbeiroId} onChange={e => setBarbeiroId(e.target.value)}>
            {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </Field>
        <Field label="Período">
          <Input type="text" value={periodLabel} onChange={e => setPeriodLabel(e.target.value)} placeholder="Ex: Mai 2026" />
        </Field>
      </div>
      <Field label="Data de referência">
        <Input type="date" value={date} onChange={e => handleDateChange(e.target.value)} />
      </Field>

      <Rule style={{ margin: '8px 0 18px' }} />
      <Eyebrow style={{ marginBottom: 14 }}>Indicadores do barbeiro</Eyebrow>

      {enabledFields.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', background: C.bg, border: `1px dashed ${C.border}`, color: C.textDim, fontSize: 13 }}>
          ative pelo menos um indicador em "Indicadores"
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          {enabledFields.map(f => (
            <Field key={f.id} label={`${f.label}${f.type !== 'number' ? ` (${fmtUnit(f.type)})` : ''}`}>
              <Input
                type="number"
                step={f.type === 'currency' || f.type === 'rating' ? '0.01' : '1'}
                min="0" max={f.type === 'rating' ? '5' : undefined}
                value={values[f.id] ?? ''}
                onChange={e => updateValue(f.id, e.target.value)}
                placeholder={f.type === 'rating' ? '4.7' : '0'}
              />
            </Field>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button onClick={submit} disabled={enabledFields.length === 0}>
          {existingEntry ? 'Atualizar' : 'Salvar barbeiro'}
        </Button>
      </div>
    </div>
  );
}

// ─── Barbeiros Manager ─────────────────────────────────────────
function BarbeirosManager({ barbers, onSave, onClose }) {
  const [list, setList] = useState(barbers);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [years, setYears] = useState('');

  const addBarber = () => {
    if (!name.trim()) return;
    const initials = name.trim().split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    setList([...list, { id: Date.now(), name: name.trim(), nickname: nickname.trim() || '—', years: Number(years) || 0, avatar: initials }]);
    setName(''); setNickname(''); setYears('');
  };

  const removeBarber = (id) => {
    if (!confirm('Remover este barbeiro? Os lançamentos antigos ficarão preservados.')) return;
    setList(list.filter(b => b.id !== id));
  };

  return (
    <div>
      {list.length > 0 && (
        <>
          <Eyebrow style={{ marginBottom: 12 }}>Equipe ({list.length})</Eyebrow>
          <div style={{ marginBottom: 24 }}>
            {list.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid ${C.borderSoft}` }}>
                <div style={{ width: 36, height: 36, background: C.surface3, border: `1px solid ${C.border}`, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, color: C.text, letterSpacing: '0.06em', fontFamily: 'Geist Mono, monospace' }}>{b.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: C.textDim }}>{b.nickname}{b.years > 0 ? ` · ${b.years} anos` : ''}</div>
                </div>
                <button onClick={() => removeBarber(b.id)} style={{ background: 'transparent', border: 'none', color: C.textFaint, cursor: 'pointer', padding: 6 }}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </>
      )}

      <Eyebrow style={{ marginBottom: 12 }}>Adicionar</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 14 }}>
        <Input placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 8 }}>
          <Input placeholder="Apelido" value={nickname} onChange={e => setNickname(e.target.value)} />
          <Input placeholder="Anos" type="number" value={years} onChange={e => setYears(e.target.value)} />
        </div>
      </div>
      <Button variant="secondary" onClick={addBarber} style={{ width: '100%' }}>
        <Plus size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Adicionar barbeiro
      </Button>

      <Rule style={{ margin: '24px 0 20px' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave(list)}>Salvar</Button>
      </div>
    </div>
  );
}

function FieldRow({ field, onToggle, onPrimary, onRemove }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${C.borderSoft}` }}>
      <button onClick={onToggle} style={{
        width: 36, height: 22, position: 'relative',
        background: field.enabled ? C.accent : C.surface3,
        border: `1px solid ${field.enabled ? C.accent : C.border}`,
        cursor: 'pointer', transition: 'all 0.18s', flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', top: 1, left: field.enabled ? 16 : 1, width: 18, height: 18, background: field.enabled ? C.bgDeep : C.textDim, transition: 'left 0.18s' }} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: field.enabled ? C.text : C.textDim }}>{field.label}</div>
        <div style={{ fontSize: 11, color: C.textFaint, letterSpacing: '0.04em' }}>
          {field.type === 'currency' ? 'valor (R$)' : field.type === 'percent' ? 'percentual (%)' : field.type === 'rating' ? 'avaliação 0-5' : 'número'}
        </div>
      </div>
      {field.enabled && (
        <button onClick={onPrimary} title={field.isPrimary ? 'Principal' : 'Definir como principal'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: field.isPrimary ? C.accent : C.textFaint }}>
          <Star size={15} fill={field.isPrimary ? C.accent : 'transparent'} strokeWidth={1.5} />
        </button>
      )}
      {onRemove && (
        <button onClick={onRemove} style={{ background: 'transparent', border: 'none', color: C.textFaint, cursor: 'pointer', padding: 6 }}>
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function FieldsManager({ fields, onSave, onClose }) {
  const [list, setList] = useState(fields);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('currency');

  const toggleField = (id) => setList(list.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  const setPrimary = (id) => setList(list.map(f => ({ ...f, isPrimary: f.id === id })));
  const removeCustom = (id) => { if (!confirm('Remover este indicador customizado?')) return; setList(list.filter(f => f.id !== id)); };
  const addCustom = () => {
    if (!newLabel.trim()) return;
    setList([...list, { id: 'custom_' + Date.now(), label: newLabel.trim(), type: newType, enabled: true, isPreset: false }]);
    setNewLabel(''); setNewType('currency');
  };

  return (
    <div>
      <div style={{ marginBottom: 18, padding: 14, background: C.bg, border: `1px solid ${C.borderSoft}`, fontSize: 12, color: C.textDim }}>
        ative os indicadores que você quer acompanhar. o "principal" (★) ordena o ranking e gera tendências.
      </div>

      <Eyebrow style={{ marginBottom: 12 }}>Sugeridos</Eyebrow>
      <div style={{ marginBottom: 24 }}>
        {list.filter(f => f.isPreset).map(f => (
          <FieldRow key={f.id} field={f} onToggle={() => toggleField(f.id)} onPrimary={() => setPrimary(f.id)} />
        ))}
      </div>

      {list.filter(f => !f.isPreset).length > 0 && (
        <>
          <Eyebrow style={{ marginBottom: 12 }}>Personalizados</Eyebrow>
          <div style={{ marginBottom: 24 }}>
            {list.filter(f => !f.isPreset).map(f => (
              <FieldRow key={f.id} field={f} onToggle={() => toggleField(f.id)} onPrimary={() => setPrimary(f.id)} onRemove={() => removeCustom(f.id)} />
            ))}
          </div>
        </>
      )}

      <Eyebrow style={{ marginBottom: 12 }}>Adicionar indicador</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 12 }}>
        <Input placeholder="Nome (ex: Vendas de produto)" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
        <Select value={newType} onChange={e => setNewType(e.target.value)}>
          <option value="currency">Valor (R$)</option>
          <option value="number">Número</option>
          <option value="percent">Percentual (%)</option>
          <option value="rating">Avaliação 0-5</option>
        </Select>
      </div>
      <Button variant="secondary" onClick={addCustom} style={{ width: '100%' }}>
        <Plus size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Adicionar indicador
      </Button>

      <Rule style={{ margin: '24px 0 20px' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave(list)}>Salvar</Button>
      </div>
    </div>
  );
}

function MetasManager({ barbers, fields, metas, onSave, onClose, screen }) {
  const isMobile = screen === 'mobile';
  const [draft, setDraft] = useState(metas);
  const enabledFields = fields.filter(f => f.enabled);

  const setMeta = (bId, fId, value) => {
    const key = `${bId}_${fId}`;
    setDraft(d => {
      const next = { ...d };
      if (value === '' || value === null || value === undefined) delete next[key];
      else next[key] = Number(value);
      return next;
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 18, padding: 14, background: C.bg, border: `1px solid ${C.borderSoft}`, fontSize: 12, color: C.textDim }}>
        defina alvos por barbeiro pra cada indicador. deixe em branco quando não tiver meta.
      </div>

      {barbers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: C.textFaint }}>adicione barbeiros primeiro</div>
      ) : enabledFields.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: C.textFaint }}>ative pelo menos um indicador</div>
      ) : (
        barbers.map(b => (
          <div key={b.id} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, background: C.surface3, border: `1px solid ${C.border}`, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 600, color: C.text, letterSpacing: '0.06em', fontFamily: 'Geist Mono, monospace' }}>{b.avatar}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{b.name}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              {enabledFields.map(f => (
                <div key={f.id}>
                  <Eyebrow style={{ marginBottom: 6, fontSize: 9 }}>{f.label} {fmtUnit(f.type) && `· ${fmtUnit(f.type)}`}</Eyebrow>
                  <Input type="number" step="0.01" min="0" value={draft[`${b.id}_${f.id}`] ?? ''} onChange={e => setMeta(b.id, f.id, e.target.value)} placeholder="—" />
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <Rule style={{ margin: '8px 0 20px' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave(draft)}>Salvar metas</Button>
      </div>
    </div>
  );
}

function History({ entries, barbers, fields, onDelete, onEdit, onClose, screen }) {
  const isMobile = screen === 'mobile';
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const barberName = (id) => barbers.find(b => b.id === id)?.name || '—';
  const primary = fields.find(f => f.isPrimary && f.enabled) || fields.find(f => f.enabled);

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 12, color: C.textDim }}>
        {sorted.length} {sorted.length === 1 ? 'lançamento' : 'lançamentos'}
      </div>
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textFaint }}>nenhum lançamento ainda</div>
      ) : (
        <div style={{ maxHeight: 460, overflow: 'auto', margin: isMobile ? '0 -20px' : '0 -28px' }}>
          {sorted.map(e => (
            <div key={e.id} style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr auto auto' : '110px 1fr auto auto auto',
              gap: 12, alignItems: 'center',
              padding: isMobile ? '14px 20px' : '14px 28px',
              borderBottom: `1px solid ${C.borderSoft}`,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isMobile ? barberName(e.barbeiroId) : e.periodLabel}
                </div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: C.textFaint, marginTop: 2 }}>
                  {isMobile ? `${e.periodLabel} · ${new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}` :
                    new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                </div>
              </div>
              {!isMobile && <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{barberName(e.barbeiroId)}</div>}
              {!isMobile && <div style={{ fontSize: 11, color: C.textDim, textAlign: 'right' }}>{Object.keys(e.values).length} campos</div>}
              <div style={{ fontFamily: 'Geist Mono, monospace', fontVariantNumeric: 'tabular-nums', fontSize: 13, color: C.text, fontWeight: 500, textAlign: 'right', minWidth: 80 }}>
                {primary ? fmtValue(e.values[primary.id], primary.type) : '—'}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => onEdit(e)} style={{ background: 'transparent', border: 'none', color: C.textDim, cursor: 'pointer', padding: 4 }}><Sliders size={13} /></button>
                <button onClick={() => onDelete(e.id)} style={{ background: 'transparent', border: 'none', color: C.textFaint, cursor: 'pointer', padding: 4 }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Rule style={{ margin: '20px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}

function BoxLogo({ size = 48 }) {
  return (
    <div style={{
      width: size, height: size,
      background: C.bgDeep, border: `1.5px solid ${C.accent}`,
      display: 'grid', placeItems: 'center', position: 'relative',
      boxShadow: `0 0 0 1px ${C.accentDarker}, 0 0 24px ${C.accentGlow}`,
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'Geist, sans-serif', fontSize: size * 0.42,
        fontWeight: 700, color: C.accent, letterSpacing: '-0.04em',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>04</span>
      <div style={{ position: 'absolute', top: 2, left: 2, width: 4, height: 4, background: C.accent }} />
      <div style={{ position: 'absolute', top: 2, right: 2, width: 4, height: 4, background: C.accent }} />
      <div style={{ position: 'absolute', bottom: 2, left: 2, width: 4, height: 4, background: C.accent }} />
      <div style={{ position: 'absolute', bottom: 2, right: 2, width: 4, height: 4, background: C.accent }} />
    </div>
  );
}

function Onboarding({ onAddFirst, onLoadDemo, screen }) {
  const isMobile = screen === 'mobile';
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.borderSoft}`,
      padding: isMobile ? '40px 24px' : '60px 40px',
      textAlign: 'center', marginBottom: 28,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${C.borderSoft} 1px, transparent 1px), linear-gradient(90deg, ${C.borderSoft} 1px, transparent 1px)`,
        backgroundSize: '32px 32px', opacity: 0.5, pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'inline-block', marginBottom: 24 }}>
          <BoxLogo size={isMobile ? 56 : 64} />
        </div>
        <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: isMobile ? 28 : 36, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.03em' }}>
          BOX<span style={{ color: C.accent }}>04</span> Manager
        </h2>
        <p style={{ fontSize: isMobile ? 13 : 14, color: C.textDim, margin: '0 0 32px' }}>
          adicione seu primeiro barbeiro pra ativar a operação
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Button onClick={onAddFirst}>
            <Plus size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Adicionar barbeiro
          </Button>
          <Button variant="secondary" onClick={onLoadDemo}>Carregar demonstração</Button>
        </div>
      </div>
    </div>
  );
}

function exportCSV(entries, barbers, fields) {
  const barberName = (id) => barbers.find(b => b.id === id)?.name || '';
  const enabledFields = fields.filter(f => f.enabled);
  const header = ['Periodo', 'Data', 'Barbeiro', ...enabledFields.map(f => f.label)];
  const rows = [header, ...entries.map(e => [e.periodLabel, e.date, barberName(e.barbeiroId), ...enabledFields.map(f => e.values[f.id] ?? '')])];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `box04-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const aggregateField = (entries, fieldId, type) => {
  const vals = entries.map(e => e.values[fieldId]).filter(v => v !== undefined && v !== null && !isNaN(v)).map(Number);
  if (vals.length === 0) return null;
  if (type === 'currency' || type === 'number') return vals.reduce((s, v) => s + v, 0);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
};

// ─── Main App ──────────────────────────────────────────────────
export default function App() {
  const screen = useScreenSize();
  const isMobile = screen === 'mobile';
  const isTablet = screen === 'tablet';
  const isCompact = screen !== 'desktop';

  const [barbers, setBarbers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [fields, setFields] = useState(PRESET_FIELDS);
  const [metas, setMetas] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('latest');
  const [selectedId, setSelectedId] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showBarbeirosModal, setShowBarbeirosModal] = useState(false);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [showMetasModal, setShowMetasModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fontId = 'box04-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId; link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap';
      document.head.appendChild(link);
    }
    const styleId = 'box04-style';
    if (!document.getElementById(styleId)) {
      const s = document.createElement('style');
      s.id = styleId;
      s.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        select { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M3 5 L6 8 L9 5' stroke='%238B8B8B' stroke-width='1.4' fill='none'/></svg>"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px !important; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.accentDeep}; }
        body { -webkit-tap-highlight-color: transparent; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const [b, e, f, m] = await Promise.all([Storage.getBarbers(), Storage.getEntries(), Storage.getFields(), Storage.getMetas()]);
      setBarbers(b); setEntries(e);
      setFields(f && f.length > 0 ? f : PRESET_FIELDS);
      setMetas(m || {});
      if (b.length > 0) setSelectedId(b[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { if (!loading) Storage.setBarbers(barbers); }, [barbers, loading]);
  useEffect(() => { if (!loading) Storage.setEntries(entries); }, [entries, loading]);
  useEffect(() => { if (!loading) Storage.setFields(fields); }, [fields, loading]);
  useEffect(() => { if (!loading) Storage.setMetas(metas); }, [metas, loading]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2400);
  };

  const periods = useMemo(() => {
    const map = new Map();
    entries.forEach(e => {
      if (!map.has(e.periodLabel) || map.get(e.periodLabel) < e.date) map.set(e.periodLabel, e.date);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].localeCompare(a[1])).map(([label]) => label);
  }, [entries]);

  const primaryField = fields.find(f => f.isPrimary && f.enabled) || fields.find(f => f.enabled) || fields[0];

  const getCurrentEntry = (bId) => {
    const myEntries = entries.filter(e => e.barbeiroId === bId).sort((a, b) => b.date.localeCompare(a.date));
    if (selectedPeriod === 'latest') return myEntries[0] || null;
    return myEntries.find(e => e.periodLabel === selectedPeriod) || null;
  };

  const getPreviousEntry = (bId, current) => {
    if (!current) return null;
    return entries.filter(e => e.barbeiroId === bId && e.date < current.date).sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  };

  const barbersWithStats = useMemo(() => {
    return barbers.map(b => {
      const current = getCurrentEntry(b.id);
      const previous = current ? getPreviousEntry(b.id, current) : null;
      const trend = entries.filter(e => e.barbeiroId === b.id).sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
      const primaryValue = current && primaryField ? Number(current.values[primaryField.id]) || 0 : 0;
      const prevPrimaryValue = previous && primaryField ? Number(previous.values[primaryField.id]) || 0 : 0;
      const primaryChange = prevPrimaryValue > 0 ? ((primaryValue - prevPrimaryValue) / prevPrimaryValue) * 100 : null;
      return { ...b, current, previous, trend, primaryValue, primaryChange, sparkData: trend.map(e => primaryField ? Number(e.values[primaryField.id]) || 0 : 0) };
    }).sort((a, b) => b.primaryValue - a.primaryValue);
  }, [barbers, entries, selectedPeriod, primaryField]);

  const selected = barbersWithStats.find(b => b.id === selectedId) || barbersWithStats[0];

  const teamTotals = useMemo(() => {
    const enabled = fields.filter(f => f.enabled);
    const result = {};
    enabled.forEach(f => {
      const cur = aggregateField(barbersWithStats.map(b => b.current).filter(Boolean), f.id, f.type);
      const prev = aggregateField(barbersWithStats.map(b => b.previous).filter(Boolean), f.id, f.type);
      result[f.id] = { current: cur, previous: prev, change: prev !== null && prev > 0 ? ((cur - prev) / prev) * 100 : null };
    });
    return result;
  }, [barbersWithStats, fields]);

  const healthScore = useMemo(() => calculateHealthScore(barbersWithStats, fields, metas, entries), [barbersWithStats, fields, metas, entries]);
  const insights = useMemo(() => generateInsights(barbersWithStats, fields, metas, entries, healthScore), [barbersWithStats, fields, metas, entries, healthScore]);

  const handleSaveEntry = (entry) => {
    setEntries(prev => {
      const filtered = prev.filter(e => !(e.barbeiroId === entry.barbeiroId && e.periodLabel === entry.periodLabel));
      return [...filtered, entry];
    });
    setShowEntryModal(false); setEditingEntry(null);
    showToast(editingEntry ? 'Lançamento atualizado' : 'Lançamento registrado');
  };

  const handleSaveBarbers = (newList) => {
    setBarbers(newList); setShowBarbeirosModal(false);
    if (selectedId && !newList.find(b => b.id === selectedId)) setSelectedId(newList[0]?.id || null);
    else if (!selectedId && newList.length > 0) setSelectedId(newList[0].id);
    showToast('Equipe atualizada');
  };

  const handleSaveFields = (newFields) => { setFields(newFields); setShowFieldsModal(false); showToast('Indicadores atualizados'); };
  const handleSaveMetas = (newMetas) => { setMetas(newMetas); setShowMetasModal(false); showToast('Metas salvas'); };
  const handleDeleteEntry = (id) => { if (!confirm('Excluir este lançamento?')) return; setEntries(entries.filter(e => e.id !== id)); showToast('Lançamento removido'); };
  const handleEditEntry = (entry) => { setEditingEntry(entry); setShowHistoryModal(false); setShowEntryModal(true); };
  const handleLoadDemo = () => {
    const { barbers: b, entries: e, metas: m } = seedDemo();
    setBarbers(b); setEntries(e); setMetas(m); setSelectedId(b[0].id);
    showToast('Demonstração carregada');
  };

  const display = { fontFamily: 'Geist, sans-serif' };
  const mono = { fontFamily: 'Geist Mono, monospace', fontVariantNumeric: 'tabular-nums' };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', color: C.textDim, fontFamily: 'Geist Mono, monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        BOX04 · carregando…
      </div>
    );
  }

  // Responsive values
  const containerPadding = isMobile ? '20px 16px 100px' : isTablet ? '28px 24px 90px' : '32px 40px 100px';
  const sectionGap = isMobile ? 16 : 28;
  const cardPadding = isMobile ? 20 : 28;

  const baseStyle = {
    fontFamily: 'Geist, sans-serif', color: C.text,
    background: `radial-gradient(ellipse at top, ${C.bg} 0%, ${C.bgDeep} 70%)`,
    minHeight: '100vh',
  };

  const enabledFields = fields.filter(f => f.enabled);
  const topKpisCount = isMobile ? Math.min(enabledFields.length, 2) : Math.min(enabledFields.length, 4);
  const topKpis = enabledFields.slice(0, topKpisCount);

  return (
    <div style={baseStyle}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(${C.borderSoft} 1px, transparent 1px), linear-gradient(90deg, ${C.borderSoft} 1px, transparent 1px)`,
        backgroundSize: '48px 48px', opacity: 0.18,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1380, margin: '0 auto', padding: containerPadding }}>

        {/* Header */}
        <header style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 16 : 24,
          marginBottom: isMobile ? 20 : 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
            <BoxLogo size={isMobile ? 44 : 52} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{
                ...display, fontWeight: 700,
                fontSize: isMobile ? 22 : 32,
                lineHeight: 1, letterSpacing: '-0.03em', margin: 0,
              }}>
                BOX<span style={{ color: C.accent }}>04</span>
                <span style={{ color: C.textDim, fontWeight: 300, marginLeft: 8, fontSize: isMobile ? 16 : 'inherit' }}>Manager</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ width: 6, height: 6, background: C.accent, animation: 'pulseGlow 2s infinite' }} />
                <span style={{ ...mono, fontSize: 9, letterSpacing: '0.2em', color: C.textDim, textTransform: 'uppercase' }}>
                  {isMobile ? 'ATIVO' : 'OPERAÇÃO ATIVA'} · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'space-between' : 'flex-end',
          }}>
            {periods.length > 0 && (
              <Select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} style={{
                background: C.surface, border: `1px solid ${C.borderSoft}`,
                padding: '9px 32px 9px 14px', fontSize: 11, letterSpacing: '0.12em',
                textTransform: 'uppercase', fontWeight: 600, color: C.text,
                width: isMobile ? '100%' : 'auto',
                minWidth: isMobile ? 0 : 180, flex: isMobile ? 1 : 'initial',
                fontFamily: 'Geist, sans-serif',
              }}>
                <option value="latest">Último período</option>
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              {barbers.length > 0 && (
                <button onClick={() => setShowHistoryModal(true)} title="Histórico" style={{
                  width: 40, height: 40, background: C.surface, border: `1px solid ${C.borderSoft}`,
                  display: 'grid', placeItems: 'center', cursor: 'pointer', color: C.textDim,
                }}><Clock size={16} /></button>
              )}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowSettingsMenu(!showSettingsMenu)} title="Configurações" style={{
                  width: 40, height: 40, background: C.surface, border: `1px solid ${C.borderSoft}`,
                  display: 'grid', placeItems: 'center', cursor: 'pointer', color: C.textDim,
                }}><Settings size={16} /></button>
                {showSettingsMenu && (
                  <>
                    <div onClick={() => setShowSettingsMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                    <div style={{
                      position: 'absolute', top: 48, right: 0, zIndex: 31,
                      background: C.surface, border: `1px solid ${C.border}`,
                      minWidth: 220, animation: 'slideUp 0.15s',
                    }}>
                      {[
                        { icon: Users, label: 'Equipe', action: () => { setShowBarbeirosModal(true); setShowSettingsMenu(false); } },
                        { icon: Sliders, label: 'Indicadores', action: () => { setShowFieldsModal(true); setShowSettingsMenu(false); } },
                        { icon: Target, label: 'Metas', action: () => { setShowMetasModal(true); setShowSettingsMenu(false); } },
                        { icon: Download, label: 'Exportar CSV', action: () => { exportCSV(entries, barbers, fields); setShowSettingsMenu(false); }, disabled: entries.length === 0 },
                      ].map((item, i) => (
                        <button key={i} onClick={item.action} disabled={item.disabled} style={{
                          width: '100%', padding: '12px 16px', background: 'transparent',
                          border: 'none', borderBottom: i < 3 ? `1px solid ${C.borderSoft}` : 'none',
                          display: 'flex', alignItems: 'center', gap: 12, cursor: item.disabled ? 'default' : 'pointer',
                          color: item.disabled ? C.textFaint : C.text, fontSize: 13,
                          textAlign: 'left', fontFamily: 'Geist, sans-serif',
                          opacity: item.disabled ? 0.5 : 1,
                        }}>
                          <item.icon size={14} color={C.textDim} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {barbers.length === 0 ? (
          <Onboarding onAddFirst={() => setShowBarbeirosModal(true)} onLoadDemo={handleLoadDemo} screen={screen} />
        ) : entries.length === 0 ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.borderSoft}`,
            padding: isMobile ? '40px 24px' : '50px 40px', textAlign: 'center', marginBottom: 28,
          }}>
            <Activity size={32} color={C.accent} strokeWidth={1.5} style={{ margin: '0 auto 18px', display: 'block' }} />
            <h2 style={{ ...display, fontSize: isMobile ? 22 : 28, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Lance o primeiro período
            </h2>
            <p style={{ fontSize: 13, color: C.textDim, margin: '0 0 24px' }}>
              entre os números de cada barbeiro pra ativar o painel
            </p>
            <Button onClick={() => setShowEntryModal(true)}>Lançar KPIs</Button>
          </div>
        ) : (
          <>
            {/* Hero: Health Score + Insights */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: isCompact ? '1fr' : '1.4fr 1fr',
              gap: sectionGap,
              marginBottom: sectionGap,
            }}>
              <HealthGauge score={healthScore.score} components={healthScore.components} screen={screen} />
              <InsightsPanel insights={insights} screen={screen} />
            </section>

            {/* KPI Row */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${topKpisCount}, 1fr)`,
              background: C.surface, border: `1px solid ${C.borderSoft}`,
              marginBottom: sectionGap,
            }}>
              {topKpis.map((f, i) => {
                const t = teamTotals[f.id];
                const isAvg = f.type === 'percent' || f.type === 'rating';
                return (
                  <div key={f.id} style={{
                    padding: isMobile ? '20px' : '24px 28px',
                    borderRight: i < topKpis.length - 1 && (isMobile ? (i + 1) % 2 !== 0 : true) ? `1px solid ${C.borderSoft}` : 'none',
                    borderBottom: isMobile && i < topKpis.length - 2 ? `1px solid ${C.borderSoft}` : 'none',
                  }}>
                    <Eyebrow style={{ marginBottom: 14, fontSize: isMobile ? 9 : 10 }}>{f.label}{isAvg ? ' · MÉDIA' : ''}</Eyebrow>
                    <div style={{
                      ...mono, fontSize: isMobile ? 24 : 32, lineHeight: 1, fontWeight: 600,
                      color: C.text, letterSpacing: '-0.025em',
                      display: 'flex', alignItems: 'baseline', gap: 6,
                    }}>
                      {fmtValue(t?.current, f.type)}
                      {f.type === 'rating' && t?.current && <Star size={isMobile ? 12 : 14} fill={C.accent} color={C.accent} strokeWidth={0} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      <Delta value={t?.change} size={11} />
                      <span style={{ fontSize: 10, color: C.textFaint, letterSpacing: '0.04em' }}>vs. anterior</span>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Main Grid */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: isCompact ? '1fr' : '1.05fr 1.4fr',
              gap: sectionGap, marginBottom: sectionGap,
            }}>
              {/* Ranking */}
              <div style={{ background: C.surface, border: `1px solid ${C.borderSoft}`, padding: '20px 0' }}>
                <div style={{ padding: `0 ${isMobile ? 20 : 28}px 16px`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Eyebrow>Ranking · equipe</Eyebrow>
                  <span style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.04em' }}>
                    por {primaryField?.label.toLowerCase() || '—'}
                  </span>
                </div>
                <Rule />
                {barbersWithStats.map((b, i) => {
                  const isSelected = b.id === selectedId;
                  return (
                    <button key={b.id} onClick={() => setSelectedId(b.id)} style={{
                      width: '100%', textAlign: 'left',
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '40px 38px 1fr auto' : '50px 44px 1fr auto auto',
                      alignItems: 'center', gap: isMobile ? 12 : 16,
                      padding: isMobile ? '16px 20px' : '18px 28px',
                      background: isSelected ? C.surface2 : 'transparent',
                      borderLeft: `3px solid ${isSelected ? C.accent : 'transparent'}`,
                      borderTop: 'none', borderRight: 'none',
                      borderBottom: i < barbersWithStats.length - 1 ? `1px solid ${C.borderSoft}` : 'none',
                      cursor: 'pointer', transition: 'background 0.18s',
                      fontFamily: 'Geist, sans-serif', color: 'inherit',
                    }}>
                      <span style={{ ...mono, fontSize: isMobile ? 20 : 24, fontWeight: 300, color: isSelected ? C.accent : C.textFaint, letterSpacing: '-0.04em' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div style={{
                        width: isMobile ? 38 : 44, height: isMobile ? 38 : 44,
                        background: isSelected ? `${C.accent}15` : C.surface3,
                        border: `1px solid ${i === 0 && b.primaryValue > 0 ? C.accent : C.border}`,
                        display: 'grid', placeItems: 'center',
                        fontSize: isMobile ? 11 : 13, fontWeight: 600, letterSpacing: '0.04em',
                        color: i === 0 && b.primaryValue > 0 ? C.accent : C.text,
                        ...mono,
                      }}>{b.avatar}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.name}
                        </div>
                        <div style={{ fontSize: 11, color: C.textDim }}>
                          {b.nickname}{!isMobile && b.years > 0 ? ` · ${b.years} anos` : ''}
                        </div>
                      </div>
                      {!isMobile && <Sparkline data={b.sparkData} color={isSelected ? C.accent : C.accentDeep} width={80} height={24} />}
                      <div style={{ textAlign: 'right', minWidth: isMobile ? 80 : 100 }}>
                        <div style={{ ...mono, fontSize: isMobile ? 13 : 14, fontWeight: 600, color: C.text }}>
                          {fmtValue(b.primaryValue, primaryField?.type)}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <Delta value={b.primaryChange} size={10} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Detail Panel */}
              {selected && (
                <div style={{ background: C.surface, border: `1px solid ${C.borderSoft}`, padding: cardPadding, display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Eyebrow style={{ marginBottom: 10 }}>Profissional em destaque</Eyebrow>
                      <h2 style={{
                        ...display, fontSize: isMobile ? 26 : 36, fontWeight: 700,
                        lineHeight: 1, letterSpacing: '-0.03em', margin: 0, color: C.text,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {selected.name}
                      </h2>
                      <div style={{ fontSize: isMobile ? 12 : 14, color: C.accent, marginTop: 6 }}>
                        "{selected.nickname}"{selected.years > 0 ? ` · ${selected.years} anos de ofício` : ''}
                      </div>
                    </div>
                    {barbersWithStats[0]?.id === selected.id && selected.primaryValue > 0 && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px',
                        border: `1px solid ${C.accent}`, color: C.accent,
                        background: C.accentGlow,
                        fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600,
                        ...mono, flexShrink: 0,
                      }}><Award size={10} /> Líder</div>
                    )}
                  </div>
                  <Rule />

                  {selected.current ? (
                    <>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                          <Eyebrow>{selected.current.periodLabel}</Eyebrow>
                          <button onClick={() => handleEditEntry(selected.current)} style={{
                            background: 'transparent', border: 'none', color: C.textDim,
                            cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em',
                            textTransform: 'uppercase', fontFamily: 'Geist, sans-serif',
                          }}>editar</button>
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${isMobile ? 2 : Math.min(enabledFields.length, 4)}, 1fr)`,
                          gap: 0,
                        }}>
                          {enabledFields.slice(0, 8).map((f, i) => {
                            const cur = selected.current.values[f.id];
                            const prev = selected.previous?.values[f.id];
                            const change = prev !== undefined && prev > 0 ? ((cur - prev) / prev) * 100 : null;
                            const meta = metas[`${selected.id}_${f.id}`];
                            const metaProgress = meta && cur !== undefined ? (cur / meta) * 100 : null;
                            const colsPerRow = isMobile ? 2 : Math.min(enabledFields.length, 4);
                            const isLastInRow = (i + 1) % colsPerRow === 0;
                            const isFirstInRow = i % colsPerRow === 0;
                            const totalRows = Math.ceil(enabledFields.slice(0, 8).length / colsPerRow);
                            const currentRow = Math.floor(i / colsPerRow);
                            const isLastRow = currentRow === totalRows - 1;
                            return (
                              <div key={f.id} style={{
                                paddingRight: isLastInRow ? 0 : 12,
                                paddingLeft: isFirstInRow ? 0 : 12,
                                paddingBottom: isLastRow ? 0 : 16,
                                paddingTop: currentRow > 0 ? 16 : 0,
                                borderRight: !isLastInRow ? `1px solid ${C.borderSoft}` : 'none',
                                borderTop: currentRow > 0 ? `1px solid ${C.borderSoft}` : 'none',
                              }}>
                                <Eyebrow style={{ marginBottom: 8, fontSize: 9 }}>{f.label}</Eyebrow>
                                <div style={{
                                  ...mono, fontSize: isMobile ? 18 : 22, fontWeight: 600,
                                  lineHeight: 1, color: C.text, letterSpacing: '-0.02em',
                                  display: 'flex', alignItems: 'baseline', gap: 4,
                                }}>
                                  {fmtValue(cur, f.type)}
                                  {f.type === 'rating' && cur && <Star size={11} fill={C.accent} color={C.accent} strokeWidth={0} />}
                                </div>
                                <div style={{ marginTop: 6 }}>
                                  <Delta value={change} size={10} />
                                </div>
                                {metaProgress !== null && (
                                  <div style={{ marginTop: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                      <span style={{ ...mono, fontSize: 9, color: C.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>meta</span>
                                      <span style={{ ...mono, fontSize: 9, color: metaProgress >= 100 ? C.accent : C.textDim, fontWeight: 600 }}>
                                        {Math.round(metaProgress)}%
                                      </span>
                                    </div>
                                    <div style={{ height: 2, background: C.bg, position: 'relative' }}>
                                      <div style={{ position: 'absolute', inset: 0, width: `${Math.min(metaProgress, 100)}%`, background: metaProgress >= 100 ? C.accent : C.accentDeep, transition: 'width 0.4s' }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {selected.trend.length >= 2 && primaryField && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                            <Eyebrow>Evolução · {primaryField.label.toLowerCase()}</Eyebrow>
                            <span style={{ ...mono, fontSize: 10, color: C.textFaint, letterSpacing: '0.08em' }}>
                              {selected.trend.length} {selected.trend.length === 1 ? 'PERÍODO' : 'PERÍODOS'}
                            </span>
                          </div>
                          <div style={{ height: isMobile ? 110 : 130 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={selected.trend.map(e => ({ p: e.periodLabel, v: Number(e.values[primaryField.id]) || 0 }))} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor={C.accent} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="p" axisLine={false} tickLine={false} tick={{ fill: C.textFaint, fontSize: 10, fontFamily: 'Geist Mono, monospace' }} />
                                <YAxis hide />
                                <Tooltip
                                  contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 0, fontSize: 12, color: C.text, fontFamily: 'Geist, sans-serif' }}
                                  labelStyle={{ color: C.textDim, fontSize: 10, letterSpacing: '0.1em', fontFamily: 'Geist Mono, monospace' }}
                                  formatter={(v) => [fmtValue(v, primaryField.type), primaryField.label]}
                                />
                                <Area type="monotone" dataKey="v" stroke={C.accent} strokeWidth={1.8} fill="url(#trendFill)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: 30, textAlign: 'center', background: C.bg, border: `1px dashed ${C.border}` }}>
                      <span style={{ fontSize: 14, color: C.textDim }}>
                        sem lançamento {selectedPeriod !== 'latest' ? `em ${selectedPeriod}` : 'ainda'}
                      </span>
                      <div style={{ marginTop: 18 }}>
                        <Button variant="secondary" onClick={() => { setEditingEntry(null); setShowEntryModal(true); }}>
                          Lançar agora
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Bottom Row */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: isCompact ? '1fr' : '1.4fr 1fr',
              gap: sectionGap,
            }}>
              <div style={{ background: C.surface, border: `1px solid ${C.borderSoft}`, padding: cardPadding }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <Eyebrow>Evolução · estabelecimento</Eyebrow>
                  <span style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.04em' }}>
                    {primaryField?.label.toLowerCase() || '—'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: C.textFaint, marginBottom: 18 }}>como a casa vem performando</div>
                {(() => {
                  const byPeriod = new Map();
                  entries.forEach(e => {
                    const v = Number(e.values[primaryField?.id]) || 0;
                    if (!byPeriod.has(e.periodLabel)) byPeriod.set(e.periodLabel, { period: e.periodLabel, date: e.date, total: 0 });
                    const cur = byPeriod.get(e.periodLabel);
                    cur.total += v;
                    if (e.date > cur.date) cur.date = e.date;
                  });
                  const data = Array.from(byPeriod.values()).sort((a, b) => a.date.localeCompare(b.date));
                  if (data.length < 2) {
                    return (
                      <div style={{ padding: 30, textAlign: 'center', background: C.bg, border: `1px dashed ${C.border}` }}>
                        <div style={{ fontSize: 13, color: C.textDim }}>aparece com pelo menos 2 períodos lançados</div>
                      </div>
                    );
                  }
                  return (
                    <div style={{ height: isMobile ? 160 : 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="teamFill" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor={C.accent} stopOpacity={0.45} />
                              <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: C.textFaint, fontSize: 10, fontFamily: 'Geist Mono, monospace' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: C.textFaint, fontSize: 10, fontFamily: 'Geist Mono, monospace' }} width={42}
                            tickFormatter={v => primaryField?.type === 'currency' ? 'R$' + (v / 1000).toFixed(0) + 'k' : v.toLocaleString('pt-BR')} />
                          <Tooltip
                            contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 0, fontSize: 12, color: C.text }}
                            labelStyle={{ color: C.textDim, fontSize: 10, letterSpacing: '0.1em' }}
                            formatter={(v) => [fmtValue(v, primaryField?.type), primaryField?.label]}
                          />
                          <Area type="monotone" dataKey="total" stroke={C.accent} strokeWidth={2} fill="url(#teamFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </div>

              <div style={{ background: C.surface, border: `1px solid ${C.borderSoft}`, padding: cardPadding }}>
                <Eyebrow style={{ marginBottom: 6 }}>Comparativo · {primaryField?.label.toLowerCase()}</Eyebrow>
                <div style={{ fontSize: 13, color: C.textFaint, marginBottom: 22 }}>ranking visual</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {barbersWithStats.map((b) => {
                    const max = Math.max(...barbersWithStats.map(x => x.primaryValue), 1);
                    const w = (b.primaryValue / max) * 100;
                    const isSel = b.id === selectedId;
                    return (
                      <div key={b.id} onClick={() => setSelectedId(b.id)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: isSel ? 500 : 400, color: isSel ? C.text : C.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.name}
                          </span>
                          <span style={{ ...mono, fontSize: 13, color: isSel ? C.accent : C.text, fontWeight: 500, flexShrink: 0 }}>
                            {fmtValue(b.primaryValue, primaryField?.type)}
                          </span>
                        </div>
                        <div style={{ height: 4, background: C.bg, position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: 0, width: `${w}%`, background: isSel ? C.accent : C.accentDeep, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        <footer style={{
          marginTop: isMobile ? 24 : 40, paddingTop: 20,
          borderTop: `1px solid ${C.borderSoft}`,
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ ...mono, fontSize: 9, color: C.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {entries.length} REGISTROS · DADOS SALVOS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ ...mono, fontSize: 9, letterSpacing: '0.2em', color: C.textFaint, textTransform: 'uppercase' }}>BOX04</span>
            <div style={{ width: 20, height: 1, background: C.accent }} />
            <span style={{ ...mono, fontSize: 9, color: C.accent, letterSpacing: '0.18em' }}>v1.0 · 2026</span>
          </div>
        </footer>
      </div>

      {barbers.length > 0 && (
        <button onClick={() => { setEditingEntry(null); setShowEntryModal(true); }} style={{
          position: 'fixed',
          bottom: isMobile ? 20 : 30,
          right: isMobile ? 20 : 30, zIndex: 50,
          width: isMobile ? 56 : 60, height: isMobile ? 56 : 60,
          background: C.accent, border: `1px solid ${C.accent}`,
          boxShadow: `0 8px 24px rgba(212, 216, 221, 0.25), 0 2px 6px rgba(0,0,0,0.4)`,
          cursor: 'pointer', display: 'grid', placeItems: 'center',
          color: C.bgDeep, transition: 'transform 0.18s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Lançar KPIs"
        ><Plus size={24} strokeWidth={2.4} /></button>
      )}

      <Modal open={showEntryModal} onClose={() => { setShowEntryModal(false); setEditingEntry(null); }}
        title={editingEntry ? 'Editar lançamento' : 'Lançar KPIs'}
        subtitle={editingEntry ? 'ajuste os números desse período' : 'um barbeiro por vez'}
        width={560} screen={screen}>
        <KpiEntryForm
          barbers={barbers} fields={fields} existingEntry={editingEntry}
          defaultBarbeiroId={selectedId} screen={screen}
          onSave={handleSaveEntry}
          onCancel={() => { setShowEntryModal(false); setEditingEntry(null); }}
        />
      </Modal>

      <Modal open={showBarbeirosModal} onClose={() => setShowBarbeirosModal(false)}
        title="Equipe" subtitle="adicione, edite ou remova barbeiros" width={560} screen={screen}>
        <BarbeirosManager barbers={barbers} onSave={handleSaveBarbers} onClose={() => setShowBarbeirosModal(false)} />
      </Modal>

      <Modal open={showFieldsModal} onClose={() => setShowFieldsModal(false)}
        title="Indicadores" subtitle="escolha o que quer acompanhar" width={560} screen={screen}>
        <FieldsManager fields={fields} onSave={handleSaveFields} onClose={() => setShowFieldsModal(false)} />
      </Modal>

      <Modal open={showMetasModal} onClose={() => setShowMetasModal(false)}
        title="Metas" subtitle="alvos por barbeiro pra cada indicador" width={620} screen={screen}>
        <MetasManager barbers={barbers} fields={fields} metas={metas}
          onSave={handleSaveMetas} onClose={() => setShowMetasModal(false)} screen={screen} />
      </Modal>

      <Modal open={showHistoryModal} onClose={() => setShowHistoryModal(false)}
        title="Histórico" subtitle="todos os períodos lançados" width={680} screen={screen}>
        <History entries={entries} barbers={barbers} fields={fields}
          onDelete={handleDeleteEntry} onEdit={handleEditEntry}
          onClose={() => setShowHistoryModal(false)} screen={screen} />
      </Modal>

      <Toast message={toast?.message} type={toast?.type} visible={!!toast} />
    </div>
  );
}
