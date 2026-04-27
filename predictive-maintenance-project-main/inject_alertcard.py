import re

path = r'd:\predictive-maintenance-project-main\predictive-maintenance-project-main\frontend\src\components\PredictiveMaintenanceDashboard.jsx'

alert_card = r"""
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
        <span className={`shrink-0 text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-sm border ${
          isCritical ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
        }`}>
          {alert.severity}
        </span>

        <span className="text-[11px] text-neutral-400 shrink-0 font-mono">{formatTime(alert.timestamp)}</span>

        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {alert.issues.map((issue, i) => {
            const Icon = getIssueIcon(issue);
            return (
              <span key={i} className="flex items-center gap-1 bg-zinc-900 border border-neutral-700/50 px-2 py-0.5 text-[10px] text-neutral-300 rounded-sm">
                <Icon className="w-3 h-3 text-neutral-500" />
                {issue}
              </span>
            );
          })}
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <span className="text-[10px] text-neutral-600 font-mono">score {alert.anomaly_score.toFixed(3)}</span>
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
                  <span className={`text-xs font-bold tracking-wide ${colors.icon}`}>{detail.label}</span>
                </div>
                <div className="px-4 py-3 space-y-4">
                  {detail.description && (
                    <div className="flex gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-neutral-300 leading-relaxed">{detail.description}</p>
                    </div>
                  )}
                  {detail.cause && (
                    <div className="flex gap-2">
                      <HelpCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-neutral-400 leading-relaxed italic">{detail.cause}</p>
                    </div>
                  )}
                  {detail.actions?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Wrench className="w-3 h-3 text-neutral-500" />
                        <span className="text-[10px] text-neutral-500 tracking-widest uppercase">Recommended Actions</span>
                      </div>
                      <ol className="space-y-2">
                        {detail.actions.map((action, ai) => (
                          <li key={ai} className="flex items-start gap-2.5">
                            <span className={`shrink-0 mt-0.5 text-[9px] font-bold text-white ${colors.step} w-4 h-4 rounded-sm flex items-center justify-center`}>
                              {ai + 1}
                            </span>
                            <span className="text-[11px] text-neutral-300 leading-relaxed">{action}</span>
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
"""

content = open(path, 'r', encoding='utf-8').read()
old = 'export default PredictiveMaintenanceDashboard;'
if old not in content:
    print("ERROR: marker not found")
else:
    new_content = content.replace(old, alert_card)
    open(path, 'w', encoding='utf-8').write(new_content)
    print(f"Done. File is now {len(new_content)} chars.")
