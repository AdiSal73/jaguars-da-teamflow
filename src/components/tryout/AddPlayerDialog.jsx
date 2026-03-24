import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, User, Calendar, Trophy, Star, Phone, Mail, MapPin, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const POSITIONS = [
  'GK', 'Right Outside Back', 'Left Outside Back', 'Right Centerback', 'Left Centerback',
  'Defensive Midfielder', 'Right Winger', 'Center Midfielder', 'Forward', 'Attacking Midfielder', 'Left Winger'
];

const BRANCHES = [
  'CW3', 'Dearborn', 'Downriver', 'Genesee', 'Huron Valley', 'Jackson',
  'Lansing', 'Marshall', 'Northville', 'Novi', 'Rochester Romeo', 'West Bloomfield'
];

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032];

const SECTION = ({ icon: Icon, title, color, children }) => (
  <div className="space-y-3">
    <div className={`flex items-center gap-2 pb-2 border-b-2 ${color}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center`} style={{background: 'rgba(0,0,0,0.04)'}}>
        <Icon className={`w-4 h-4`} />
      </div>
      <h3 className={`font-semibold text-sm text-slate-700`}>{title}</h3>
    </div>
    <div className="grid grid-cols-2 gap-3">{children}</div>
  </div>
);

const Field = ({ label, children, span = 1 }) => (
  <div className={span === 2 ? 'col-span-2' : ''}>
    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

export default function AddPlayerDialog({ open, onClose, teams = [], onCreated }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const emptyForm = {
    first_name: '', last_name: '',
    date_of_birth: '', grad_year: '',
    primary_position: '', secondary_position: '', preferred_foot: '',
    branch: '', gender: 'Female',
    team_26_27: '', team_25_26: '',
    parent1_name: '', parent1_email: '', parent1_phone: '',
    parent2_name: '', parent2_email: '', parent2_phone: '',
    notes: '', is_tryout_player: false
  };
  const [form, setForm] = useState(emptyForm);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const season2627Teams = teams.filter(t => {
    const s = t.season || (t.name?.includes('26/27') ? '26/27' : null);
    return s === '26/27';
  }).sort((a, b) => a.name?.localeCompare(b.name));

  const season2526Teams = teams.filter(t => {
    const s = t.season || (t.name?.includes('25/26') ? '25/26' : null);
    return s === '25/26';
  }).sort((a, b) => a.name?.localeCompare(b.name));

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error('First and last name are required');
      return;
    }
    setSaving(true);
    try {
      const full_name = `${form.first_name.trim()} ${form.last_name.trim()}`;
      const parentEmails = [form.parent1_email, form.parent2_email].filter(Boolean).map(e => e.toLowerCase().trim());
      const parentNames = [form.parent1_name, form.parent2_name].filter((n, i) => n || parentEmails[i]).map(n => n.trim());

      const team_assignments = [];
      if (form.team_25_26) team_assignments.push({ team_id: form.team_25_26, season: '25/26' });
      if (form.team_26_27) team_assignments.push({ team_id: form.team_26_27, season: '26/27' });

      const data = {
        full_name,
        gender: form.gender,
        is_tryout_player: form.is_tryout_player,
        status: 'Active'
      };

      if (form.date_of_birth) data.date_of_birth = form.date_of_birth;
      if (form.grad_year) data.grad_year = parseInt(form.grad_year);
      if (form.primary_position) data.primary_position = form.primary_position;
      if (form.secondary_position) data.secondary_position = form.secondary_position;
      if (form.preferred_foot) data.preferred_foot = form.preferred_foot;
      if (form.branch) data.branch = form.branch;
      if (form.team_26_27) data.current_26_27_team = form.team_26_27;
      if (form.team_25_26) data.current_25_26_team = form.team_25_26;
      if (team_assignments.length) data.team_assignments = team_assignments;
      if (parentEmails.length) data.parent_emails = parentEmails;
      if (parentNames.length) data.parent_names = parentNames;
      if (form.parent1_name) data.parent_name = form.parent1_name;
      if (form.parent1_phone || form.parent2_phone) data.phone = form.parent1_phone || form.parent2_phone;
      if (form.notes) {
        data.comment = form.notes;
        data.comment_log = [{ comment: form.notes, created_date: new Date().toISOString(), created_by: 'Manual Entry' }];
      }

      await base44.entities.Player.create(data);
      setSaved(true);
      toast.success(`${full_name} added successfully!`);
      setTimeout(() => {
        setSaved(false);
        setForm(emptyForm);
        onCreated?.();
        onClose();
      }, 1200);
    } catch (err) {
      toast.error(`Failed to add player: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-9 text-sm border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20";
  const selTrigCls = "h-9 text-sm border-slate-200";

  return (
    <Dialog open={open} onOpenChange={() => { setForm(emptyForm); onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 p-6 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              Add New Player
            </DialogTitle>
            <p className="text-emerald-100 text-sm mt-1">Fill in player details and assign to teams</p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Player Identity */}
          <SECTION icon={User} title="Player Identity" color="border-emerald-200">
            <Field label="First Name">
              <Input className={inputCls} placeholder="First name" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
            </Field>
            <Field label="Last Name">
              <Input className={inputCls} placeholder="Last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onValueChange={v => set('gender', v)}>
                <SelectTrigger className={selTrigCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date of Birth">
              <Input className={inputCls} type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </Field>
            <Field label="Grad Year">
              <Select value={form.grad_year} onValueChange={v => set('grad_year', v)}>
                <SelectTrigger className={selTrigCls}><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {GRAD_YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Branch">
              <Select value={form.branch} onValueChange={v => set('branch', v)}>
                <SelectTrigger className={selTrigCls}><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tryout Player?" span={2}>
              <div className="flex gap-2 pt-1">
                {[{ v: false, label: 'Club Player' }, { v: true, label: 'Outside / Tryout' }].map(opt => (
                  <button
                    key={String(opt.v)}
                    onClick={() => set('is_tryout_player', opt.v)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      form.is_tryout_player === opt.v
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
          </SECTION>

          {/* Position & Skills */}
          <SECTION icon={Trophy} title="Position & Skills" color="border-blue-200">
            <Field label="Primary Position">
              <Select value={form.primary_position} onValueChange={v => set('primary_position', v)}>
                <SelectTrigger className={selTrigCls}><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Secondary Position">
              <Select value={form.secondary_position} onValueChange={v => set('secondary_position', v)}>
                <SelectTrigger className={selTrigCls}><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Preferred Foot" span={2}>
              <div className="flex gap-2">
                {['Left', 'Right', 'Both'].map(f => (
                  <button
                    key={f}
                    onClick={() => set('preferred_foot', f)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      form.preferred_foot === f
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Field>
          </SECTION>

          {/* Team Assignment */}
          <SECTION icon={Star} title="Team Assignment" color="border-purple-200">
            <Field label="26/27 Team" span={2}>
              <Select value={form.team_26_27} onValueChange={v => set('team_26_27', v)}>
                <SelectTrigger className={selTrigCls}><SelectValue placeholder="Select 26/27 team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>— None —</SelectItem>
                  {season2627Teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="25/26 Team (Previous)" span={2}>
              <Select value={form.team_25_26} onValueChange={v => set('team_25_26', v)}>
                <SelectTrigger className={selTrigCls}><SelectValue placeholder="Select 25/26 team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>— None —</SelectItem>
                  {season2526Teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </SECTION>

          {/* Parent 1 */}
          <SECTION icon={Phone} title="Parent / Guardian 1" color="border-orange-200">
            <Field label="Full Name" span={2}>
              <Input className={inputCls} placeholder="Parent name" value={form.parent1_name} onChange={e => set('parent1_name', e.target.value)} />
            </Field>
            <Field label="Email">
              <Input className={inputCls} type="email" placeholder="email@example.com" value={form.parent1_email} onChange={e => set('parent1_email', e.target.value)} />
            </Field>
            <Field label="Cell Phone">
              <Input className={inputCls} placeholder="(555) 000-0000" value={form.parent1_phone} onChange={e => set('parent1_phone', e.target.value)} />
            </Field>
          </SECTION>

          {/* Parent 2 */}
          <SECTION icon={Phone} title="Parent / Guardian 2 (Optional)" color="border-pink-200">
            <Field label="Full Name" span={2}>
              <Input className={inputCls} placeholder="Parent name" value={form.parent2_name} onChange={e => set('parent2_name', e.target.value)} />
            </Field>
            <Field label="Email">
              <Input className={inputCls} type="email" placeholder="email@example.com" value={form.parent2_email} onChange={e => set('parent2_email', e.target.value)} />
            </Field>
            <Field label="Cell Phone">
              <Input className={inputCls} placeholder="(555) 000-0000" value={form.parent2_phone} onChange={e => set('parent2_phone', e.target.value)} />
            </Field>
          </SECTION>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Notes / Comments</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 text-sm p-3 min-h-[80px] focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 resize-none outline-none"
              placeholder="Any tryout notes, observations, etc."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-3 rounded-b-lg shadow-lg">
          <Button variant="outline" onClick={() => { setForm(emptyForm); onClose(); }} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex-1 gap-2 transition-all ${saved ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Player Added!' : 'Add Player'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}