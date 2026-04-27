import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  AlertTriangle, Activity, Zap, Thermometer, Radio,
  TrendingUp, RefreshCw, Download, Settings, Power,
  Wifi, WifiOff, Gauge, ShieldCheck, ChevronRight, ChevronDown, ChevronUp,
  Wrench, AlertCircle, HelpCircle
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

/* ─── tiny helper: pulse dot ─────────────────────────────────── */
const PulseDot = ({ color = 'bg-green-500' }) => (
  <span className="relative flex h-2.5 w-2.5">
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
  </span>
);

/* ─── stat card ──────────────────────────────────────────────── */
const StatCard = ({ label, value, accent, Icon }) => (
  <div
    className="relative overflow-hidden rounded-sm border border-neutral-700/60 bg-neutral-800/70 p-5
                backdrop-blur-sm flex items-center justify-between
                hover:border-neutral-600 transition-colors duration-200"
  >
    {/* left accent bar */}
    <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
    <div className="pl-4">
      <p className="text-xs tracking-widest uppercase text-neutral-400 font-mono mb-2">{label}</p>
      <p className={`text-5xl font-bold font-mono ${accent.replace('bg-', 'text-')}`}>{value}</p>
    </div>
    <Icon className={`w-12 h-12 opacity-20 ${accent.replace('bg-', 'text-')}`} />
  </div>
);

/* ─── custom chart tooltip ───────────────────────────────────── */
const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-neutral-700 px-3 py-2 rounded-sm text-sm font-mono shadow-xl">
      <p className="text-neutral-400 mb-1">{new Date(label).toLocaleString()}</p>
      <p className="text-white">{payload[0]?.value?.toFixed(2)} <span className="text-neutral-500">{unit}</span></p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
