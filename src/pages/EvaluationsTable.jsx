import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EvaluationsTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => base44.entities.Evaluation.list('-evaluation_date')
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const updateEvaluationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Evaluation.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['evaluations'])
  });

  const deleteEvaluationMutation = useMutation({
    mutationFn: (id) => base44.entities.Evaluation.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['evaluations'])
  });

  const handleFieldUpdate = (evalId, field, value) => {
    const numericFields = ['technical_skills', 'tactical_awareness', 'physical_attributes', 'mental_attributes', 'teamwork', 'overall_rating'];
    const finalValue = numericFields.includes(field) ? parseFloat(value) || 0 : value;
    updateEvaluationMutation.mutate({ id: evalId, data: { [field]: finalValue } });
  };

  const filteredEvaluations = evaluations.filter(e => {
    const player = players.find(p => p.id === e.player_id);
    return (player?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Evaluations Table</h1>
        <p className="text-slate-600 mt-1">Edit and manage player evaluations</p>
      </div>

      <Card className="border-none shadow-lg mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Evaluator</TableHead>
                  <TableHead>Technical</TableHead>
                  <TableHead>Tactical</TableHead>
                  <TableHead>Physical</TableHead>
                  <TableHead>Mental</TableHead>
                  <TableHead>Teamwork</TableHead>
                  <TableHead>Overall</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.map(evaluation => {
                  const player = players.find(p => p.id === evaluation.player_id);
                  return (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">{player?.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Input 
                          type="date" 
                          value={evaluation.evaluation_date} 
                          onChange={(e) => handleFieldUpdate(evaluation.id, 'evaluation_date', e.target.value)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={evaluation.evaluator_name || ''} 
                          onChange={(e) => handleFieldUpdate(evaluation.id, 'evaluator_name', e.target.value)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={evaluation.technical_skills || ''} 
                          onChange={(e) => handleFieldUpdate(evaluation.id, 'technical_skills', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={evaluation.tactical_awareness || ''} 
                          onChange={(e) => handleFieldUpdate(evaluation.id, 'tactical_awareness', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={evaluation.physical_attributes || ''} 
                          onChange={(e) => handleFieldUpdate(evaluation.id, 'physical_attributes', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={evaluation.mental_attributes || ''} 
                          onChange={(e) => handleFieldUpdate(evaluation.id, 'mental_attributes', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={evaluation.teamwork || ''} 
                          onChange={(e) => handleFieldUpdate(evaluation.id, 'teamwork', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={evaluation.overall_rating || ''} 
                          onChange={(e) => handleFieldUpdate(evaluation.id, 'overall_rating', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            if (window.confirm('Delete this evaluation?')) {
                              deleteEvaluationMutation.mutate(evaluation.id);
                            }
                          }}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}