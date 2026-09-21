import React from 'react';
import ReactDOMServer from 'react-dom/server';
import KnowYourselfResult from './_page.bundle.mjs';
import { VisualizationArea, ResultVisualizationStage, toPillarData, VIEWS } from './_viz.bundle.mjs';

const COLORS = ['#0A78CF','#FCA700','#E52032','#0D8845','#F5630D','#7038A5'];
const NAMES = ['Strategic Direction','Financial Performance','Sales & Market Growth','Operations & Execution','People & Organization','Digital & Innovation'];
const PERCENTS = [63,100,63,25,0,25];
const categories = NAMES.map((name,i)=>({ key:String(i), name, percent:PERCENTS[i], color:COLORS[i] }));
const overall = Math.round(PERCENTS.reduce((a,b)=>a+b,0)/PERCENTS.length);
const result = {
  businessTypeLabel: 'Manufacturing', domainLabel: 'SME',
  result: {
    version: '2', categories, overallPercent: overall,
    band: overall >= 80 ? 'STRONG FOUNDATION' : overall >= 63 ? 'MODERATE PERFORMANCE' : overall >= 44 ? 'SIGNIFICANT GAPS' : 'CRITICAL GAPS',
    notApplicableCount: 2, priority: null,
  },
  reportRequest: null,
};
const realPage = ReactDOMServer.renderToString(React.createElement(KnowYourselfResult, { result, sessionId:'x', onExplore:()=>{}, onLogoClick:()=>{} }));
const data = toPillarData(categories);
const others = VIEWS.filter(v=>v.id!=='radar').map(v =>
  React.createElement('section', { key:v.id, className:'demo', style:{ margin:'0 auto 36px', width:'calc(100% - 40px)', maxWidth:1152 } },
    React.createElement('p', { style:{ color:'#8a93a6', fontFamily:'sans-serif', fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', margin:'0 0 8px' } }, v.label),
    React.createElement(ResultVisualizationStage, null, React.createElement(VisualizationArea, { view:v.id, data, overall }))
  )
).join('\n');
const css = await import('fs').then(fs=>fs.readFileSync('/Users/vamshirathod/Desktop/byrgop/frontend/dist/assets/index-Dt3e7zOu.css','utf8'));
const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BYRGOP Result — Stage Check</title><style>
${css}
body{background:#0a0a0f;margin:0;padding:0 0 40px}
.demo{border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:10px 12px;margin-top:8px}
#note{color:#8a93a6;font-family:sans-serif;font-size:12px;padding:14px 20px 6px;text-align:center}
</style></head><body>
<p id="note">Section A = real page (radar default). Each view below runs inside the REAL ResultVisualizationStage. Resize to ~1440 / tablet / ~390. Stage+chart are measured live in the footer.</p>
${realPage}
${others}
<div id="m" style="color:#8a93a6;font-family:sans-serif;font-size:11px;padding:6px 20px;"></div>
<script>
const stages=[...document.querySelectorAll('[data-testid="viz-stage"]')];
const m=document.getElementById('m');
function measure(){let out=['view'].concat(stages.map((s,i)=>{const r=s.getBoundingClientRect();const c=[...s.querySelectorAll('svg')][s.querySelectorAll('svg').length-1]?.getBoundingClientRect();return '#'+i+' stage='+Math.round(r.width)+'x'+Math.round(r.height)+(c?('  chart='+Math.round(c.width)+'x'+Math.round(c.height)):'')})).join('  |  ');m.textContent='MEASURED ('+Math.round(innerWidth)+'px): stages '+out;}
addEventListener('resize',measure);measure();
</script>
</body></html>`;
await import('fs').then(fs=>fs.writeFileSync('/var/folders/cw/rr60pctj1fg6d5hf17_ldrhc0000gn/T/opencode/viz-page-check.html',html));
console.log('preview written');