const PredictiveMaintenanceDashboard = () => {
  const [sensorData, setSensorData] = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [stats, setStats]           = useState({ total_readings: 0, anomaly_count: 0, critical_count: 0 });
  const [loading, setLoading]       = useState(false);
  const [days, setDays]             = useState(30);
  const [connected, setConnected]   = useState(false);
  const [error, setError]           = useState(null);

  const checkConnection = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) { setConnected(true); setError(null); return true; }
    } catch { setConnected(false); setError('Backend server not connected. Please start the Flask server.'); }
    return false;
  };

  const analyzeData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) throw new Error('Failed to fetch data from backend');
      const result = await res.json();
      if (result.success) {
        setSensorData(result.data); setAlerts(result.alerts); setStats(result.stats); setConnected(true);
      } else throw new Error(result.error || 'Unknown error');
    } catch (err) {
      console.error(err); setError(err.message); setConnected(false);
    } finally { setLoading(false); }
  };

  const exportData = async () => {
    try {
      const res = await fetch(`${API_URL}/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days }) });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: `maintenance_data_${new Date().toISOString().split('T')[0]}.csv` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) { setError('Failed to export data'); }
  };

  useEffect(() => { checkConnection().then(ok => { if (ok) analyzeData(); }); }, []);

  const formatTime = ts => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const chartData  = sensorData.filter((_, i) => i % 3 === 0);

  /* latest readings for the equipment card */
  const latest = sensorData[sensorData.length - 1];

  const getIssueIcon = text => {
    if (text.includes('Temperature')) return Thermometer;
    if (text.includes('Vibration'))   return Radio;
    if (text.includes('Current'))     return Zap;
    return Activity;
  };

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-zinc-950 text-neutral-100 font-mono">

      {/* ══════════ HEADER with bg image ══════════ */}
      <header className="relative overflow-hidden border-b border-neutral-800">
        {/* background image, very subtle */}
        <img
          src="/industrial_bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.12] select-none pointer-events-none"
        />
        {/* dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-orange-600/10 border border-orange-600/30 p-3 rounded-sm">
              <Settings className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-widest uppercase">
                Industrial Maintenance System
              </h1>
              <p className="text-sm text-neutral-400 tracking-wider mt-0.5">
                Equipment Health Monitoring &amp; Anomaly Detection · v2.1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* connection badge */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-sm
              ${connected
                ? 'border-green-700/50 bg-green-950/40 text-green-400'
                : 'border-red-700/50 bg-red-950/40 text-red-400'}`}>
              {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <PulseDot color={connected ? 'bg-green-500' : 'bg-red-500'} />
              <span className="tracking-widest">{connected ? 'BACKEND ONLINE' : 'BACKEND OFFLINE'}</span>
            </div>

            {/* time range selector */}
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              disabled={!connected}
              className="bg-zinc-900 border border-neutral-700 text-white text-sm px-3 py-2 rounded-sm
                         focus:outline-none focus:border-orange-600 disabled:opacity-40 cursor-pointer"
            >
              {[7, 30, 60, 90].map(d => <option key={d} value={d}>{d} DAYS</option>)}
            </select>

            <button
              onClick={analyzeData}
              disabled={loading || !connected}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-700
                         disabled:opacity-40 text-white text-sm px-5 py-2 rounded-sm
                         transition-colors duration-150 uppercase tracking-wider"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>

            <button
              onClick={exportData}
              disabled={!connected || !sensorData.length}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-neutral-700
                         disabled:opacity-40 text-white text-sm px-5 py-2 rounded-sm
                         transition-colors duration-150 uppercase tracking-wider"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ══════════ ERROR BANNER ══════════ */}
        {error && (
          <div className="flex items-center gap-4 bg-red-950/30 border-l-4 border-red-600 px-5 py-3 rounded-sm">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 text-sm font-bold uppercase tracking-widest">System Error</p>
              <p className="text-red-300/80 text-sm mt-0.5">{error}</p>
            </div>
            <button onClick={checkConnection}
              className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-sm transition-colors uppercase tracking-wider">
              Retry
            </button>
          </div>
        )}

        {/* ══════════ EQUIPMENT OVERVIEW ROW ══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Equipment image card (2 cols) */}
          <div className="lg:col-span-2 relative rounded-sm overflow-hidden border border-neutral-800 bg-neutral-900 min-h-[280px]">
            <img
              src="/industrial_motor.png"
              alt="Industrial Motor Unit"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            {/* bottom-up gradient for the label */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

            {/* live indicator top-right */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-zinc-950/70 border border-neutral-700/60 px-2.5 py-1 rounded-sm backdrop-blur-sm">
              <PulseDot color={connected ? 'bg-green-500' : 'bg-neutral-500'} />
              <span className="text-xs text-neutral-300 tracking-widest">LIVE</span>
            </div>

            {/* bottom label + mini readings */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-4">
              <p className="text-xs text-neutral-300 tracking-widest uppercase mb-1">Monitored Asset</p>
              <p className="text-white text-base font-bold tracking-wide">Industrial Motor Unit #01</p>
              {latest && (
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1 text-sm text-orange-400">
                    <Thermometer className="w-3 h-3" /> {latest.temperature?.toFixed(1)}°C
                  </span>
                  <span className="flex items-center gap-1 text-sm text-blue-400">
                    <Radio className="w-3 h-3" /> {latest.vibration?.toFixed(2)} mm/s
                  </span>
                  <span className="flex items-center gap-1 text-sm text-yellow-400">
                    <Zap className="w-3 h-3" /> {latest.current?.toFixed(1)} A
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats cards (3 cols) */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 content-center">
            <StatCard label="Total Readings" value={stats.total_readings || 0}  accent="bg-blue-500"   Icon={Activity} />
            <StatCard label="Anomalies"      value={stats.anomaly_count || 0}   accent="bg-yellow-500" Icon={TrendingUp} />
            <StatCard label="Critical Issues" value={stats.critical_count || 0} accent="bg-red-500"    Icon={AlertTriangle} />

            {/* health summary bar */}
            <div className="sm:col-span-3 bg-neutral-800/60 border border-neutral-700/60 rounded-sm px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span className="text-sm text-neutral-400 tracking-widest uppercase">System Health</span>
              </div>
              {stats.total_readings > 0 ? (() => {
                const healthPct = Math.max(0, 100 - Math.round((stats.anomaly_count / stats.total_readings) * 100));
                const color = healthPct > 85 ? 'bg-green-500' : healthPct > 60 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div className="flex items-center gap-3 flex-1 ml-6">
                    <div className="flex-1 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                      <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${healthPct}%` }} />
                    </div>
                    <span className={`text-sm font-bold font-mono ${color.replace('bg-', 'text-')}`}>{healthPct}%</span>
                  </div>
                );
              })() : (
                <span className="text-sm text-neutral-600 ml-6">Run analysis to see health score</span>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ CHARTS GRID ══════════ */}
        {sensorData.length === 0 && !loading ? (
          <div className="border border-dashed border-neutral-800 rounded-sm py-20 text-center">
            <Gauge className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 text-sm tracking-widest uppercase">No data loaded</p>
            <p className="text-neutral-600 text-sm mt-1">Click <strong className="text-orange-600">Analyze</strong> to fetch sensor data from the backend</p>
          </div>
        ) : (
          <>
            {/* section label */}
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-neutral-800" />
              <span className="text-xs text-neutral-600 tracking-widest uppercase">Sensor Telemetry</span>
              <span className="h-px flex-1 bg-neutral-800" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Temperature */}
              <ChartCard title="Motor Temperature" Icon={Thermometer} iconColor="text-orange-500">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} unit="°C" width={45} />
                    <Tooltip content={<ChartTooltip unit="°C" />} />
                    <Area type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={1.5} fill="url(#tempGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Vibration */}
              <ChartCard title="Vibration Level" Icon={Radio} iconColor="text-blue-400">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="vibGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} unit=" mm/s" width={55} />
                    <Tooltip content={<ChartTooltip unit="mm/s" />} />
                    <Area type="monotone" dataKey="vibration" stroke="#60a5fa" strokeWidth={1.5} fill="url(#vibGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Current Draw */}
              <ChartCard title="Current Draw" Icon={Zap} iconColor="text-yellow-400">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="curGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#eab308" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} unit=" A" width={40} />
                    <Tooltip content={<ChartTooltip unit="A" />} />
                    <Area type="monotone" dataKey="current" stroke="#eab308" strokeWidth={1.5} fill="url(#curGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Anomaly Score Distribution */}
              <ChartCard title="Anomaly Score Distribution" Icon={Activity} iconColor="text-purple-400">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={(() => {
                    const bins = Array(20).fill(0).map((_, i) => ({ score: -10 + i, count: 0 }));
                    sensorData.forEach(d => {
                      const bin = Math.floor(d.anomaly_score + 10);
                      if (bin >= 0 && bin < 20) bins[bin].count++;
                    });
                    return bins;
                  })()} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="score" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', fontFamily: 'monospace', fontSize: 11 }} />
                    <Bar dataKey="count" fill="#a855f7" opacity={0.8} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ══════════ ALERTS ══════════ */}
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-neutral-800" />
              <span className="text-xs text-neutral-600 tracking-widest uppercase">Maintenance Alerts</span>
              <span className="h-px flex-1 bg-neutral-800" />
            </div>

            <div className="border border-neutral-800 rounded-sm overflow-hidden">
              {/* panel header */}
              <div className="flex items-center justify-between px-5 py-3 bg-neutral-900 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm tracking-widest uppercase text-neutral-300">Alert Feed</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    {alerts.filter(a => a.severity === 'CRITICAL').length} critical
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-yellow-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
                    {alerts.filter(a => a.severity !== 'CRITICAL').length} warning
                  </span>
                  <span className="text-xs text-neutral-600">— {alerts.length} total event{alerts.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="py-14 text-center bg-neutral-900/40">
                  <Power className="w-10 h-10 text-green-600/40 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm tracking-widest uppercase">All Systems Operational</p>
                  <p className="text-neutral-600 text-sm mt-1">No maintenance issues detected in the selected period</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800">
                  {alerts.map((alert, idx) => (
                    <AlertCard key={idx} alert={alert} formatTime={formatTime} getIssueIcon={getIssueIcon} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="border-t border-neutral-800 mt-8 py-4">
        <p className="text-center text-sm text-neutral-600 tracking-widest uppercase">
          Predictive Maintenance System · Powered by Scikit-Learn Isolation Forest
        </p>
      </footer>
    </div>
  );
};

/* ─── reusable chart card wrapper ────────────────────────────── */
const ChartCard = ({ title, Icon, iconColor, children }) => (
  <div className="bg-neutral-900/60 border border-neutral-800 rounded-sm overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-3 border-b border-neutral-800 bg-neutral-900">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <h3 className="text-sm tracking-widest uppercase text-neutral-400">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);


/* --- expandable alert card ------------------------------------ */
const ISSUE_ICONS = {
  overheat:      Thermometer,
  vibration:     Radio,
  current_spike: Zap,
  combined:      Activity,
};
const ISSUE_COLORS = {
  overheat:      { icon: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-700/40', step: 'bg-orange-600' },
  vibration:     { icon: 'text-blue-400',   bg: 'bg-blue-950/30',   border: 'border-blue-700/40',   step: 'bg-blue-600'   },
  current_spike: { icon: 'text-yellow-400', bg: 'bg-yellow-950/30', border: 'border-yellow-700/40', step: 'bg-yellow-600' },
  combined:      { icon: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-700/40', step: 'bg-purple-600' },
};

const AlertCard = ({ alert, formatTime, getIssueIcon }) => {
  const [expanded, setExpanded] = React.useState(false);
  const isCritical = alert.severity.toUpperCase() === 'CRITICAL';
  const details    = alert.issue_details || [];

  return (
    <div className={`border-l-2 transition-colors ${isCritical ? 'border-red-600' : 'border-yellow-500'}`}>
      {/* collapsed header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-neutral-800/40 transition-colors text-left"
      >
        <span className={`shrink-0 text-sm font-bold tracking-widest px-2 py-0.5 rounded-sm border ${
          isCritical ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
        }`}>
          {alert.severity}
        </span>

        <span className="text-sm text-neutral-400 shrink-0 font-mono">{formatTime(alert.timestamp)}</span>

        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {alert.issues.map((issue, i) => {
            const Icon = getIssueIcon(issue);
            return (
              <span key={i} className="flex items-center gap-1 bg-zinc-900 border border-neutral-700/50 px-2.5 py-1 text-sm text-neutral-200 rounded-sm">
                <Icon className="w-3 h-3 text-neutral-500" />
                {issue}
              </span>
            );
          })}
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <span className="text-sm text-neutral-600 font-mono">score {alert.anomaly_score.toFixed(3)}</span>
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
            : <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />}
        </div>
      </button>

      {/* expanded body */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {(details.length > 0
            ? details
            : alert.issues.map(label => ({ type: 'combined', label, description: '', cause: '', actions: alert.recommendations }))
          ).map((detail, di) => {
            const colors = ISSUE_COLORS[detail.type] || ISSUE_COLORS.combined;
            const Icon   = ISSUE_ICONS[detail.type]  || Activity;
            return (
              <div key={di} className={`rounded-sm border ${colors.border} ${colors.bg} overflow-hidden`}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <Icon className={`w-4 h-4 ${colors.icon} shrink-0`} />
                  <span className={`text-sm font-bold tracking-wide ${colors.icon}`}>{detail.label}</span>
                </div>
                <div className="px-4 py-3 space-y-4">
                  {detail.description && (
                    <div className="flex gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-neutral-200 leading-relaxed">{detail.description}</p>
                    </div>
                  )}
                  {detail.cause && (
                    <div className="flex gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-neutral-400 leading-relaxed italic">{detail.cause}</p>
                    </div>
                  )}
                  {detail.actions?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Wrench className="w-3 h-3 text-neutral-500" />
                        <span className="text-sm text-neutral-300 tracking-widest uppercase">Recommended Actions</span>
                      </div>
                      <ol className="space-y-2">
                        {detail.actions.map((action, ai) => (
                          <li key={ai} className="flex items-start gap-2.5">
                            <span className={`shrink-0 mt-0.5 text-sm font-bold text-white ${colors.step} w-4 h-4 rounded-sm flex items-center justify-center`}>
                              {ai + 1}
                            </span>
                            <span className="text-sm text-neutral-200 leading-relaxed">{action}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PredictiveMaintenanceDashboard;
