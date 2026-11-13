const q = new URLSearchParams(location.search);
const mod = await import('./film.js');
await document.fonts.load('44px AD');
const F = await mod.build();
const ctx = document.getElementById('c').getContext('2d');
window.DUR = F.dur; window.EV = F.ev; window.SUBS = F.subs || [];
window.render = t => F.render(ctx, t);
window.TEXTS = F.texts;
window.READY = true;
