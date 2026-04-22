import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Star, Globe, Trophy, Users, Zap, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import PreGAApplicationDialog from '@/components/prega/PreGAApplicationDialog';

const GA_LOGO = 'https://ssprodst.blob.core.windows.net/logos/58/2821a300-9ff6-46d2-a00b-73be4dc4f316-04-02-2025-07-54-52-995.png';

const PHOTOS = {
  training1: 'https://media.base44.com/images/public/691b4f505049805bdf639ffd/c7603241a_camps-classes.jpg',
  team:      'https://media.base44.com/images/public/691b4f505049805bdf639ffd/67816335f_jags-GA-1.jpg',
  game:      'https://media.base44.com/images/public/691b4f505049805bdf639ffd/99d07a492_Jags-GA-2.jpg',
  training2: 'https://media.base44.com/images/public/691b4f505049805bdf639ffd/ff588c812_Small-group-training.jpg',
};

const BENEFITS = [
  { icon: Trophy, color: 'from-yellow-500 to-orange-500', border: 'border-yellow-400', title: 'Girls Academy Environment — Early', desc: 'Players are introduced to the premier girls\' soccer platform in the US at U10–U12, building identity and familiarity with the GA standard before U13 competition.' },
  { icon: Shield, color: 'from-emerald-500 to-teal-600', border: 'border-emerald-400', title: 'Clear Pathway to GA U13+', desc: 'Michigan Jaguars Pre-GA players get a structured, intentional bridge directly into the U13 Girls Academy program — the most seamless path available.' },
  { icon: Globe, color: 'from-blue-500 to-indigo-600', border: 'border-blue-400', title: 'Regional Competition & GA Events', desc: 'Compete regionally with reduced travel, flexible scheduling, and access to Girls Academy regional events alongside U13–U14 age groups.' },
  { icon: Users, color: 'from-purple-500 to-pink-600', border: 'border-purple-400', title: 'GA-Standard Coaching & Experience', desc: 'Michigan Jaguars Pre-GA teams are coached to Girls Academy standards — the same philosophy used at the elite U13–U19 level.' },
  { icon: Zap, color: 'from-rose-500 to-red-600', border: 'border-rose-400', title: 'Development-First, Low Pressure', desc: 'The platform prioritizes long-term athletic development, ensuring players build the right foundation without burnout or overloaded schedules.' },
  { icon: Star, color: 'from-amber-500 to-yellow-500', border: 'border-amber-400', title: 'Michigan Jaguars Club Advantage', desc: 'As a Great Lakes conference GA club, Michigan Jaguars is one of the first in the Midwest to offer this exclusive platform — a true advantage for our families.' },
];

const KEY_POINTS = [
  'Introduce players earlier to the Girls Academy environment',
  'Strengthen the transition into U13 Girls Academy competition',
  'Provide a development-first model with reduced travel and flexible scheduling',
  'Ensure alignment with GA standards in coaching, game-day environment, and player experience',
  'Regional play with flexible formats focused on player development',
  'Access to GA regional events alongside U13 and U14 age groups',
];

const QUOTES = [
  {
    quote: '"This is an important step forward for the Girls Academy. We are listening to our clubs and responding to the evolving landscape by creating a platform that protects the integrity of our pathway while prioritizing what is best for players. This initiative allows us to extend our standards and philosophy to younger age groups in a thoughtful and intentional way."',
    author: 'Patricia Hughes',
    title: 'Girls Academy Commissioner',
    accent: 'border-emerald-500 bg-emerald-900/40',
    initials: 'PH',
    avatarBg: 'bg-emerald-600',
  },
  {
    quote: '"The U-11 and U-12 ages are critical in a player\'s long-term development. This platform allows us to introduce players, coaches, and families to the Girls Academy environment earlier, without adding pressure, but with clear alignment to how we develop players. It\'s about building the foundation the right way."',
    author: 'Meghan Frey',
    title: 'Girls Academy Sporting Director',
    accent: 'border-blue-500 bg-blue-900/40',
    initials: 'MF',
    avatarBg: 'bg-blue-600',
  },
  {
    quote: '"This platform is exactly what our U10–U12 players have been waiting for. At Michigan Jaguars, we\'ve always believed that elite development starts long before U13. Being a founding Great Lakes club for the GA U11–U12 platform means our youngest players get the best possible foundation — the Jaguars way, backed by the best league in the country."',
    author: 'Mike Scobie',
    title: 'Girls Director — Michigan Jaguars FC',
    accent: 'border-yellow-400 bg-yellow-900/30',
    initials: 'MS',
    avatarBg: 'bg-yellow-600',
  },
];

