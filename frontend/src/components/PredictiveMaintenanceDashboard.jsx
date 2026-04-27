import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, Activity, Zap, Thermometer, Radio, TrendingUp, RefreshCw, Download, Settings, Power, Wifi, WifiOff } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const PredictiveMaintenanceDashboard = () => {
  const [sensorData, setSensorData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total_readings: 0, anomaly_count: 0, critical_count: 0 });
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // Check backend connection
  const checkConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        setConnected(true);
        setError(null);
        return true;
      }
    } catch (err) {
      setConnected(false);
      setError('Backend server not connected. Please start the Flask server.');
      return false;
    }
  };

  // Fetch data from backend
  const analyzeData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data from backend');
      }

      const result = await response.json();

      if (result.success) {
        setSensorData(result.data);
        setAlerts(result.alerts);
        setStats(result.stats);
        setConnected(true);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Export data
  const exportData = async () => {
    try {
      const response = await fetch(`${API_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days })
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance_data_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  useEffect(() => {
    checkConnection().then(isConnected => {
      if (isConnected) {
        analyzeData();
      }
    });
  }, []);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIssueIcon = (issueText) => {
    if (issueText.includes('Temperature')) return Thermometer;
    if (issueText.includes('Vibration')) return Radio;
    if (issueText.includes('Current')) return Zap;
    return Activity;
  };

  const chartData = sensorData.filter((_, idx) => idx % 3 === 0);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-neutral-800 border-l-4 border-orange-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-orange-600 p-3 rounded">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white uppercase tracking-wide">Industrial Maintenance System</h1>
                <p className="text-neutral-400 text-sm font-mono mt-1">Equipment Health Monitoring & Anomaly Detection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-green-500 font-mono text-sm">BACKEND CONNECTED</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-red-500 font-mono text-sm">BACKEND OFFLINE</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/30 border-l-4 border-red-600 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-400 font-mono text-sm font-bold">ERROR</p>
                <p className="text-red-300 font-mono text-xs mt-1">{error}</p>
                <p className="text-neutral-400 font-mono text-xs mt-2">
                  Run: <code className="bg-neutral-800 px-2 py-1">python backend.py</code>
                </p>
              </div>
              <button 
                onClick={checkConnection}
                className="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 font-mono text-xs uppercase"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="bg-neutral-800 border border-neutral-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-neutral-400 font-mono text-sm uppercase">Time Range:</span>
              <select 
                value={days} 
                onChange={(e) => setDays(Number(e.target.value))}
                disabled={!connected}
                className="bg-neutral-900 border border-neutral-600 text-white px-4 py-2 font-mono focus:outline-none focus:border-orange-600 disabled:opacity-50"
              >
                <option value={7}>7 DAYS</option>
                <option value={30}>30 DAYS</option>
                <option value={60}>60 DAYS</option>
                <option value={90}>90 DAYS</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={analyzeData}
                disabled={loading || !connected}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-700 disabled:opacity-50 text-white px-6 py-2 font-mono uppercase text-sm flex items-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
              <button 
                onClick={exportData}
                disabled={!connected || sensorData.length === 0}
                className="bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white px-6 py-2 font-mono uppercase text-sm flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-800 border-l-4 border-blue-600 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-xs font-mono uppercase mb-2">Total Readings</p>
                <p className="text-4xl font-bold text-white font-mono">{stats.total_readings || 0}</p>
              </div>
              <Activity className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-neutral-800 border-l-4 border-yellow-500 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-xs font-mono uppercase mb-2">Anomalies</p>
                <p className="text-4xl font-bold text-yellow-500 font-mono">{stats.anomaly_count || 0}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-neutral-800 border-l-4 border-red-600 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-xs font-mono uppercase mb-2">Critical Issues</p>
                <p className="text-4xl font-bold text-red-600 font-mono">{stats.critical_count || 0}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>
        </div>

        {sensorData.length === 0 && !loading ? (
          <div className="bg-neutral-800 border border-neutral-700 p-12 text-center">
            <Activity className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 font-mono text-sm">No data loaded. Click "ANALYZE" to fetch sensor data.</p>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Temperature Chart */}
              <div className="bg-neutral-800 border border-neutral-700 p-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-700">
                  <Thermometer className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-mono uppercase text-neutral-300">Motor Temperature</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTime}
                      stroke="#737373"
                      tick={{ fill: '#a3a3a3', fontSize: 11 }}
                    />
                    <YAxis stroke="#737373" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040' }}
                      labelStyle={{ color: '#d4d4d4', fontFamily: 'monospace' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Vibration Chart */}
              <div className="bg-neutral-800 border border-neutral-700 p-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-700">
                  <Radio className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-mono uppercase text-neutral-300">Vibration Level</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTime}
                      stroke="#737373"
                      tick={{ fill: '#a3a3a3', fontSize: 11 }}
                    />
                    <YAxis stroke="#737373" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040' }}
                      labelStyle={{ color: '#d4d4d4', fontFamily: 'monospace' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="vibration" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Current Draw Chart */}
              <div className="bg-neutral-800 border border-neutral-700 p-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-700">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-sm font-mono uppercase text-neutral-300">Current Draw</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTime}
                      stroke="#737373"
                      tick={{ fill: '#a3a3a3', fontSize: 11 }}
                    />
                    <YAxis stroke="#737373" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040' }}
                      labelStyle={{ color: '#d4d4d4', fontFamily: 'monospace' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#eab308" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Anomaly Distribution */}
              <div className="bg-neutral-800 border border-neutral-700 p-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-700">
                  <Activity className="w-5 h-5 text-purple-500" />
                  <h3 className="text-sm font-mono uppercase text-neutral-300">Anomaly Distribution</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(() => {
                    const bins = Array(20).fill(0).map((_, i) => ({ score: -10 + i, count: 0 }));
                    sensorData.forEach(d => {
                      const bin = Math.floor((d.anomaly_score + 10));
                      if (bin >= 0 && bin < 20) bins[bin].count++;
                    });
                    return bins;
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="score" stroke="#737373" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                    <YAxis stroke="#737373" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040' }}
                    />
                    <Bar dataKey="count" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-neutral-800 border border-neutral-700 p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-700">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-mono uppercase text-neutral-300">Maintenance Alerts</h3>
              </div>
              {alerts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-neutral-700">
                  <Power className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-neutral-400 font-mono text-sm">ALL SYSTEMS OPERATIONAL</p>
                  <p className="text-neutral-500 font-mono text-xs mt-1">No maintenance issues detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, idx) => {
                    const severity = alert.severity.toUpperCase();
                    return (
                      <div 
                        key={idx}
                        className={`border-l-4 ${severity === 'CRITICAL' ? 'border-red-600 bg-red-950/30' : 'border-yellow-500 bg-yellow-950/30'} p-4`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-mono font-bold ${severity === 'CRITICAL' ? 'bg-red-600' : 'bg-yellow-600'} text-white`}>
                              {severity}
                            </span>
                            <span className="text-neutral-400 text-xs font-mono">{formatTime(alert.timestamp)}</span>
                          </div>
                          <span className="text-neutral-500 text-xs font-mono">SCORE: {alert.anomaly_score.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {alert.issues.map((issue, i) => {
                              const Icon = getIssueIcon(issue);
                              return (
                                <div key={i} className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 px-3 py-2">
                                  <Icon className="w-4 h-4 text-neutral-400" />
                                  <span className="text-white text-sm font-mono">{issue}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="bg-neutral-900 border border-neutral-700 px-3 py-2">
                            <span className="text-neutral-400 text-xs font-mono uppercase">Action: </span>
                            <span className="text-white text-sm font-mono">{alert.recommendations[0]}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="bg-neutral-800 border border-neutral-700 p-4 text-center">
          <p className="text-neutral-500 text-xs font-mono">PREDICTIVE MAINTENANCE SYSTEM v2.1 | POWERED BY SCIKIT-LEARN ISOLATION FOREST</p>
        </div>
      </div>
    </div>
  );
};

export default PredictiveMaintenanceDashboard;