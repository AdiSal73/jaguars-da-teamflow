import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserPlus, Activity, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function UnassignedRecords() {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [recordType, setRecordType] = useState('');

  const queryClient = useQueryClient();

  const { data: unassignedEvals = [] } = useQuery({
    queryKey: ['unassignedEvaluations'],
    queryFn: () => base44.entities.UnassignedEvaluation.filter({ assigned: false })
  });

  const { data: unassignedAssessments = [] } = useQuery({
    queryKey: ['unassignedAssessments'],
    queryFn: () => base44.entities.UnassignedPhysicalAssessment.filter({ assigned: false })
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const assignEvaluationMutation = useMutation({
    mutationFn: async ({ recordId, playerId }) => {
      const record = unassignedEvals.find(r => r.id === recordId);
      await base44.entities.Evaluation.create({
        player_id: playerId,
        evaluator_name: record.evaluator,
        evaluation_date: record.date,
        technical_skills: record.technical_skills,
        tactical_awareness: record.tactical_awareness,
        physical_attributes: record.physical_attributes,
        mental_attributes: record.mental_attributes,
        teamwork: record.teamwork,
        overall_rating: record.overall_rating,
        strengths: record.strengths,
        areas_for_improvement: record.areas_for_improvement,
        notes: record.notes
      });
      await base44.entities.UnassignedEvaluation.update(recordId, { assigned: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['unassignedEvaluations']);
      queryClient.invalidateQueries(['evaluations']);
      setSelectedRecord(null);
      setSelectedPlayerId('');
    }
  });

  const assignAssessmentMutation = useMutation({
    mutationFn: async ({ recordId, playerId }) => {
      const record = unassignedAssessments.find(r => r.id === recordId);
      await base44.entities.PhysicalAssessment.create({
        player_id: playerId,
        assessment_date: record.assessment_date,
        speed: record.speed,
        agility: record.agility,
        power: record.power,
        endurance: record.endurance,
        sprint_time: record.sprint_time,
        vertical_jump: record.vertical_jump,
        cooper_test: record.cooper_test,
        assessor: record.team_name,
        notes: `Position: ${record.position || 'N/A'}, Age: ${record.age || 'N/A'}`
      });
      await base44.entities.UnassignedPhysicalAssessment.update(recordId, { assigned: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['unassignedAssessments']);
      queryClient.invalidateQueries(['allAssessments']);
      setSelectedRecord(null);
      setSelectedPlayerId('');
    }
  });

  const handleAssign = () => {
    if (recordType === 'evaluation') {
      assignEvaluationMutation.mutate({ recordId: selectedRecord.id, playerId: selectedPlayerId });
    } else {
      assignAssessmentMutation.mutate({ recordId: selectedRecord.id, playerId: selectedPlayerId });
    }
  };

  const openAssignDialog = (record, type) => {
    setSelectedRecord(record);
    setRecordType(type);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Unassigned Records</h1>
        <p className="text-slate-600 mt-1">Assign imported records to players</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Unassigned Evaluations</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{unassignedEvals.length}</div>
              </div>
              <ClipboardList className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Unassigned Assessments</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{unassignedAssessments.length}</div>
              </div>
              <Activity className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Total Players</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{players.length}</div>
              </div>
              <UserPlus className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="evaluations" className="w-full">
        <TabsList>
          <TabsTrigger value="evaluations">Unassigned Evaluations</TabsTrigger>
          <TabsTrigger value="assessments">Unassigned Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="evaluations" className="mt-6">
          {unassignedEvals.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No unassigned evaluations</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {unassignedEvals.map(record => (
                <Card key={record.id} className="border-none shadow-lg">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{record.player_name}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">Unassigned</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Overall Rating:</span>
                        <span className="font-semibold">{record.overall_rating}/10</span>
                      </div>
                      {record.evaluator && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Evaluator:</span>
                          <span className="font-semibold">{record.evaluator}</span>
                        </div>
                      )}
                      <Button
                        onClick={() => openAssignDialog(record, 'evaluation')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign to Player
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assessments" className="mt-6">
          {unassignedAssessments.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No unassigned physical assessments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {unassignedAssessments.map(record => (
                <Card key={record.id} className="border-none shadow-lg">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{record.player_name}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          {new Date(record.assessment_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800">Unassigned</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-2 bg-red-50 rounded-lg text-center">
                        <div className="text-xs text-red-600">Speed</div>
                        <div className="text-lg font-bold text-red-700">{record.speed}</div>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg text-center">
                        <div className="text-xs text-emerald-600">Agility</div>
                        <div className="text-lg font-bold text-emerald-700">{record.agility}</div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg text-center">
                        <div className="text-xs text-blue-600">Power</div>
                        <div className="text-lg font-bold text-blue-700">{record.power}</div>
                      </div>
                      <div className="p-2 bg-pink-50 rounded-lg text-center">
                        <div className="text-xs text-pink-600">Endurance</div>
                        <div className="text-lg font-bold text-pink-700">{record.endurance}</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => openAssignDialog(record, 'assessment')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign to Player
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {recordType === 'evaluation' ? 'Evaluation' : 'Assessment'} to Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="font-semibold text-slate-900 mb-2">
                Record for: {selectedRecord?.player_name}
              </div>
              <div className="text-sm text-slate-600">
                Date: {selectedRecord?.date || selectedRecord?.assessment_date}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Player</label>
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setSelectedRecord(null)}>Cancel</Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedPlayerId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Assign Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}