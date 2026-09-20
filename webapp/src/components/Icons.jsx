// Линейные иконки (stroke), цвет берут из текста.
const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconHome = (p) => (<svg {...base} {...p}><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" /></svg>);
export const IconMeta = (p) => (<svg {...base} {...p}><path d="M5 20V11M12 20V5M19 20v-6M3 20h18" /></svg>);
export const IconGrid = (p) => (<svg {...base} {...p}><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg>);
export const IconPulse = (p) => (<svg {...base} {...p}><path d="M3 12h4l3-7 4 14 3-7h4" /></svg>);
export const IconUser = (p) => (<svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
export const IconPlus = (p) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const IconClose = (p) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconStar = (p) => (<svg {...base} {...p}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>);
export const IconSearch = (p) => (<svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>);
export const IconBolt = (p) => (<svg {...base} {...p}><path d="M13 3L5 14h6l-1 7 8-11h-6z" /></svg>);
export const IconTrash = (p) => (<svg {...base} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>);
export const IconChevron = (p) => (<svg {...base} {...p}><path d="M9 5l7 7-7 7" /></svg>);
