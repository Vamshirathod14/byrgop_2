import React from 'react';
import ReactDOMServer from 'react-dom/server';
import KnowYourselfResult from '../_page.bundle.mjs';
import { VisualizationArea, ResultVisualizationStage, toPillarData, VIEWS } from './_page.bundle.mjs';

const COLORS = ['#0A78CF','#FCA700','#E52032','#0D8845','#F5630D','#7038A5'];
const NAMES = ['Strategic Direction','Financial Performance','Sales & Market Growth','Operations & Execution','People & Organization','Digital & Innovation'];
const PERCENTS = [63,100,63,25,0,25];
const categories = NAMES.map((name,i)=>({ key:String(i), name, percent:PERCENTS[i], color:COLORS[i] }));
const overall = Math.round(PERCENTS.reduce((a,b)=>a+b,0)/PERCENTS.length);

const result = {
  businessTypeLabel: 'Manufacturing',
  domainLabel: 'SME',
  result: {
    version: '2',
    categories,
    overallPercent: overall,
    band: overall >= 80 ? 'STRONG FOUNDATION' : overall >= 63 ? 'MODERATE PERFORMANCE' : overall >= 44 ? 'SIGNIFICANT GAPS' : 'CRITICAL GAPS',
    notApplicableCount: 2,
    priority: null,
  },
  reportRequest: null,
};

// A) The REAL page (radar default) — fully SSR'd, real layout hierarchy.
const realPage = ReactDOMServer.renderToString(
  React.createElement(KnowYourselfResult, {
    result,
    sessionId: 'x',
    onExplore: () => {},
    onLogoClick: () => {},
  })
);

// B) Every other view mounted inside the real stage (same heading/selector flow).
const data = toPillarData(categories);
const radarSlot = React.createElement('div', { style: { display:'flex', minHeight:420, alignItems:'center', justifyContent:'center', border:'1px dashed rgba(255,255,255,.2)', borderRadius:12 } }, 'RADAR (rendered via real page above)');
const others = VIEWS.filter(v=>v.id!=='radar').map(v =>
  React.createElement('section', { key: v.id, className:'demo', style: { margin:'0 auto 36px', width:'calc(100% - 40px)', maxWidth:1152 } },
    React.createElement('p', { style: { color:'#8a93a6', fontFamily:'sans-serif', fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', margin:'0 0 8px' } }, v.label + ' · inside real Stage'),
    React.createElement(ResultVisualizationStage, null,
      React.createElement(VisualizationArea, { view: v.id, data, overall, radarSlot })
    )
  )
).join('\n');

const css = await import('fs').then(fs => fs.readFileSync('/Users/vamshirathod/Desktop/byrgop/frontend/dist/assets/index-Dt3e7zOu.css','utf8'));
const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BYRGOP Result — TwelveLayouts-style Stage</title><style>
${css}
body { background:#0a0a0f; margin:0; padding:0 0 40px; }
.demo { border:1px solid rgba(255,255,255,.15); border-radius:16px; padding:10px 12px; background:rgba(255,255,255,.012); }
#note { color:#8a93a6; font-family:sans-serif; font-size:12px; padding:14px 20px 6px; text-align:center; }
</style></head><body>
<p id="note">Section A = real page (radar). Below = each other view inside the REAL ResultVisualizationStage. Resize to ~1440 / tablet / ~390. Stage sizes are measured live and listed in the footer.</p>
${realPage}
${others}
<div id="m" style="color:#8a93a6;font-family:sans-serif;font-size:11px;padding:6px 20px;"></div>
<script>
const stages = document.querySelectorAll('[data-testid="viz-stage"]');
const m = document.getElementById('m');
function measure(){
  let out = [];
  stages.forEach((s,i)=>{
    const r = s.getBoundingClientRect();
    const chart = s.querySelector('svg')?.getBoundingClientRect();
    out.push('#'+i+' stage='+Math.round(r.width)+'x'+Math.round(r.height)+(chart?('  chart='+Math.round(chart.width)+'x'+Math.round(chart.height)):''));
  });
  m.textContent = 'MEASURED ('+Math.round(innerWidth)+'px viewport): '+out.join('  |  ');
}
addEventListener('resize', measure); measure();
</script>
</body></html>`;
await import('fs').then(fs => fs.writeFileSync('/var/folders/cw/rr60pctj1fg6d5hf17_ldrhc0000gn/T/opencode/viz-page-check.html', html));
console.log('preview written');
