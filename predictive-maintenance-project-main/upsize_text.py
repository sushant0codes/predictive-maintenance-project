path = r'd:\predictive-maintenance-project-main\predictive-maintenance-project-main\frontend\src\components\PredictiveMaintenanceDashboard.jsx'

content = open(path, 'r', encoding='utf-8').read()

# Bump up all the tiny text sizes throughout the file
replacements = [
    # Tiny pixel sizes -> readable sizes
    ('text-[9px]',   'text-[11px]'),
    ('text-[10px]',  'text-xs'),
    ('text-[11px]',  'text-sm'),
    # xs -> sm in key places
    # Stat card label
    ('text-[10px] tracking-widest uppercase text-neutral-500 font-mono mb-1', 'text-xs tracking-widest uppercase text-neutral-500 font-mono mb-1'),
    # Title sizes
    ('text-xl font-bold text-white tracking-widest uppercase', 'text-2xl font-bold text-white tracking-widest uppercase'),
    # Chart card headers
    ('text-[11px] tracking-widest uppercase text-neutral-400', 'text-xs tracking-widest uppercase text-neutral-400'),
    # Section dividers
    ('text-[10px] text-neutral-600 tracking-widest uppercase', 'text-xs text-neutral-600 tracking-widest uppercase'),
    # Health bar label
    ('text-sm text-neutral-400 tracking-widest uppercase', 'text-sm text-neutral-400 tracking-widest uppercase'),
    # Subtitle under header
    ('text-sm text-neutral-500 tracking-wider mt-0.5', 'text-sm text-neutral-400 tracking-wider mt-0.5'),
    # Alert feed count text
    ('text-[10px] text-neutral-600', 'text-xs text-neutral-600'),
    # Alert score
    ('text-xs text-neutral-600 font-mono', 'text-sm text-neutral-600 font-mono'),
    # Equipment card labels
    ('text-xs text-neutral-500 tracking-widest uppercase mb-1', 'text-xs text-neutral-400 tracking-widest uppercase mb-1'),
    ('text-white text-sm font-bold tracking-wide', 'text-white text-base font-bold tracking-wide'),
    # Live chip
    ('text-xs text-neutral-400 tracking-widest', 'text-xs text-neutral-300 tracking-widest'),
    # Expand/collapse alert row - timestamp
    ('text-xs text-neutral-400 shrink-0 font-mono', 'text-sm text-neutral-300 shrink-0 font-mono'),
    # Alert issue chips
    ('text-xs text-neutral-300 rounded-sm', 'text-sm text-neutral-200 rounded-sm'),
    # Alert issue chip icon size
    ('px-2 py-0.5 text-sm text-neutral-200', 'px-2.5 py-1 text-sm text-neutral-200'),
    # Alert expanded: description
    ('text-sm text-neutral-300 leading-relaxed', 'text-sm text-neutral-200 leading-relaxed'),
    # Alert expanded: cause
    ('text-sm text-neutral-400 leading-relaxed italic', 'text-sm text-neutral-400 leading-relaxed italic'),
    # Alert expanded: actions header
    ('text-xs text-neutral-500 tracking-widest uppercase', 'text-xs text-neutral-400 tracking-widest uppercase'),
    # Alert expanded: action text
    ('text-sm text-neutral-300 leading-relaxed', 'text-sm text-neutral-200 leading-relaxed'),
    # Chart tooltips
    ('text-xs font-mono shadow-xl', 'text-sm font-mono shadow-xl'),
    # Error banner
    ('text-xs font-bold uppercase tracking-widest', 'text-sm font-bold uppercase tracking-widest'),
    # Connection badge
    ('gap-2 px-3 py-1.5 rounded-sm border text-xs', 'gap-2 px-3 py-2 rounded-sm border text-sm'),
    # Buttons
    ('text-white text-xs px-4 py-1.5 rounded-sm', 'text-white text-sm px-5 py-2 rounded-sm'),
    ('disabled:opacity-40 text-white text-sm px-5 py-2 rounded-sm\n                         transition-colors duration-150 uppercase tracking-wider\"\n            >\n              <RefreshCw', 'disabled:opacity-40 text-white text-sm px-5 py-2 rounded-sm\n                         transition-colors duration-150 uppercase tracking-wider\"\n            >\n              <RefreshCw'),
    # Select dropdown
    ('text-white text-xs px-3 py-1.5 rounded-sm', 'text-white text-sm px-3 py-2 rounded-sm'),
    # Alert severity badges (collapsed row)
    ('text-xs font-bold tracking-widest px-2 py-0.5 rounded-sm border', 'text-xs font-bold tracking-widest px-2.5 py-1 rounded-sm border'),
    # Alert feed panel header
    ('text-xs tracking-widest uppercase text-neutral-300', 'text-sm tracking-widest uppercase text-neutral-300'),
    # Critical/warning count in panel header
    ('text-xs text-red-400', 'text-sm text-red-400'),
    ('text-xs text-yellow-400', 'text-sm text-yellow-400'),
    # System health label
    ('text-xs text-neutral-400 tracking-widest uppercase', 'text-sm text-neutral-300 tracking-widest uppercase'),
    # Footer
    ('text-xs text-neutral-700 tracking-widest uppercase', 'text-sm text-neutral-600 tracking-widest uppercase'),
    # Stat card label (the very first one with mb-1)
    ('text-xs tracking-widest uppercase text-neutral-500 font-mono mb-1', 'text-xs tracking-widest uppercase text-neutral-400 font-mono mb-2'),
    # Motor unit readings in image card
    ('gap-1 text-xs text-orange-400', 'gap-1 text-sm text-orange-400'),
    ('gap-1 text-xs text-blue-400',   'gap-1 text-sm text-blue-400'),
    ('gap-1 text-xs text-yellow-400', 'gap-1 text-sm text-yellow-400'),
    # Empty state
    ('text-xs tracking-widest uppercase', 'text-sm tracking-widest uppercase'),
    # Issue detail header badge
    ('text-xs font-bold tracking-wide', 'text-sm font-bold tracking-wide'),
    # Action step number badge
    ('text-xs text-neutral-500 tracking-widest uppercase', 'text-xs text-neutral-400 tracking-widest uppercase'),
]

for old, new in replacements:
    content = content.replace(old, new)

open(path, 'w', encoding='utf-8').write(content)
print(f'Done. {len(content)} chars.')
