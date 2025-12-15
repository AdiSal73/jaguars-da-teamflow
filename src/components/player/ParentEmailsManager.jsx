import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Mail } from 'lucide-react';

export default function ParentEmailsManager({ parentEmails = [], onChange, disabled = false }) {
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAdd = () => {
    setError('');
    
    if (!newEmail) {
      setError('Please enter an email');
      return;
    }
    
    if (!validateEmail(newEmail)) {
      setError('Please enter a valid email');
      return;
    }
    
    if (parentEmails.includes(newEmail.toLowerCase())) {
      setError('This email is already added');
      return;
    }
    
    onChange([...parentEmails, newEmail.toLowerCase()]);
    setNewEmail('');
  };

  const handleRemove = (email) => {
    onChange(parentEmails.filter(e => e !== email));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          value={newEmail}
          onChange={(e) => { setNewEmail(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="parent@email.com"
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {error && <p className="text-xs text-red-600">{error}</p>}
      
      {parentEmails.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {parentEmails.map(email => (
            <Badge key={email} className="bg-blue-100 text-blue-800 pr-1">
              <Mail className="w-3 h-3 mr-1" />
              {email}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(email)}
                  className="ml-1 hover:bg-blue-200 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}