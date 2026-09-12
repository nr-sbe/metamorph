import type {Form} from './rules';

// Original silhouettes: drawn specifically for MORPH's five weapon forms.
// CurrentColor lets the same artwork work on black, paper and acid-green panels.
const art:Record<Form,string>={
 Unarmed:`<path d="M19 48 12 32l3-9 7-2 2-9 8-2 4 3 7-3 7 4 7-1 7 7-1 22-10 13-2 9H26l-1-9Z"/><path class="icon-cut" d="m24 24 2 13m10-22 1 20m12-20-1 21m11-13-3 15M18 31l16 9 5 10m-13 7h24"/>`,
 Claws:`<path d="m17 43 9 4 13-2 11-9 9 7-8 17-17 6-15-8Z"/><path d="M19 48C13 34 16 15 22 5c-1 15 3 25 9 34l-3 12ZM31 47C26 29 30 11 39 2c-4 18-1 27 3 35l-3 12ZM43 43C40 25 47 9 56 6c-7 14-7 22-3 29l-2 13ZM54 41C56 28 62 21 70 19c-6 8-7 16-7 22l-8 10Z"/><path class="icon-cut" d="m24 51 9 7 15-6m-18-3 6 4m9-8 5 3"/>`,
 Blade:`<path d="M17 56 29 42 27 35l8-1-1-8 8-2 2-7C51 13 60 7 68 2c-3 18-8 34-21 44L30 58l-5 12-15-9Z"/><path class="icon-cut" d="M27 52C41 42 53 25 61 13M22 57l6 5m9-21 7-1m0-12 6-1"/>`,
 Hammerfists:`<path d="m6 16 6-5 7 3 5-7 9 2 5 11-3 22-10 9-15-4-8-16Zm34 10 6-9 8-1 5 6 8-1 7 11-3 22-12 9-16-6-6-17Z"/><path class="icon-cut" d="m12 20 3 15 12 4 4-15M22 16l2 16M45 30l4 15 13 4 5-15M56 25l1 16m-46 1 11 3m23 9 11 4"/><path d="m8 54 9 6-15 2Zm20 3 7 8-9 7Zm38 13 8-9 1 12Z"/>`,
 Whipfist:`<path d="M9 60c-7-12 0-23 12-23 13-1 16 11 28 5 8-4 9-12 7-18l7-3c6 12-1 25-12 30-18 8-22-9-31-6-5 2-5 7-2 10l7 2-7 10Z"/><path d="M53 27c-11-3-14-14-6-25-1 10 4 14 11 13C66 14 68 8 66 2c10 10 6 24-6 28Z"/><path d="m23 39 0-10 9 12m5 4 5-12 3 11m8-3 11 4-9 5m-37-1 9 9-11-2Z"/><path class="icon-cut" d="m12 52 5-6m8-5 1 7m8-4-2 6m11-3 2 6m6-9 5 4m0-14 7 2M53 19l7 4"/>`
};
export function weaponIcon(form:Form,className='weapon-icon'){
 return `<svg class="${className}" viewBox="0 0 76 76" fill="currentColor" aria-hidden="true" focusable="false">${art[form]}</svg>`;
}
export const formRoles:Record<Form,string>={Unarmed:'STRIKE / GRAPPLE',Claws:'SLASH / LAUNCH',Blade:'CUT / EXECUTE',Hammerfists:'CRUSH / SHATTER',Whipfist:'REACH / CONTROL'};
export const formDescriptions:Record<Form,string>={Unarmed:'Fast strikes, aerial kicks and close grapples.',Claws:'Rapid cutting attacks and ground spikes.',Blade:'Heavy sweeps and descending slices.',Hammerfists:'Crushing shockwaves and powerful throws.',Whipfist:'Long-range lashes. Secondary seizes, lifts and slams the visible crowd.'};
export const vitalityIcon=`<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="m32 3 8 17 19 2-14 13 3 22-16-9-17 10 4-22L5 22l19-2Z"/><path class="icon-cut" d="m14 31 11 1 6-13 5 25 6-12h10"/></svg>`;
