import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Star, Globe, Trophy, Users, Zap, Shield, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';

const GA_LOGO = 'https://ssprodst.blob.core.windows.net/logos/58/2821a300-9ff6-46d2-a00b-73be4dc4f316-04-02-2025-07-54-52-995.png';

const BENEFITS = [
  {
    icon: Trophy,
    color: 'from-yellow-500 to-orange-500',
    bg: 'bg-yellow-50 border-yellow-200',
    title: 'Girls Academy Environment — Early',
    desc: 'Players are introduced to the premier girls\' soccer platform in the US at U10–U12, building identity and familiarity with the GA standard before U13 competition.',
  },
  {
    icon: Shield,
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 border-emerald-200',
    title: 'Clear Pathway to GA U13+',
    desc: 'Michigan Jaguars Pre-GA players get a structured, intentional bridge directly into the U13 Girls Academy program — the most seamless path available.',
  },
  {
    icon: Globe,
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 border-blue-200',
    title: 'Regional Competition & GA Events',
    desc: 'Compete regionally with reduced travel, flexible scheduling, and access to Girls Academy regional events alongside U13–U14 age groups.',
  },
  {
    icon: Users,
    color: 'from-purple-500 to-pink-600',
    bg: 'bg-purple-50 border-purple-200',
    title: 'GA-Standard Coaching & Experience',
    desc: 'Michigan Jaguars Pre-GA teams are coached to Girls Academy standards — the same philosophy, language, and development model used at the elite U13–U19 level.',
  },
  {
    icon: Zap,
    color: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50 border-rose-200',
    title: 'Development-First, Low Pressure',
    desc: 'No overloaded schedules. The platform prioritizes long-term athletic development, ensuring players build the right foundation without burnout.',
  },
  {
    icon: Star,
    color: 'from-amber-500 to-yellow-500',
    bg: 'bg-amber-50 border-amber-200',
    title: 'Michigan Jaguars Club Advantage',
    desc: 'As a Great Lakes conference member of the Girls Academy, Michigan Jaguars is one of the first clubs in the region to offer this exclusive U11–U12 platform.',
  },
];

const KEY_POINTS = [
  'Introduce players earlier to the Girls Academy environment',
  'Strengthen the transition into U13 Girls Academy competition',
  'Provide a development-first model with reduced travel and flexible scheduling',
  'Ensure alignment with GA standards in coaching, game-day environment, and player experience',
  'Regional play with flexible formats focused on player development',
  'Access to Girls Academy regional events alongside U13 and U14 age groups',
];

