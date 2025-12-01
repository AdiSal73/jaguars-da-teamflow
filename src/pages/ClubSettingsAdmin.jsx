import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_FEMALE_ROLES = [
  'Indispensable Player',
  'GA Starter',
  'GA Rotation',
  'Aspire Starter',
  'Aspire Rotation',
  'United Starter',
  'United Rotation'
];

const DEFAULT_MALE_ROLES = [
  'Elite Starter',
  'Elite Rotation',
  'Premier Starter',
  'Premier Rotation',
  'Academy Starter',
  'Academy Rotation',
  'Development'
];

const DEFAULT_POSITIONS = [
  'GK',
  'Right Outside Back',
  'Left Outside Back',
  'Right Centerback',
  'Left Centerback',
  'Defensive Midfielder',
  'Right Winger',
  'Center Midfielder',
  'Forward',
  'Attacking Midfielder',
  'Left Winger'
];

export default function ClubSettingsAdmin() {
  const queryClient = useQueryClient();
  const [femaleRoles, setFemaleRoles] = useState([]);
  const [maleRoles, setMaleRoles] = useState([]);
  const [femalePositions, setFemalePositions] = useState([]);
  const [malePositions, setMalePositions] = useState([]);
  const [newFemaleRole, setNewFemaleRole] = useState('');
  const [newMaleRole, setNewMaleRole] = useState('');
  const [newFemalePosition, setNewFemalePosition] = useState('');
  const [newMalePosition, setNewMalePosition] = useState('');

  const { data: clubSettings = [] } = useQuery({
    queryKey: ['clubSettings'],
    queryFn: () => base44.entities.ClubSettings.list()
  });

  useEffect(() => {
    const femaleRoleSetting = clubSettings.find(s => s.setting_type === 'team_roles' && s.gender === 'Female');
    const maleRoleSetting = clubSettings.find(s => s.setting_type === 'team_roles' && s.gender === 'Male');
    const femalePosSetting = clubSettings.find(s => s.setting_type === 'positions' && s.gender === 'Female');
    const malePosSetting = clubSettings.find(s => s.setting_type === 'positions' && s.gender === 'Male');

    setFemaleRoles(femaleRoleSetting?.values || DEFAULT_FEMALE_ROLES);
    setMaleRoles(maleRoleSetting?.values || DEFAULT_MALE_ROLES);
    setFemalePositions(femalePosSetting?.values || DEFAULT_POSITIONS);
    setMalePositions(malePosSetting?.values || DEFAULT_POSITIONS);
  }, [clubSettings]);

  const saveMutation = useMutation({
    mutationFn: async ({ settingType, gender, values }) => {
      const existing = clubSettings.find(s => s.setting_type === settingType && s.gender === gender);
      if (existing) {
        return base44.entities.ClubSettings.update(existing.id, { values });
      } else {
        return base44.entities.ClubSettings.create({ setting_type: settingType, gender, values });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clubSettings']);
      toast.success('Settings saved successfully');
    }
  });

  const handleAddRole = (gender) => {
    if (gender === 'Female' && newFemaleRole.trim()) {
      setFemaleRoles([...femaleRoles, newFemaleRole.trim()]);
      setNewFemaleRole('');
    } else if (gender === 'Male' && newMaleRole.trim()) {
      setMaleRoles([...maleRoles, newMaleRole.trim()]);
      setNewMaleRole('');
    }
  };

  const handleRemoveRole = (gender, index) => {
    if (gender === 'Female') {
      setFemaleRoles(femaleRoles.filter((_, i) => i !== index));
    } else {
      setMaleRoles(maleRoles.filter((_, i) => i !== index));
    }
  };

  const handleAddPosition = (gender) => {
    if (gender === 'Female' && newFemalePosition.trim()) {
      setFemalePositions([...femalePositions, newFemalePosition.trim()]);
      setNewFemalePosition('');
    } else if (gender === 'Male' && newMalePosition.trim()) {
      setMalePositions([...malePositions, newMalePosition.trim()]);
      setNewMalePosition('');
    }
  };

  const handleRemovePosition = (gender, index) => {
    if (gender === 'Female') {
      setFemalePositions(femalePositions.filter((_, i) => i !== index));
    } else {
      setMalePositions(malePositions.filter((_, i) => i !== index));
    }
  };

  const handleSaveRoles = (gender) => {
    saveMutation.mutate({
      settingType: 'team_roles',
      gender,
      values: gender === 'Female' ? femaleRoles : maleRoles
    });
  };

  const handleSavePositions = (gender) => {
    saveMutation.mutate({
      settingType: 'positions',
      gender,
      values: gender === 'Female' ? femalePositions : malePositions
    });
  };

  const handleResetToDefaults = (type, gender) => {
    if (type === 'roles') {
      if (gender === 'Female') setFemaleRoles(DEFAULT_FEMALE_ROLES);
      else setMaleRoles(DEFAULT_MALE_ROLES);
    } else {
      if (gender === 'Female') setFemalePositions(DEFAULT_POSITIONS);
      else setMalePositions(DEFAULT_POSITIONS);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Club Settings</h1>
        <p className="text-slate-600 mt-1">Customize team roles and positions for your club</p>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">Team Roles</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Female Roles */}
            <Card className="border-pink-200">
              <CardHeader className="bg-pink-50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Girls Team Roles</span>
                  <Button variant="ghost" size="sm" onClick={() => handleResetToDefaults('roles', 'Female')}>
                    Reset
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {femaleRoles.map((role, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <Input
                      value={role}
                      onChange={(e) => {
                        const updated = [...femaleRoles];
                        updated[index] = e.target.value;
                        setFemaleRoles(updated);
                      }}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveRole('Female', index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new role..."
                    value={newFemaleRole}
                    onChange={(e) => setNewFemaleRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRole('Female')}
                  />
                  <Button variant="outline" onClick={() => handleAddRole('Female')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={() => handleSaveRoles('Female')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Girls Roles
                </Button>
              </CardContent>
            </Card>

            {/* Male Roles */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Boys Team Roles</span>
                  <Button variant="ghost" size="sm" onClick={() => handleResetToDefaults('roles', 'Male')}>
                    Reset
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {maleRoles.map((role, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <Input
                      value={role}
                      onChange={(e) => {
                        const updated = [...maleRoles];
                        updated[index] = e.target.value;
                        setMaleRoles(updated);
                      }}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveRole('Male', index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new role..."
                    value={newMaleRole}
                    onChange={(e) => setNewMaleRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRole('Male')}
                  />
                  <Button variant="outline" onClick={() => handleAddRole('Male')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleSaveRoles('Male')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Boys Roles
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Female Positions */}
            <Card className="border-pink-200">
              <CardHeader className="bg-pink-50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Girls Positions</span>
                  <Button variant="ghost" size="sm" onClick={() => handleResetToDefaults('positions', 'Female')}>
                    Reset
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {femalePositions.map((pos, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <Input
                      value={pos}
                      onChange={(e) => {
                        const updated = [...femalePositions];
                        updated[index] = e.target.value;
                        setFemalePositions(updated);
                      }}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePosition('Female', index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new position..."
                    value={newFemalePosition}
                    onChange={(e) => setNewFemalePosition(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPosition('Female')}
                  />
                  <Button variant="outline" onClick={() => handleAddPosition('Female')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={() => handleSavePositions('Female')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Girls Positions
                </Button>
              </CardContent>
            </Card>

            {/* Male Positions */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Boys Positions</span>
                  <Button variant="ghost" size="sm" onClick={() => handleResetToDefaults('positions', 'Male')}>
                    Reset
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {malePositions.map((pos, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <Input
                      value={pos}
                      onChange={(e) => {
                        const updated = [...malePositions];
                        updated[index] = e.target.value;
                        setMalePositions(updated);
                      }}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePosition('Male', index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new position..."
                    value={newMalePosition}
                    onChange={(e) => setNewMalePosition(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPosition('Male')}
                  />
                  <Button variant="outline" onClick={() => handleAddPosition('Male')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleSavePositions('Male')}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Boys Positions
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}