// ── Trifold Brochure PDF ──────────────────────────────────────────────────────
function generateTrifold() {
  const printWindow = window.open('', '_blank');
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Michigan Jaguars Pre-GA Trifold 2026-27</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family:'Inter',sans-serif;
    background:#fff;
    color:#1e293b;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
    width:100%;
  }

  /* ── TRIFOLD LAYOUT: 3 equal panels side by side, landscape ── */
  .trifold {
    display:grid;
    grid-template-columns:1fr 1fr 1fr;
    width:100%;
    min-height:100vh;
    page-break-after:always;
  }

  /* PANEL BASE */
  .panel {
    padding:32px 26px;
    position:relative;
    overflow:hidden;
    border-right:1px dashed #cbd5e1;
  }
  .panel:last-child { border-right:none; }

  /* PANEL 1 — Cover (right-most when folded) */
  .panel-cover {
    background:linear-gradient(175deg, #052e16 0%, #064e3b 35%, #065f46 65%, #1e3a8a 100%);
    color:#fff;
    display:flex;
    flex-direction:column;
    justify-content:space-between;
  }
  .panel-cover::before {
    content:'';
    position:absolute; top:-80px; right:-80px;
    width:280px; height:280px;
    background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 70%);
    border-radius:50%;
  }
  .cover-logo-wrap { display:flex; align-items:center; gap:12px; margin-bottom:28px; position:relative; z-index:1; }
  .cover-logo { width:52px; height:52px; background:#fff; border-radius:12px; padding:6px; object-fit:contain; }
  .cover-club { font-size:13px; font-weight:900; }
  .cover-club-sub { font-size:9px; font-weight:600; color:#6ee7b7; margin-top:2px; }
  .cover-headline { font-size:30px; font-weight:900; line-height:1.1; margin-bottom:14px; position:relative; z-index:1; }
  .cover-headline span { color:#6ee7b7; }
  .cover-tagline { font-size:11px; color:rgba(255,255,255,0.75); line-height:1.65; margin-bottom:20px; position:relative; z-index:1; }
  .cover-photo-hero {
    width:100%; height:200px; object-fit:cover;
    border-radius:12px; margin-bottom:20px;
    position:relative; z-index:1;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
  }
  .cover-tags { display:flex; flex-wrap:wrap; gap:6px; position:relative; z-index:1; }
  .cover-tag {
    background:rgba(255,255,255,0.13); border:1px solid rgba(255,255,255,0.25);
    border-radius:20px; padding:3px 10px; font-size:9px; font-weight:700; letter-spacing:0.5px;
  }
  .cover-footer { position:relative; z-index:1; margin-top:auto; padding-top:20px; border-top:1px solid rgba(255,255,255,0.15); font-size:9px; color:rgba(255,255,255,0.55); }

  /* PANEL 2 — Middle: About + Benefits */
  .panel-middle { background:#f8fafc; }
  .section-label {
    font-size:10px; font-weight:900; letter-spacing:2px; text-transform:uppercase;
    color:#10b981; margin-bottom:8px;
  }
  .section-title { font-size:16px; font-weight:900; color:#0f172a; margin-bottom:12px; line-height:1.2; }
  .intro-text { font-size:10.5px; color:#475569; line-height:1.7; margin-bottom:18px; }
  .divider { height:1px; background:#e2e8f0; margin:18px 0; }

  .ben-list { display:flex; flex-direction:column; gap:8px; }
  .ben-item { display:flex; align-items:flex-start; gap:9px; }
  .ben-dot { width:22px; height:22px; border-radius:6px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:11px; }
  .ben-dot.y { background:#fef9c3; }
  .ben-dot.g { background:#dcfce7; }
  .ben-dot.b { background:#dbeafe; }
  .ben-dot.p { background:#f3e8ff; }
  .ben-dot.r { background:#ffe4e6; }
  .ben-dot.a { background:#fef3c7; }
  .ben-content {}
  .ben-title { font-size:10.5px; font-weight:800; color:#0f172a; margin-bottom:2px; }
  .ben-desc  { font-size:9.5px; color:#64748b; line-height:1.5; }

  /* PANEL 3 — Back: Quotes + CTA + Photos */
  .panel-back { background:#fff; }
  .photo-pair { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:18px; }
  .photo-pair img { width:100%; height:110px; object-fit:cover; border-radius:10px; box-shadow:0 4px 14px rgba(0,0,0,0.12); }
  .quote-item { margin-bottom:14px; padding:12px 14px; background:#f1f5f9; border-radius:10px; border-left:3px solid #10b981; }
  .quote-item.blue  { border-left-color:#3b82f6; }
  .quote-item.amber { border-left-color:#f59e0b; }
  .quote-text  { font-size:9.5px; font-style:italic; color:#334155; line-height:1.65; margin-bottom:6px; }
  .quote-name  { font-size:9.5px; font-weight:800; color:#0f172a; }
  .quote-role  { font-size:8.5px; color:#94a3b8; }

  .cta-panel {
    background:linear-gradient(135deg,#064e3b,#1e3a8a);
    border-radius:12px; padding:18px; color:#fff; text-align:center; margin-top:14px;
  }
  .cta-title { font-size:14px; font-weight:900; margin-bottom:6px; }
  .cta-sub   { font-size:9.5px; color:rgba(255,255,255,0.78); margin-bottom:12px; line-height:1.55; }
  .cta-link  { display:inline-block; background:#10b981; color:#fff; font-weight:800; font-size:10px; padding:8px 18px; border-radius:8px; text-decoration:none; letter-spacing:0.3px; }
  .cta-note  { margin-top:10px; font-size:8.5px; color:rgba(255,255,255,0.55); }

  /* AGE GROUPS */
  .age-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:18px; }
  .age-card { border-radius:8px; padding:10px 8px; text-align:center; }
  .age-card.u10 { background:#f5f3ff; border:1px solid #c4b5fd; }
  .age-card.u11 { background:#eff6ff; border:1px solid #93c5fd; }
  .age-card.u12 { background:#ecfdf5; border:1px solid #6ee7b7; }
  .age-badge { font-size:16px; font-weight:900; display:block; margin-bottom:3px; }
  .age-badge.u10 { color:#7c3aed; }
  .age-badge.u11 { color:#2563eb; }
  .age-badge.u12 { color:#059669; }
  .age-years { font-size:8px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }

  @page { size:landscape; margin:10mm; }
  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>

<div class="trifold">

  <!-- PANEL 1: COVER -->
  <div class="panel panel-cover">
    <div>
      <div class="cover-logo-wrap">
        <img class="cover-logo" src="${GA_LOGO}" alt="Michigan Jaguars" />
        <div>
          <div class="cover-club">Michigan Jaguars FC</div>
          <div class="cover-club-sub">Girls Academy · Great Lakes Conference</div>
        </div>
      </div>
      <div class="cover-headline">Pre-GA<br/>Platform<br/><span>U10 · U11 · U12</span></div>
      <div class="cover-tagline">Michigan Jaguars is proud to be part of the Girls Academy's historic U11–U12 platform launch — bringing the nation's premier girls' soccer development to our youngest players in 2026–27.</div>
      <img class="cover-photo-hero" src="${PHOTOS.training1}" alt="Michigan Jaguars Pre-GA training" />
      <div class="cover-tags">
        <span class="cover-tag">Girls Academy Certified</span>
        <span class="cover-tag">Great Lakes Conference</span>
        <span class="cover-tag">2026–27 Season</span>
        <span class="cover-tag">Development First</span>
      </div>
    </div>
    <div class="cover-footer">Michigan Jaguars FC · michiganjaguarsfc.com · 2026–27</div>
  </div>

  <!-- PANEL 2: ABOUT + BENEFITS -->
  <div class="panel panel-middle">
    <div class="section-label">About the Platform</div>
    <div class="section-title">Girls Academy Launches a Historic U11–U12 Platform</div>
    <div class="intro-text">The Girls Academy — the premier youth development platform in the US — has launched its U11–U12 platform for 2026–27. Michigan Jaguars, as a founding Great Lakes GA club, is one of the first in the Midwest to offer this. Our Pre-GA teams are fully integrated into the GA ecosystem — same standards, same philosophy, same pathway as our elite U13–U19 teams.</div>

    <div class="age-grid">
      <div class="age-card u10"><span class="age-badge u10">U10</span><div class="age-years">Born 2016–17</div></div>
      <div class="age-card u11"><span class="age-badge u11">U11</span><div class="age-years">Born 2014–15</div></div>
      <div class="age-card u12"><span class="age-badge u12">U12</span><div class="age-years">Born 2013–14</div></div>
    </div>

    <div class="divider"></div>
    <div class="section-label">Why Michigan Jaguars Pre-GA?</div>
    <div class="ben-list">
      <div class="ben-item"><div class="ben-dot y">🏆</div><div class="ben-content"><div class="ben-title">Girls Academy Environment — Early</div><div class="ben-desc">Players build GA identity and familiarity with the standard before U13 competition begins.</div></div></div>
      <div class="ben-item"><div class="ben-dot g">🛡️</div><div class="ben-content"><div class="ben-title">Clear Pathway to GA U13+</div><div class="ben-desc">A structured bridge directly into U13 Girls Academy — the most seamless path available.</div></div></div>
      <div class="ben-item"><div class="ben-dot b">🌎</div><div class="ben-content"><div class="ben-title">Regional Competition & GA Events</div><div class="ben-desc">Regional play with reduced travel and access to GA events alongside U13–U14 age groups.</div></div></div>
      <div class="ben-item"><div class="ben-dot p">👥</div><div class="ben-content"><div class="ben-title">GA-Standard Coaching</div><div class="ben-desc">Same philosophy and development model used at the elite U13–U19 level.</div></div></div>
      <div class="ben-item"><div class="ben-dot r">⚡</div><div class="ben-content"><div class="ben-title">Development-First, Low Pressure</div><div class="ben-desc">Long-term athletic development without burnout or overloaded schedules.</div></div></div>
      <div class="ben-item"><div class="ben-dot a">⭐</div><div class="ben-content"><div class="ben-title">Michigan Jaguars Club Advantage</div><div class="ben-desc">One of the first Midwest clubs to offer this platform — a true advantage for families.</div></div></div>
    </div>
  </div>

  <!-- PANEL 3: QUOTES + PHOTOS + CTA -->
  <div class="panel panel-back">
    <div class="section-label">In Their Own Words</div>

    <div class="photo-pair">
      <img src="${PHOTOS.game}" alt="GA game action" />
      <img src="${PHOTOS.training2}" alt="Training session" />
    </div>

    <div class="quote-item">
      <div class="quote-text">"This is an important step forward for the Girls Academy. We are creating a platform that protects the integrity of our pathway while prioritizing what is best for players."</div>
      <div class="quote-name">Patricia Hughes</div>
      <div class="quote-role">Girls Academy Commissioner</div>
    </div>
    <div class="quote-item blue">
      <div class="quote-text">"The U-11 and U-12 ages are critical in a player's long-term development. This platform lets us introduce players to the GA environment earlier — without pressure, with clear alignment."</div>
      <div class="quote-name">Meghan Frey</div>
      <div class="quote-role">Girls Academy Sporting Director</div>
    </div>
    <div class="quote-item amber">
      <div class="quote-text">"At Michigan Jaguars, elite development starts long before U13. Being a founding Great Lakes GA club means our youngest players get the best foundation — the Jaguars way."</div>
      <div class="quote-name">Mike Scobie</div>
      <div class="quote-role">Girls Director — Michigan Jaguars FC</div>
    </div>

    <div class="cta-panel">
      <div class="cta-title">Join Michigan Jaguars Pre-GA</div>
      <div class="cta-sub">Limited spots for U10, U11 &amp; U12 players in 2026–27.<br/>Be part of the Girls Academy from the very beginning.</div>
      <a class="cta-link" href="https://system.gotsport.com/forms/215777I23">Join Us — Apply Now ›</a>
      <div class="cta-note">Questions? Contact Mike Scobie, Girls Director · michiganjaguarsfc.com</div>
    </div>
  </div>

</div>

<script>
  window.onload = function() { window.print(); }
</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ── Standard info PDF ─────────────────────────────────────────────────────────
function generatePDF() {
  const printWindow = window.open('', '_blank');
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Michigan Jaguars Pre-GA Platform 2026-27</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#fff; color:#1e293b; -webkit-print-color-adjust:exact; print-color-adjust:exact; }

  .cover { background:linear-gradient(135deg,#064e3b 0%,#065f46 35%,#1e3a8a 100%); color:#fff; padding:52px 50px 44px; position:relative; overflow:hidden; page-break-after:always; }
  .cover::before { content:''; position:absolute; top:-100px; right:-100px; width:500px; height:500px; background:radial-gradient(circle,rgba(255,255,255,0.06) 0%,transparent 70%); border-radius:50%; }
  .cover-top { display:flex; align-items:center; gap:18px; margin-bottom:28px; }
  .cover-logo { width:68px; height:68px; border-radius:14px; background:#fff; padding:7px; object-fit:contain; }
  .cover-brand-name { font-size:20px; font-weight:900; }
  .cover-brand-sub { font-size:11px; font-weight:600; color:#6ee7b7; margin-top:2px; }
  .ga-badge { margin-left:auto; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3); border-radius:8px; padding:5px 12px; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
  .cover h1 { font-size:42px; font-weight:900; line-height:1.1; margin-bottom:14px; }
  .cover h1 span { color:#6ee7b7; }
  .cover-sub { font-size:14px; color:rgba(255,255,255,0.82); max-width:500px; line-height:1.65; margin-bottom:24px; }
  .tags { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:28px; }
  .tag { background:rgba(255,255,255,0.14); border-radius:20px; padding:4px 13px; font-size:10px; font-weight:700; }

  /* Full-width hero photo — no small thumbnails */
  .hero-photo { width:100%; height:280px; object-fit:cover; border-radius:14px; box-shadow:0 12px 40px rgba(0,0,0,0.4); position:relative; z-index:1; }

  .body { padding:44px 50px; }
  .section-title { font-size:19px; font-weight:800; color:#064e3b; border-left:4px solid #10b981; padding-left:13px; margin-bottom:18px; margin-top:36px; }
  .intro-box { background:linear-gradient(135deg,#ecfdf5,#eff6ff); border:1px solid #a7f3d0; border-radius:14px; padding:24px 28px; margin-bottom:28px; }
  .intro-box p { font-size:13px; line-height:1.75; color:#334155; }
  .kp-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:28px; }
  .kp-item { display:flex; align-items:flex-start; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:9px; padding:11px 13px; }
  .kp-dot { width:18px; height:18px; border-radius:50%; background:linear-gradient(135deg,#10b981,#3b82f6); flex-shrink:0; margin-top:2px; }
  .kp-text { font-size:12px; color:#334155; line-height:1.5; font-weight:500; }

  /* Full-width photos inside body */
  .full-photo { width:100%; height:240px; object-fit:cover; border-radius:14px; margin-bottom:28px; box-shadow:0 6px 24px rgba(0,0,0,0.12); }
  .photo-pair { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:28px; }
  .photo-pair img { width:100%; height:200px; object-fit:cover; border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.1); }

  .ben-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:28px; }
  .ben-card { border-radius:12px; padding:18px; page-break-inside:avoid; }
  .ben-card.yellow { background:#fefce8; border:1px solid #fde68a; }
  .ben-card.green  { background:#ecfdf5; border:1px solid #6ee7b7; }
  .ben-card.blue   { background:#eff6ff; border:1px solid #bfdbfe; }
  .ben-card.purple { background:#faf5ff; border:1px solid #d8b4fe; }
  .ben-card.rose   { background:#fff1f2; border:1px solid #fda4af; }
  .ben-card.amber  { background:#fffbeb; border:1px solid #fcd34d; }
  .ben-title { font-size:12.5px; font-weight:800; color:#1e293b; margin-bottom:6px; }
  .ben-desc  { font-size:11px; color:#475569; line-height:1.6; }
  .quote-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:28px; }
  .quote-box { background:#f1f5f9; border-radius:12px; padding:18px; border-left:4px solid #10b981; page-break-inside:avoid; }
  .quote-box.blue  { border-left-color:#3b82f6; }
  .quote-box.amber { border-left-color:#f59e0b; }
  .quote-text   { font-size:11px; font-style:italic; color:#334155; line-height:1.7; margin-bottom:10px; }
  .quote-author { font-size:10.5px; font-weight:700; color:#064e3b; }
  .quote-role   { font-size:9.5px; color:#64748b; margin-top:2px; }
  .cta-box { background:linear-gradient(135deg,#064e3b,#1e3a8a); border-radius:14px; padding:28px 32px; color:#fff; text-align:center; }
  .cta-title { font-size:20px; font-weight:900; margin-bottom:8px; }
  .cta-sub   { font-size:12px; color:rgba(255,255,255,0.8); margin-bottom:18px; line-height:1.6; }
  .cta-link  { display:inline-block; background:#10b981; color:#fff; font-weight:700; font-size:12px; padding:11px 26px; border-radius:9px; text-decoration:none; }
  .cta-contact { margin-top:14px; font-size:11px; color:rgba(255,255,255,0.6); }
  .footer { text-align:center; padding:20px 50px; border-top:1px solid #e2e8f0; font-size:10px; color:#94a3b8; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .cover { page-break-after:always; } }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-top">
    <img class="cover-logo" src="${GA_LOGO}" alt="Michigan Jaguars" />
    <div>
      <div class="cover-brand-name">Michigan Jaguars FC</div>
      <div class="cover-brand-sub">Player &amp; Team Development · Girls Academy Club</div>
    </div>
    <div class="ga-badge">Girls Academy Partner</div>
  </div>
  <h1>Pre-GA Platform<br/><span>U10 · U11 · U12</span></h1>
  <div class="cover-sub">Michigan Jaguars is proud to be part of the Girls Academy's historic launch of the U11–U12 platform — bringing the nation's premier girls' soccer development environment to our youngest players starting in the 2026–27 season.</div>
  <div class="tags">
    <span class="tag">Girls Academy Certified</span>
    <span class="tag">Great Lakes Conference</span>
    <span class="tag">2026–27 Season</span>
    <span class="tag">Development First</span>
  </div>
  <img class="hero-photo" src="${PHOTOS.training1}" alt="Michigan Jaguars Pre-GA training" />
</div>

<div class="body">
  <div class="section-title">What Is the Pre-GA Platform?</div>
  <div class="intro-box">
    <p>The Girls Academy — the leading youth development platform for girls' soccer in the United States — has officially launched its U11–U12 platform for the 2026–27 season. Michigan Jaguars, as a founding Great Lakes conference Girls Academy club, is one of the first organizations in the Midwest to offer this platform. Our Pre-GA teams (U10, U11, U12) are now fully integrated into the Girls Academy ecosystem.</p>
  </div>

  <div class="section-title">Platform Pillars</div>
  <div class="kp-grid">
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Introduce players earlier to the Girls Academy environment</div></div>
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Strengthen the transition into U13 Girls Academy competition</div></div>
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Development-first model with reduced travel and flexible scheduling</div></div>
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Alignment with GA standards in coaching and player experience</div></div>
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Regional play with flexible formats focused on player development</div></div>
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Access to GA regional events alongside U13 and U14 age groups</div></div>
  </div>

  <div class="photo-pair">
    <img src="${PHOTOS.team}" alt="Michigan Jaguars team huddle" />
    <img src="${PHOTOS.game}" alt="Michigan Jaguars game action" />
  </div>

  <div class="section-title">Benefits for Michigan Jaguars Players</div>
  <div class="ben-grid">
    <div class="ben-card yellow"><div class="ben-title">🏆 Girls Academy Environment — Early</div><div class="ben-desc">Players are introduced to the premier girls' soccer platform at U10–U12, building identity before U13 competition.</div></div>
    <div class="ben-card green"><div class="ben-title">🛡️ Clear Pathway to GA U13+</div><div class="ben-desc">A structured, intentional bridge directly into the U13 Girls Academy program — the most seamless path available.</div></div>
    <div class="ben-card blue"><div class="ben-title">🌎 Regional Competition &amp; GA Events</div><div class="ben-desc">Compete regionally with reduced travel and access to GA events alongside U13–U14 age groups.</div></div>
    <div class="ben-card purple"><div class="ben-title">👥 GA-Standard Coaching</div><div class="ben-desc">Same philosophy and development model used at the elite U13–U19 level.</div></div>
    <div class="ben-card rose"><div class="ben-title">⚡ Development-First, Low Pressure</div><div class="ben-desc">Long-term athletic development without burnout or overloaded schedules.</div></div>
    <div class="ben-card amber"><div class="ben-title">⭐ Michigan Jaguars Club Advantage</div><div class="ben-desc">One of the first Midwest clubs offering this platform — a true advantage for our families.</div></div>
  </div>

  <img class="full-photo" src="${PHOTOS.training2}" alt="Michigan Jaguars small group training" />

  <div class="section-title">Leadership Voices</div>
  <div class="quote-grid">
    <div class="quote-box">
      <div class="quote-text">"This is an important step forward for the Girls Academy. We are listening to our clubs and creating a platform that protects the integrity of our pathway while prioritizing what is best for players."</div>
      <div class="quote-author">Patricia Hughes</div>
      <div class="quote-role">GA Commissioner</div>
    </div>
    <div class="quote-box blue">
      <div class="quote-text">"The U-11 and U-12 ages are critical in long-term development. This platform allows us to introduce players to the GA environment earlier — without pressure, with clear alignment to how we develop players."</div>
      <div class="quote-author">Meghan Frey</div>
      <div class="quote-role">GA Sporting Director</div>
    </div>
    <div class="quote-box amber">
      <div class="quote-text">"At Michigan Jaguars, elite development starts long before U13. Being a founding Great Lakes GA club means our youngest players get the best possible foundation — the Jaguars way."</div>
      <div class="quote-author">Mike Scobie</div>
      <div class="quote-role">Girls Director — Michigan Jaguars FC</div>
    </div>
  </div>

  <div class="cta-box">
    <div class="cta-title">Join Michigan Jaguars Pre-GA</div>
    <div class="cta-sub">Limited spots available for U10, U11, and U12 players in the 2026–27 season.<br/>Be part of something historic — the Girls Academy platform from the very beginning.</div>
    <a class="cta-link" href="https://system.gotsport.com/forms/215777I23" target="_blank">Join Us — Apply Now ›</a>
    <div class="cta-contact">Questions? Contact Girls Director Mike Scobie · michiganjaguarsfc.com</div>
  </div>
</div>

<div class="footer">Michigan Jaguars FC · Girls Academy Great Lakes Conference · michiganjaguarsfc.com · 2026–27 Season</div>

<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PreGA() {
  const [showApply, setShowApply] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-blue-950">
        {/* bg photo overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url(${PHOTOS.team})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-emerald-950/70 to-blue-950/80" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-0">
          {/* top bar */}
          <div className="flex items-center gap-4 mb-12">
            <img src={GA_LOGO} alt="Michigan Jaguars" className="w-16 h-16 rounded-2xl bg-white p-2 object-contain shadow-2xl ring-2 ring-emerald-400/30" />
            <div className="h-10 w-px bg-white/20" />
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase text-emerald-400 mb-0.5">Girls Academy · Great Lakes Conference</div>
              <div className="text-sm font-bold text-white/70">Michigan Jaguars FC</div>
            </div>
            <Badge className="ml-auto bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold px-3 py-1.5 uppercase tracking-widest">
              2026–27 Launch
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            <div className="pb-16">
              <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 mb-7">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-300 text-sm font-bold">Historic Launch — Girls Academy U11–U12 Platform</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black leading-none mb-6 text-white">
                Michigan<br />Jaguars<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Pre-GA</span>
              </h1>
              <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
                U10 · U11 · U12 players now enter the Girls Academy ecosystem from the very beginning — with Michigan Jaguars leading the way in the Great Lakes.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={generatePDF}
                  size="lg"
                  className="bg-white text-emerald-900 hover:bg-emerald-50 font-black shadow-2xl px-7"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Info Brochure
                </Button>
                <Button
                  onClick={generateTrifold}
                  size="lg"
                  className="bg-white/15 border border-white/30 hover:bg-white/25 text-white font-black px-7 shadow-2xl"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Trifold
                </Button>
                <Button
                  size="lg"
                  onClick={() => setShowApply(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-7 shadow-2xl shadow-emerald-900/50"
                >
                  Join Us →
                </Button>
              </div>
            </div>

            {/* Hero photo collage */}
            <div className="hidden lg:grid grid-cols-2 gap-3 pb-0 self-end">
              <div className="space-y-3">
                <img src={PHOTOS.game} alt="GA game action" className="w-full h-52 object-cover rounded-2xl shadow-2xl ring-1 ring-white/10" />
                <img src={PHOTOS.training1} alt="Training" className="w-full h-40 object-cover rounded-2xl shadow-2xl ring-1 ring-white/10" />
              </div>
              <div className="space-y-3 mt-8">
                <img src={PHOTOS.training2} alt="Small group training" className="w-full h-40 object-cover rounded-2xl shadow-2xl ring-1 ring-white/10" />
                <img src={PHOTOS.team} alt="Team huddle" className="w-full h-52 object-cover rounded-2xl shadow-2xl ring-1 ring-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* wave */}
        <div className="relative h-20 mt-0">
          <svg viewBox="0 0 1440 80" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,80 L0,40 Q360,0 720,40 Q1080,80 1440,40 L1440,80 Z" fill="#f8fafc" />
          </svg>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="bg-slate-50">

        {/* AGE GROUPS */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-3">Who Is This For?</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">Michigan Jaguars Pre-GA is built for players in these age groups who want the best possible start to their Girls Academy journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              { age: 'U10', color: 'from-purple-600 to-indigo-700', border: 'border-purple-300', bg: 'bg-white', text: 'text-purple-700', years: 'Born 2016–2017', desc: 'Build confidence, technical foundation, and love of the game in a GA-certified environment.' },
              { age: 'U11', color: 'from-blue-600 to-cyan-700', border: 'border-blue-300', bg: 'bg-white', text: 'text-blue-700', years: 'Born 2014–2015', desc: 'Enter the official Girls Academy U11–U12 platform with Michigan Jaguars as a founding Great Lakes club.' },
              { age: 'U12', color: 'from-emerald-600 to-teal-700', border: 'border-emerald-300', bg: 'bg-white', text: 'text-emerald-700', years: 'Born 2013–2014', desc: 'Compete in the new GA platform and position yourself perfectly for U13 Girls Academy competition.' },
            ].map(item => (
              <div key={item.age} className={`rounded-3xl border-2 ${item.border} ${item.bg} p-8 text-center shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2`}>
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br ${item.color} text-white font-black text-4xl shadow-xl mb-5 ring-4 ring-offset-2 ring-offset-white ${item.border}`}>
                  {item.age}
                </div>
                <div className={`text-sm font-black ${item.text} mb-2 uppercase tracking-widest`}>{item.years}</div>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* ABOUT SECTION with photo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-2 mb-6">
                <Globe className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-800 text-sm font-black">About the Platform</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">
                Girls Academy Launches a<br />
                <span className="text-emerald-600">Historic U11–U12 Platform</span>
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4 text-base">
                Announced April 14, 2026, the Girls Academy is launching a dedicated U11–U12 competitive platform for the 2026–27 season — a landmark moment for girls' youth soccer in the United States.
              </p>
              <p className="text-slate-600 leading-relaxed mb-8 text-base">
                The Great Lakes conference, which includes Michigan Jaguars, is among the first regions selected for the initial rollout. Jaguars families get early, priority access.
              </p>
              <a
                href="https://girlsacademyleague.com/2026/04/girls-academy-launches-u11-u12-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-700 font-black text-sm hover:text-emerald-900 transition-colors"
              >
                Read the Full GA Announcement
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="space-y-3">
              {KEY_POINTS.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 bg-white border border-slate-200 shadow-sm rounded-2xl px-5 py-4 hover:border-emerald-300 hover:shadow-md transition-all">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-800 font-semibold text-sm">{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PHOTO GALLERY */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
            {Object.values(PHOTOS).map((src, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl shadow-lg aspect-square group">
                <img src={src} alt="Michigan Jaguars Pre-GA" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          {/* BENEFITS */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-900 mb-3">Benefits for Michigan Jaguars Players</h2>
              <p className="text-slate-500 max-w-lg mx-auto text-base">Here's exactly what you and your player gain by being part of the Jaguars Pre-GA program.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map((b, i) => (
                <div key={i} className={`rounded-2xl border-2 ${b.border} bg-white p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1`}>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${b.color} text-white shadow-md mb-4`}>
                    <b.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-2">{b.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* LEADERSHIP QUOTES */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-900 mb-3">Leadership on the Platform</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {QUOTES.map((q, i) => (
                <div key={i} className="bg-slate-900 border border-slate-700 rounded-2xl p-7 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <p className="text-slate-300 italic leading-relaxed text-sm mb-5 relative z-10">{q.quote}</p>
                  <div>
                    <div className="font-black text-white text-sm">{q.author}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{q.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-blue-800 text-white p-12 md:p-16 text-center shadow-2xl">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${PHOTOS.training1})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/90 to-blue-900/90" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-5 py-2 mb-6">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-black text-white">Limited 2026–27 Spots Available</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-5">Join Michigan Jaguars Pre-GA</h2>
              <p className="text-white/80 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                Download our full PDF brochure or apply directly. Be part of the Girls Academy from the very beginning of your soccer journey.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={generatePDF}
                  size="lg"
                  className="bg-white text-emerald-900 hover:bg-emerald-50 font-black px-10 shadow-2xl text-base h-14"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF Brochure
                </Button>
                <Button
                  onClick={generateTrifold}
                  size="lg"
                  className="bg-white/20 border border-white/40 hover:bg-white/30 text-white font-black px-10 shadow-2xl text-base h-14"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Trifold Brochure
                </Button>
                <Button
                  size="lg"
                  onClick={() => setShowApply(true)}
                  className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black px-10 shadow-2xl text-base h-14"
                >
                  Join Us →
                </Button>
              </div>
              <p className="text-white/50 text-xs mt-8">Questions? Contact Girls Director Mike Scobie or visit michiganjaguarsfc.com</p>
            </div>
          </div>
        </div>
      </div>

      <PreGAApplicationDialog open={showApply} onClose={() => setShowApply(false)} />
    </div>
  );
}