// ── PDF Generation ─────────────────────────────────────────────────────────────
function generatePDF() {
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#fff; color:#1e293b; }

  /* COVER */
  .cover {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 40%, #1e40af 100%);
    color:#fff;
    padding: 60px 50px 50px;
    position: relative;
    overflow: hidden;
    min-height: 340px;
  }
  .cover::before {
    content:'';
    position:absolute; top:-80px; right:-80px;
    width:400px; height:400px;
    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
    border-radius:50%;
  }
  .cover-top { display:flex; align-items:center; gap:20px; margin-bottom:32px; }
  .cover-logo { width:72px; height:72px; border-radius:16px; background:#fff; padding:8px; object-fit:contain; }
  .cover-brand { flex:1; }
  .cover-brand-name { font-size:22px; font-weight:900; letter-spacing:-0.5px; }
  .cover-brand-sub  { font-size:12px; font-weight:600; color:#6ee7b7; margin-top:2px; }
  .ga-badge {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius:8px; padding:6px 14px;
    font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;
  }
  .cover h1 { font-size:36px; font-weight:900; line-height:1.15; margin-bottom:12px; }
  .cover h1 span { color:#6ee7b7; }
  .cover-subtitle { font-size:15px; color:rgba(255,255,255,0.85); max-width:520px; line-height:1.6; }
  .cover-tags { display:flex; gap:10px; margin-top:28px; flex-wrap:wrap; }
  .cover-tag {
    background:rgba(255,255,255,0.15);
    border-radius:20px; padding:5px 14px;
    font-size:11px; font-weight:700; letter-spacing:0.5px;
  }

  /* BODY */
  .body { padding: 48px 50px; }

  .section-title {
    font-size:20px; font-weight:800; color:#064e3b;
    border-left:4px solid #10b981;
    padding-left:14px; margin-bottom:20px;
  }

  /* INTRO BOX */
  .intro-box {
    background: linear-gradient(135deg, #ecfdf5, #eff6ff);
    border:1px solid #a7f3d0; border-radius:16px;
    padding:28px 30px; margin-bottom:36px;
  }
  .intro-box p { font-size:13.5px; line-height:1.75; color:#334155; }

  /* KEY POINTS */
  .kp-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:36px; }
  .kp-item {
    display:flex; align-items:flex-start; gap:10px;
    background:#f8fafc; border:1px solid #e2e8f0;
    border-radius:10px; padding:12px 14px;
  }
  .kp-dot { width:20px; height:20px; border-radius:50%; background:linear-gradient(135deg,#10b981,#3b82f6); flex-shrink:0; margin-top:1px; }
  .kp-text { font-size:12.5px; color:#334155; line-height:1.5; font-weight:500; }

  /* BENEFITS */
  .ben-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:36px; }
  .ben-card {
    border-radius:14px; padding:20px;
    page-break-inside: avoid;
  }
  .ben-card.yellow { background:#fefce8; border:1px solid #fde68a; }
  .ben-card.green  { background:#ecfdf5; border:1px solid #6ee7b7; }
  .ben-card.blue   { background:#eff6ff; border:1px solid #bfdbfe; }
  .ben-card.purple { background:#faf5ff; border:1px solid #d8b4fe; }
  .ben-card.rose   { background:#fff1f2; border:1px solid #fda4af; }
  .ben-card.amber  { background:#fffbeb; border:1px solid #fcd34d; }
  .ben-title { font-size:13px; font-weight:800; color:#1e293b; margin-bottom:7px; }
  .ben-desc  { font-size:11.5px; color:#475569; line-height:1.6; }

  /* QUOTES */
  .quote-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:36px; }
  .quote-box {
    background:#f1f5f9; border-radius:14px; padding:22px;
    border-left:4px solid #10b981;
  }
  .quote-text { font-size:12.5px; font-style:italic; color:#334155; line-height:1.7; margin-bottom:10px; }
  .quote-author { font-size:11px; font-weight:700; color:#064e3b; }

  /* CTA */
  .cta-box {
    background: linear-gradient(135deg, #064e3b, #1e40af);
    border-radius:16px; padding:32px 36px;
    color:#fff; text-align:center;
  }
  .cta-title { font-size:22px; font-weight:900; margin-bottom:10px; }
  .cta-sub   { font-size:13px; color:rgba(255,255,255,0.85); margin-bottom:20px; line-height:1.6; }
  .cta-link  { display:inline-block; background:#10b981; color:#fff; font-weight:700; font-size:13px; padding:12px 28px; border-radius:10px; text-decoration:none; }
  .cta-contact { margin-top:16px; font-size:12px; color:rgba(255,255,255,0.7); }

  /* FOOTER */
  .footer {
    text-align:center; padding:24px 50px;
    border-top:1px solid #e2e8f0;
    font-size:11px; color:#94a3b8;
  }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-top">
    <img class="cover-logo" src="https://ssprodst.blob.core.windows.net/logos/58/2821a300-9ff6-46d2-a00b-73be4dc4f316-04-02-2025-07-54-52-995.png" alt="Michigan Jaguars" />
    <div class="cover-brand">
      <div class="cover-brand-name">Michigan Jaguars FC</div>
      <div class="cover-brand-sub">Player & Team Development · Girls Academy Club</div>
    </div>
    <div class="ga-badge">Girls Academy Partner</div>
  </div>
  <h1>Pre-GA Platform<br/><span>U10 · U11 · U12</span></h1>
  <div class="cover-subtitle">
    Michigan Jaguars is proud to be part of the Girls Academy's historic launch of the U11–U12 platform — bringing the nation's premier girls' soccer development environment to our youngest players starting in the 2026–27 season.
  </div>
  <div class="cover-tags">
    <span class="cover-tag">Girls Academy Certified</span>
    <span class="cover-tag">Great Lakes Conference</span>
    <span class="cover-tag">2026–27 Season</span>
    <span class="cover-tag">Development First</span>
  </div>
</div>

<!-- BODY -->
<div class="body">

  <!-- INTRO -->
  <div class="section-title">What Is the Pre-GA Platform?</div>
  <div class="intro-box">
    <p>
      The Girls Academy — the leading youth development platform for girls' soccer in the United States — has officially launched its U11–U12 platform for the 2026–27 season. This initiative is designed to expand access, create meaningful opportunities, and strengthen the player development pathway for young female athletes at the critical U10–U12 ages.
      <br/><br/>
      Michigan Jaguars, as a founding Great Lakes conference Girls Academy club, is one of the first organizations in the Midwest to offer this platform. Our Pre-GA teams (U10, U11, U12) are now fully integrated into the Girls Academy ecosystem, meaning our youngest players benefit from the same standards, philosophy, and pathway as our elite U13–U19 GA teams.
    </p>
  </div>

  <!-- KEY POINTS -->
  <div class="section-title">Platform Pillars</div>
  <div class="kp-grid">
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Introduce players earlier to the Girls Academy environment</div></div>
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Strengthen the transition into U13 Girls Academy competition</div></div>
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Development-first model with reduced travel and flexible scheduling</div></div>
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Alignment with GA standards in coaching, game-day environment, and player experience</div></div>
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Regional play with flexible formats focused on player development</div></div>
    <div class="kp-item"><div class="kp-dot"></div><div class="kp-text">Access to GA regional events alongside U13 and U14 age groups</div></div>
  </div>

  <!-- BENEFITS -->
  <div class="section-title">Benefits for Michigan Jaguars Players</div>
  <div class="ben-grid">
    <div class="ben-card yellow">
      <div class="ben-title">🏆 Girls Academy Environment — Early</div>
      <div class="ben-desc">Players are introduced to the premier girls' soccer platform in the US at U10–U12, building identity and familiarity with the GA standard before U13 competition.</div>
    </div>
    <div class="ben-card green">
      <div class="ben-title">🛡️ Clear Pathway to GA U13+</div>
      <div class="ben-desc">Michigan Jaguars Pre-GA players get a structured, intentional bridge directly into the U13 Girls Academy program — the most seamless path available.</div>
    </div>
    <div class="ben-card blue">
      <div class="ben-title">🌎 Regional Competition & GA Events</div>
      <div class="ben-desc">Compete regionally with reduced travel, flexible scheduling, and access to Girls Academy regional events alongside U13–U14 age groups.</div>
    </div>
    <div class="ben-card purple">
      <div class="ben-title">👥 GA-Standard Coaching & Experience</div>
      <div class="ben-desc">Michigan Jaguars Pre-GA teams are coached to Girls Academy standards — the same philosophy, language, and development model used at the elite U13–U19 level.</div>
    </div>
    <div class="ben-card rose">
      <div class="ben-title">⚡ Development-First, Low Pressure</div>
      <div class="ben-desc">No overloaded schedules. The platform prioritizes long-term athletic development, ensuring players build the right foundation without burnout.</div>
    </div>
    <div class="ben-card amber">
      <div class="ben-title">⭐ Michigan Jaguars Club Advantage</div>
      <div class="ben-desc">As a Great Lakes conference GA club, Michigan Jaguars is one of the first in the Midwest to offer this exclusive U11–U12 platform — a true competitive advantage for our families.</div>
    </div>
  </div>

  <!-- QUOTES -->
  <div class="section-title">Leadership Voices</div>
  <div class="quote-grid">
    <div class="quote-box">
      <div class="quote-text">"This is an important step forward for the Girls Academy. We are listening to our clubs and responding to the evolving landscape by creating a platform that protects the integrity of our pathway while prioritizing what is best for players."</div>
      <div class="quote-author">Patricia Hughes — GA Commissioner</div>
    </div>
    <div class="quote-box">
      <div class="quote-text">"The U-11 and U-12 ages are critical in a player's long-term development. This platform allows us to introduce players, coaches, and families to the Girls Academy environment earlier, without adding pressure, but with clear alignment to how we develop players."</div>
      <div class="quote-author">Meghan Frey — GA Sporting Director</div>
    </div>
  </div>

  <!-- CTA -->
  <div class="cta-box">
    <div class="cta-title">Ready to Join Michigan Jaguars Pre-GA?</div>
    <div class="cta-sub">Limited spots available for U10, U11, and U12 players in the 2026–27 season.<br/>Be part of something historic — the Girls Academy platform from the very beginning.</div>
    <a class="cta-link" href="https://system.gotsport.com/forms/215777I23" target="_blank">Apply for GA U11–U12 ›</a>
    <div class="cta-contact">Questions? Contact us at michiganjaguarsfc.com or reach out to your Jaguars age-group director.</div>
  </div>

</div>

<!-- FOOTER -->
<div class="footer">
  Michigan Jaguars FC · Girls Academy Great Lakes Conference · michiganjaguarsfc.com · 2026–27 Season
</div>

</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Michigan-Jaguars-PreGA-Platform-2026-27.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Page Component ──────────────────────────────────────────────────────────────
export default function PreGA() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-blue-900 text-white">
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />

        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 relative z-10">
          {/* Logos row */}
          <div className="flex items-center gap-4 mb-10">
            <img src={GA_LOGO} alt="Michigan Jaguars" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white p-2 object-contain shadow-xl" />
            <div className="h-10 w-px bg-white/30" />
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-emerald-300 mb-1">Girls Academy · Great Lakes Conference</div>
              <div className="text-sm font-semibold text-white/80">Michigan Jaguars FC</div>
            </div>
            <div className="ml-auto hidden sm:flex">
              <Badge className="bg-white/15 border border-white/30 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wide">
                2026–27 Launch
              </Badge>
            </div>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-1.5 mb-6">
              <Star className="w-4 h-4 text-emerald-300" />
              <span className="text-emerald-200 text-sm font-semibold">Historic Launch — Girls Academy U11–U12 Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              Michigan Jaguars<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-blue-300">
                Pre-GA Platform
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 max-w-2xl">
              U10 · U11 · U12 players now enter the Girls Academy ecosystem from the very beginning — with Michigan Jaguars leading the way in the Great Lakes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={generatePDF}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-xl shadow-emerald-900/40 px-6"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Info Brochure
              </Button>
              <a href="https://system.gotsport.com/forms/215777I23" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-bold px-6">
                  Apply Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="relative h-16">
          <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,64 L0,32 Q360,0 720,32 Q1080,64 1440,32 L1440,64 Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* AGE GROUPS */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-3">Who Is This For?</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Michigan Jaguars Pre-GA is built for players in these age groups who want the best possible start to their Girls Academy journey.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { age: 'U10', color: 'from-purple-500 to-indigo-600', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', years: 'Born 2016–2017', desc: 'Build confidence, technical foundation, and love of the game in a GA-certified environment.' },
            { age: 'U11', color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', years: 'Born 2014–2015', desc: 'Enter the official Girls Academy U11–U12 platform with Michigan Jaguars as a founding Great Lakes club.' },
            { age: 'U12', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', years: 'Born 2013–2014', desc: 'Compete in the new GA platform and position yourself perfectly for U13 Girls Academy competition.' },
          ].map(item => (
            <div key={item.age} className={`rounded-2xl border-2 ${item.bg} p-8 text-center shadow-md hover:shadow-xl transition-all hover:-translate-y-1`}>
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} text-white font-black text-3xl shadow-lg mb-5`}>
                {item.age}
              </div>
              <div className={`text-sm font-bold ${item.text} mb-1`}>{item.years}</div>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* WHAT IS IT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-1.5 mb-5">
              <Globe className="w-4 h-4 text-emerald-700" />
              <span className="text-emerald-800 text-sm font-bold">About the Platform</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-5 leading-tight">
              Girls Academy Launches a Historic<br />
              <span className="text-emerald-600">U11–U12 Platform</span>
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Announced April 14, 2026, the Girls Academy — the premier youth development league in the United States — is launching a dedicated U11–U12 competitive platform for the 2026–27 season. This is a landmark moment for girls' youth soccer.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              The Great Lakes conference, which includes Michigan Jaguars, is among the first regions selected for the initial rollout. This means Jaguars families get early, priority access to the platform.
            </p>
            <a
              href="https://girlsacademyleague.com/2026/04/girls-academy-launches-u11-u12-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-700 font-semibold text-sm hover:text-emerald-900 transition-colors"
            >
              Read the Full GA Announcement
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="space-y-3">
            {KEY_POINTS.map((pt, i) => (
              <div key={i} className="flex items-start gap-3 bg-gradient-to-r from-slate-50 to-emerald-50 border border-emerald-100 rounded-xl px-5 py-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 font-medium text-sm">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BENEFITS */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Benefits for Michigan Jaguars Players</h2>
            <p className="text-slate-500 max-w-lg mx-auto">Here's exactly what you and your player gain by being part of the Jaguars Pre-GA program.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <div key={i} className={`rounded-2xl border-2 ${b.bg} p-6 hover:shadow-lg transition-all hover:-translate-y-0.5`}>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${b.color} text-white shadow-md mb-4`}>
                  <b.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{b.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* QUOTES */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-slate-900 mb-7 text-center">Leadership on the Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                quote: '"This is an important step forward for the Girls Academy. We are listening to our clubs and responding to the evolving landscape by creating a platform that protects the integrity of our pathway while prioritizing what is best for players. This initiative allows us to extend our standards and philosophy to younger age groups in a thoughtful and intentional way."',
                author: 'Patricia Hughes',
                title: 'Girls Academy Commissioner',
                color: 'border-emerald-500',
                bg: 'bg-emerald-50',
              },
              {
                quote: '"The U-11 and U-12 ages are critical in a player\'s long-term development. This platform allows us to introduce players, coaches, and families to the Girls Academy environment earlier, without adding pressure, but with clear alignment to how we develop players. It\'s about building the foundation the right way and ensuring consistency across the pathway."',
                author: 'Meghan Frey',
                title: 'Girls Academy Sporting Director',
                color: 'border-blue-500',
                bg: 'bg-blue-50',
              },
            ].map((q, i) => (
              <div key={i} className={`${q.bg} border-l-4 ${q.color} rounded-xl p-7 shadow-sm`}>
                <p className="text-slate-700 italic leading-relaxed text-sm mb-5">{q.quote}</p>
                <div>
                  <div className="font-bold text-slate-900">{q.author}</div>
                  <div className="text-xs text-slate-500 font-medium">{q.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DOWNLOAD + CTA */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-blue-900 text-white p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-6">
              <Trophy className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-bold text-white">Limited 2026–27 Spots Available</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4">Join Michigan Jaguars Pre-GA</h2>
            <p className="text-white/75 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Download our full info brochure or apply directly. Be part of the Girls Academy from the very beginning of your soccer journey.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={generatePDF}
                size="lg"
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-8 shadow-xl"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Brochure (HTML)
              </Button>
              <a href="https://system.gotsport.com/forms/215777I23" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 font-bold px-8 shadow-xl text-white">
                  Apply for GA U11–U12
                  <ExternalLink className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </div>
            <p className="text-white/50 text-xs mt-6">Questions? Contact your Jaguars age-group director or visit michiganjaguarsfc.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}