// Tierbilder für die Kinderprofile – damit jedes Kind sein Profil ohne Lesen findet.

import { svg } from './ui.js';

const L = '#2d3047';
const eyes = (y = 52, dx = 12) => `<circle cx="${50 - dx}" cy="${y}" r="4.5" fill="${L}"/><circle cx="${50 + dx}" cy="${y}" r="4.5" fill="${L}"/><circle cx="${51.5 - dx}" cy="${y - 1.5}" r="1.5" fill="#fff"/><circle cx="${51.5 + dx}" cy="${y - 1.5}" r="1.5" fill="#fff"/>`;
const smile = (y = 66) => `<path d="M43 ${y} q7 6 14 0" stroke="${L}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;

export const ANIMALS = {
  pferd: { name: 'Pferd', bg: '#ffe2c4', art: `
    <path d="M30 30 L34 14 L42 28 Z M70 30 L66 14 L58 28 Z" fill="#a8714a"/>
    <ellipse cx="50" cy="52" rx="24" ry="30" fill="#c08457"/>
    <path d="M38 24 q12 -10 24 0 q-4 10 -12 12 q-8 -2 -12 -12z" fill="#5b3a29"/>
    <ellipse cx="50" cy="70" rx="15" ry="11" fill="#e2b58f"/>
    <ellipse cx="44" cy="71" rx="2" ry="3" fill="${L}"/><ellipse cx="56" cy="71" rx="2" ry="3" fill="${L}"/>
    ${eyes(48, 11)}` },
  katze: { name: 'Katze', bg: '#ffe9b0', art: `
    <path d="M24 40 L28 14 L46 30 Z M76 40 L72 14 L54 30 Z" fill="#f2a254"/>
    <path d="M29 36 L31 21 L41 30 Z M71 36 L69 21 L59 30 Z" fill="#ffc9a8"/>
    <circle cx="50" cy="54" r="27" fill="#f2a254"/>
    <path d="M44 34 l3 8 M50 32 v9 M56 34 l-3 8" stroke="#d9802f" stroke-width="3" stroke-linecap="round"/>
    ${eyes(52)}
    <path d="M47 60 h6 l-3 4 z" fill="#ff8fa3"/>${smile(66)}
    <path d="M20 58 h14 M20 64 l14 -2 M80 58 h-14 M80 64 l-14 -2" stroke="${L}" stroke-width="1.5" opacity=".5"/>` },
  hund: { name: 'Hund', bg: '#d8ecff', art: `
    <ellipse cx="25" cy="50" rx="10" ry="20" fill="#7a5537" transform="rotate(15 25 50)"/>
    <ellipse cx="75" cy="50" rx="10" ry="20" fill="#7a5537" transform="rotate(-15 75 50)"/>
    <circle cx="50" cy="52" r="26" fill="#c99b6d"/>
    <ellipse cx="50" cy="64" rx="13" ry="10" fill="#f1dcc3"/>
    <ellipse cx="50" cy="59" rx="5" ry="3.5" fill="${L}"/>
    ${eyes(48)}${smile(67)}` },
  hase: { name: 'Hase', bg: '#e8f7d8', art: `
    <ellipse cx="38" cy="22" rx="7" ry="20" fill="#e6e1ea"/><ellipse cx="62" cy="22" rx="7" ry="20" fill="#e6e1ea"/>
    <ellipse cx="38" cy="22" rx="3.5" ry="14" fill="#ffc0cb"/><ellipse cx="62" cy="22" rx="3.5" ry="14" fill="#ffc0cb"/>
    <circle cx="50" cy="58" r="25" fill="#e6e1ea"/>
    ${eyes(54)}
    <path d="M47 62 h6 l-3 3.5 z" fill="#ff8fa3"/>${smile(68)}
    <circle cx="34" cy="64" r="4" fill="#ffc0cb" opacity=".7"/><circle cx="66" cy="64" r="4" fill="#ffc0cb" opacity=".7"/>` },
  fuchs: { name: 'Fuchs', bg: '#fff0d6', art: `
    <path d="M22 26 L36 46 L44 30 Z M78 26 L64 46 L56 30 Z" fill="#e8742c"/>
    <path d="M24 30 q26 -12 52 0 q2 26 -26 46 q-28 -20 -26 -46z" fill="#f08a3c"/>
    <path d="M28 46 q10 4 22 30 q12 -26 22 -30 q-4 22 -22 32 q-18 -10 -22 -32z" fill="#fff"/>
    ${eyes(48)}
    <ellipse cx="50" cy="72" rx="4" ry="3" fill="${L}"/>` },
  eule: { name: 'Eule', bg: '#efe2ff', art: `
    <path d="M26 30 L34 18 L40 30 Z M74 30 L66 18 L60 30 Z" fill="#8a6a52"/>
    <ellipse cx="50" cy="56" rx="27" ry="30" fill="#a07f63"/>
    <ellipse cx="50" cy="66" rx="16" ry="18" fill="#e9d6bf"/>
    <circle cx="39" cy="46" r="10" fill="#fff"/><circle cx="61" cy="46" r="10" fill="#fff"/>
    <circle cx="39" cy="46" r="5" fill="${L}"/><circle cx="61" cy="46" r="5" fill="${L}"/>
    <path d="M46 54 L50 61 L54 54 Z" fill="#f2a63a"/>` },
  panda: { name: 'Panda', bg: '#e2f4f0', art: `
    <circle cx="28" cy="30" r="10" fill="${L}"/><circle cx="72" cy="30" r="10" fill="${L}"/>
    <circle cx="50" cy="54" r="27" fill="#fff" stroke="#ddd" stroke-width="1.5"/>
    <ellipse cx="38" cy="51" rx="7" ry="9" fill="${L}" transform="rotate(-20 38 51)"/>
    <ellipse cx="62" cy="51" rx="7" ry="9" fill="${L}" transform="rotate(20 62 51)"/>
    <circle cx="39" cy="50" r="2.5" fill="#fff"/><circle cx="61" cy="50" r="2.5" fill="#fff"/>
    <ellipse cx="50" cy="62" rx="4" ry="3" fill="${L}"/>${smile(68)}` },
  igel: { name: 'Igel', bg: '#ffe4e8', art: `
    <path d="M14 66 L20 40 L28 52 L32 28 L42 44 L50 22 L58 44 L68 28 L72 52 L80 40 L86 66 Z" fill="#7b5a43"/>
    <ellipse cx="50" cy="64" rx="30" ry="20" fill="#7b5a43"/>
    <ellipse cx="54" cy="66" rx="20" ry="15" fill="#f0d2b0"/>
    <circle cx="48" cy="62" r="3.5" fill="${L}"/><circle cx="62" cy="62" r="3.5" fill="${L}"/>
    <circle cx="73" cy="68" r="3.5" fill="${L}"/>${smile(72).replace('M43', 'M50')}` },
};

export function avatarEl(tier, cls = '') {
  const a = ANIMALS[tier] || ANIMALS.katze;
  const el = svg(`<svg class="avatar ${cls}" viewBox="0 0 100 100" aria-label="${a.name}"><circle cx="50" cy="50" r="50" fill="${a.bg}"/>${a.art}</svg>`);
  return el;
}
