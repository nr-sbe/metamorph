import {FORMS} from './rules';
import {weaponIcon,formRoles,formDescriptions,vitalityIcon} from './uiIcons';

export function shellMarkup(){return `
<div id="load"><div class="load-word">METAMORPH<span>/NYC</span></div><div class="loadbar"></div><p id="load-text">Growing the city. Initializing the organism.</p></div>
<div id="menu">
 <div class="topline"><span class="wordmark">M/M</span><span>NEW YORK. NEW ORGANISM.</span></div>
 <div class="edition">SINGLE PLAYER / URBAN SANDBOX</div>
 <div class="menu-art" aria-hidden="true">${weaponIcon('Whipfist','menu-weapon')}<span class="art-stamp">UNLEASH<br>YOURSELF.</span></div>
 <div class="menu-content"><div class="eyebrow">MIDTOWN / AFTER THE OUTBREAK</div><h1>METAMORPH<span>NYC<span class="title-slash">/</span></span></h1>
 <p class="menu-desc">THE CITY IS YOURS.<br><strong>BE THE CATASTROPHE.</strong></p>
 <nav class="menu-actions" aria-label="Main menu"><button id="play" class="cta">ENTER THE CITY <span>↗</span></button><button id="practice" class="secondary">COMBAT SANDBOX <span>+</span></button><button id="visual-study" class="secondary">VISUAL STUDY <span>+</span></button><button id="guide" class="secondary">CONTROLS & SETTINGS <span>↗</span></button><button id="resume-menu" class="secondary hidden">RESUME SESSION <span>↗</span></button></nav></div>
 <div class="menu-foot"><span>FIVE FORMS. ZERO RESTRAINT.</span><span>KEYBOARD + MOUSE / GAMEPAD</span></div>
</div>
<div id="hud" class="hidden">
 <div class="hud-top"><span class="hud-logo">M/M</span><span id="sector">MIDTOWN / CONTAINMENT ACTIVE</span></div>
 <div class="hud-right"><div class="score-chip"><span class="tiny-label">EVOLUTION</span><span id="score">0</span></div><button id="pause" class="icon-btn" aria-label="Pause game">Ⅱ</button><button id="help" class="icon-btn" aria-label="Controls and settings">?</button></div>
 <div id="objective"><div id="objective-label" class="objective-label">BREAK CONTAINMENT</div><div id="objective-title" class="objective-title">Reclaim the street</div><div id="objective-detail" class="objective-detail">Eliminate the hostile organisms.</div></div>
 <div class="reticle" aria-hidden="true"></div><div id="lock-target" class="hidden" aria-label="Locked target"></div>
 <div id="boss-health" class="hidden"><span id="boss-title"></span><div><i id="boss-fill"></i></div><small id="boss-phase"></small></div>
 <div id="danger" class="hidden">INCOMING</div><div id="action" class="hidden"></div><div id="charge" class="hidden"><i></i><span id="charge-caption"></span></div><div id="toast" class="hidden"></div>
 <div class="health-panel"><div class="vitality-stamp">${vitalityIcon}</div><div class="vitality-content"><div class="biomass-title"><span>VITALITY</span><strong id="health-number">100</strong></div><div class="health-track"><div id="health-fill"></div></div><div class="mass-label"><span>CRITICAL MASS</span><span id="mass-number">1 / 3</span></div><div class="mass-track"><div class="mass-segment"><i></i></div><div class="mass-segment"><i></i></div><div class="mass-segment"><i></i></div></div><div class="health-bottom"><span id="defense">NO DEFENSIVE FORM</span><span id="motion">GROUNDED</span></div></div></div>
 <div id="hint"><span><kbd>R</kbd><b id="mass-state">DEVASTATOR READY</b></span><span><kbd>F</kbd> GRAB <kbd>E</kbd> CONSUME</span></div>
 <div class="mutation-panel"><div class="mutation-caption"><span id="form-role">SLASH / LAUNCH</span><strong id="form-name">CLAWS</strong><small id="combat-inputs">LMB STRIKE / RMB SPECIAL</small><small id="special-status">FAULTLINE / READY</small></div><div id="formbar" role="group" aria-label="Weapon mutations">${FORMS.map((f,i)=>`<button class="form-slot ${i===1?'active':''}" data-form="${f}" aria-label="Select ${f}" aria-pressed="${i===1}" title="${i+1} / ${f}"><span class="glyph">${weaponIcon(f)}</span><kbd>${i+1}</kbd><span class="slot-tooltip">${f}</span></button>`).join('')}</div><button id="mutation-toggle" class="mutation-footer" aria-label="Change mutation" title="Hold Tab or click to change mutation"><kbd>TAB</kbd> CHANGE MUTATION</button></div>
 <div class="radar"><canvas id="mini" width="240" height="240" aria-label="Nearby enemies and streets"></canvas><div id="location">MIDTOWN WEST</div></div>
 <div id="fps" class="hidden"></div><div id="damage"></div>
</div>
<div id="wheel" class="hidden" role="dialog" aria-label="Mutation wheel"><div class="wheel-kicker">REWRITE YOUR ANATOMY</div><div class="wheel-title">CHOOSE YOUR<br><em>WEAPON.</em></div><div class="wheel-grid">${FORMS.map((f,i)=>`<button class="wheel-item" data-form="${f}" aria-label="Equip ${f}"><kbd>${i+1}</kbd>${weaponIcon(f)}<strong>${f}</strong><span class="wheel-role">${formRoles[f]}</span><span class="wheel-description">${formDescriptions[f]}</span></button>`).join('')}</div><div class="wheel-foot"><kbd>TAB</kbd> RELEASE TO RETURN <span>TIME SLOWED</span></div></div>
<div id="panel" class="hidden" role="dialog" aria-labelledby="panel-title"><div class="panel-inner"><div class="panel-top"><h2 id="panel-title">FIELD MANUAL</h2><button id="close-panel" class="icon-btn">CLOSE ×</button></div><div id="panel-body"></div></div></div>`;}
