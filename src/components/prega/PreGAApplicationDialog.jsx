import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Star, User, Users, Mail, Phone, MapPin, MessageSquare, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const POSITIONS = ['Goalkeeper', 'Defender', 'Center Back', 'Outside Back', 'Midfielder', 'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder', 'Forward / Winger', 'Forward / Striker'];
const AGE_GROUPS = ['U10', 'U11', 'U12'];

export default function PreGAApplicationDialog({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    player_name: '',
    age_group: '',
    date_of_birth: '',
    position: '',
    current_club: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    parent2_name: '',
    parent2_email: '',
    city: '',
    comments: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.player_name || !form.parent_email || !form.age_group) {
      toast.error('Please fill in player name, age group, and parent email.');
      return;
    }
    setSubmitting(true);
    try {
      // Save as a TryoutPool entry
      await base44.entities.TryoutPool.create({
        player_name: form.player_name,
        age_group: form.age_group,
        date_of_birth: form.date_of_birth || undefined,
        primary_position: form.position || undefined,
        current_club: form.current_club || undefined,
        player_email: undefined,
        parent_emails: [form.parent_email, form.parent2_email].filter(Boolean),
        notes: [
          form.parent_name ? `Parent: ${form.parent_name} (${form.parent_phone || 'no phone'})` : '',
          form.parent2_name ? `Parent 2: ${form.parent2_name} (${form.parent2_email || 'no email'})` : '',
          form.city ? `City: ${form.city}` : '',
          form.comments ? `Comments: ${form.comments}` : '',
        ].filter(Boolean).join('\n'),
        gender: 'Female',
        status: 'Pending',
      });

      // Send confirmation email to parent
      if (form.parent_email) {
        await base44.integrations.Core.SendEmail({
          to: form.parent_email,
          subject: `Application Received — Michigan Jaguars Pre-GA (${form.age_group})`,
          body: `Dear ${form.parent_name || 'Parent/Guardian'},\n\nThank you for applying to the Michigan Jaguars Pre-GA Platform for ${form.player_name}!\n\nWe have received your application for the ${form.age_group} age group and will be in touch soon with next steps.\n\nMichigan Jaguars FC — Girls Academy Great Lakes Conference\nmichiganjaguarsfc.com`,
        });
      }

      setSubmitted(true);
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSubmitted(false);
    setForm({ player_name:'',age_group:'',date_of_birth:'',position:'',current_club:'',parent_name:'',parent_email:'',parent_phone:'',parent2_name:'',parent2_email:'',city:'',comments:'' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-blue-900 text-white px-8 py-7 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="https://ssprodst.blob.core.windows.net/logos/58/2821a300-9ff6-46d2-a00b-73be4dc4f316-04-02-2025-07-54-52-995.png"
              alt="Jaguars" className="w-10 h-10 rounded-xl bg-white p-1 object-contain"
            />
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-emerald-300">Michigan Jaguars FC</div>
              <div className="text-xs text-white/60">Girls Academy · Great Lakes Conference</div>
            </div>
            <div className="ml-auto flex gap-1">
              {[1,2,3].map(s => (
                <div key={s} className={`w-8 h-1.5 rounded-full transition-all ${s <= step ? 'bg-emerald-400' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
          <DialogTitle className="text-2xl font-black text-white">
            {submitted ? 'Application Submitted!' : 'Apply for Pre-GA Platform'}
          </DialogTitle>
          {!submitted && (
            <p className="text-white/70 text-sm mt-1">
              Step {step} of 3 — {step === 1 ? 'Player Info' : step === 2 ? 'Parent / Guardian' : 'Final Details'}
            </p>
          )}
        </div>

        <div className="px-8 py-7">
          {/* SUCCESS STATE */}
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">You're on your way!</h3>
              <p className="text-slate-600 leading-relaxed mb-2">
                We've received <span className="font-bold text-emerald-700">{form.player_name}</span>'s application for the <span className="font-bold">{form.age_group}</span> Pre-GA Platform.
              </p>
              <p className="text-slate-500 text-sm mb-8">A confirmation email has been sent to <strong>{form.parent_email}</strong>. Our team will be in touch shortly.</p>
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-5 text-left mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-800 text-sm">What happens next?</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />Our Girls Director will review your application</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />You'll be contacted within 2–3 business days</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />We'll schedule a tryout / evaluation session</li>
                </ul>
              </div>
              <Button onClick={handleClose} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-8">
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* STEP 1 — Player Info */}
              {step === 1 && (
                <div className="space-y-5">
                  <SectionLabel icon={User} label="Player Information" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Player Full Name *" required>
                      <Input placeholder="e.g. Emma Johnson" value={form.player_name} onChange={e => set('player_name', e.target.value)} />
                    </Field>
                    <Field label="Age Group *">
                      <select
                        value={form.age_group}
                        onChange={e => set('age_group', e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Select age group...</option>
                        {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                      </select>
                    </Field>
                    <Field label="Date of Birth">
                      <Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                    </Field>
                    <Field label="Primary Position">
                      <select
                        value={form.position}
                        onChange={e => set('position', e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Select position...</option>
                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </Field>
                    <Field label="Current Club / Team" className="sm:col-span-2">
                      <Input placeholder="e.g. FC United, AYSO, None" value={form.current_club} onChange={e => set('current_club', e.target.value)} />
                    </Field>
                  </div>
                </div>
              )}

              {/* STEP 2 — Parent Info */}
              {step === 2 && (
                <div className="space-y-5">
                  <SectionLabel icon={Users} label="Parent / Guardian Information" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Parent / Guardian Name">
                      <Input placeholder="Full name" value={form.parent_name} onChange={e => set('parent_name', e.target.value)} />
                    </Field>
                    <Field label="Parent Email *" required>
                      <Input type="email" placeholder="email@example.com" value={form.parent_email} onChange={e => set('parent_email', e.target.value)} />
                    </Field>
                    <Field label="Parent Phone">
                      <Input type="tel" placeholder="(555) 555-5555" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} />
                    </Field>
                    <Field label="City / Township">
                      <Input placeholder="e.g. Northville, Novi, Plymouth" value={form.city} onChange={e => set('city', e.target.value)} />
                    </Field>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Second Parent / Guardian (optional)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Name">
                        <Input placeholder="Full name" value={form.parent2_name} onChange={e => set('parent2_name', e.target.value)} />
                      </Field>
                      <Field label="Email">
                        <Input type="email" placeholder="email@example.com" value={form.parent2_email} onChange={e => set('parent2_email', e.target.value)} />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 — Final */}
              {step === 3 && (
                <div className="space-y-5">
                  <SectionLabel icon={MessageSquare} label="Additional Information" />
                  <Field label="Comments / Questions" hint="Anything you'd like us to know — injuries, schedule constraints, goals, etc.">
                    <textarea
                      rows={5}
                      placeholder="Tell us about your player, any questions you have, or anything that would help us..."
                      value={form.comments}
                      onChange={e => set('comments', e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </Field>
                  {/* Summary */}
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-5">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">Application Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <SummaryRow label="Player" value={form.player_name} />
                      <SummaryRow label="Age Group" value={form.age_group} />
                      <SummaryRow label="Position" value={form.position} />
                      <SummaryRow label="Current Club" value={form.current_club || 'N/A'} />
                      <SummaryRow label="Parent Email" value={form.parent_email} />
                      <SummaryRow label="City" value={form.city || 'N/A'} />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-5 border-t border-slate-100">
                {step > 1 ? (
                  <Button variant="outline" onClick={() => setStep(s => s - 1)} className="font-semibold">
                    ← Back
                  </Button>
                ) : <div />}
                {step < 3 ? (
                  <Button
                    onClick={() => {
                      if (step === 1 && !form.player_name) { toast.error('Player name is required'); return; }
                      if (step === 1 && !form.age_group) { toast.error('Age group is required'); return; }
                      setStep(s => s + 1);
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-8"
                  >
                    Next →
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-gradient-to-r from-emerald-600 to-blue-700 text-white font-bold px-10 shadow-lg"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : '✓ Submit Application'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-emerald-700" />
      </div>
      <span className="font-bold text-slate-800">{label}</span>
    </div>
  );
}

function Field({ label, children, hint, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div>
      <span className="text-slate-400 text-xs">{label}: </span>
      <span className="font-semibold text-slate-800">{value || '—'}</span>
    </div>
  );
}