import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Save, Trash2, Move } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomFormationBuilder({ onSave, existingFormation = null }) {
  const [formationName, setFormationName] = useState(existingFormation?.name || '');
  const [positions, setPositions] = useState(existingFormation?.positions || []);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const fieldRef = useRef(null);

  const handleFieldClick = (e) => {
    if (!isEditing) return;
    
    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPosition = {
      id: `pos_${Date.now()}`,
      x: Math.round(x),
      y: Math.round(y),
      label: `P${positions.length + 1}`
    };

    setPositions([...positions, newPosition]);
  };

  const handlePositionClick = (e, position) => {
    e.stopPropagation();
    setSelectedPosition(position);
  };

  const handleDeletePosition = () => {
    if (selectedPosition) {
      setPositions(positions.filter(p => p.id !== selectedPosition.id));
      setSelectedPosition(null);
    }
  };

  const handleUpdateLabel = (newLabel) => {
    if (selectedPosition) {
      setPositions(positions.map(p => 
        p.id === selectedPosition.id ? { ...p, label: newLabel } : p
      ));
      setSelectedPosition({ ...selectedPosition, label: newLabel });
    }
  };

  const handleSaveFormation = () => {
    if (!formationName) {
      toast.error('Please enter a formation name');
      return;
    }
    if (positions.length === 0) {
      toast.error('Please add at least one position');
      return;
    }

    onSave({
      name: formationName,
      positions,
      created_date: new Date().toISOString()
    });

    setFormationName('');
    setPositions([]);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Label>Formation Name</Label>
          <Input
            value={formationName}
            onChange={(e) => setFormationName(e.target.value)}
            placeholder="e.g., Custom 4-2-3-1"
          />
        </div>
        <Button
          variant={isEditing ? 'destructive' : 'default'}
          onClick={() => setIsEditing(!isEditing)}
          className={isEditing ? '' : 'bg-blue-600 hover:bg-blue-700'}
        >
          {isEditing ? 'Done Editing' : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Positions
            </>
          )}
        </Button>
        {selectedPosition && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleDeletePosition}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        <Button
          onClick={handleSaveFormation}
          disabled={!formationName || positions.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Formation
        </Button>
      </div>

      {isEditing && (
        <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <strong>Editing Mode:</strong> Click anywhere on the field to add a position. Click existing positions to select/edit them.
        </div>
      )}

      {selectedPosition && (
        <div className="bg-slate-50 p-3 rounded-lg border">
          <Label className="text-xs">Position Label</Label>
          <Input
            value={selectedPosition.label}
            onChange={(e) => handleUpdateLabel(e.target.value)}
            className="mt-1"
            placeholder="e.g., GK, CB, CM..."
          />
          <div className="text-xs text-slate-500 mt-2">
            Position: {selectedPosition.x.toFixed(1)}%, {selectedPosition.y.toFixed(1)}%
          </div>
        </div>
      )}

      <Card className="border-2 border-slate-300">
        <CardContent className="p-0">
          <div
            ref={fieldRef}
            onClick={handleFieldClick}
            className={`relative w-full bg-gradient-to-b from-green-600 to-green-700 ${isEditing ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{
              height: '600px',
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          >
            {/* Field markings */}
            <div className="absolute inset-0 border-2 border-white opacity-50" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white opacity-50" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white opacity-50" />
            
            {/* Penalty areas */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1/6 border-2 border-white border-t-0 opacity-50" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1/6 border-2 border-white border-b-0 opacity-50" />

            {/* Positions */}
            {positions.map((pos) => (
              <div
                key={pos.id}
                onClick={(e) => handlePositionClick(e, pos)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                  selectedPosition?.id === pos.id ? 'ring-4 ring-yellow-400' : ''
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`
                }}
              >
                <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-slate-800">
                  <span className="text-xs font-bold text-slate-900">{pos.label}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-slate-600">
        <strong>Positions:</strong> {positions.length} / 11
      </div>
    </div>
  );
}