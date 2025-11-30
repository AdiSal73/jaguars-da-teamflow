import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';

export default function ComboboxInput({ value, onChange, options = [], placeholder = 'Select or type...', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (option) => {
    setSearch(option);
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pr-8"
        />
        <ChevronDown 
          className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      {isOpen && (filteredOptions.length > 0 || search) && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.map((option, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 transition-colors"
            >
              {option}
            </button>
          ))}
          {search && !filteredOptions.includes(search) && (
            <button
              type="button"
              onClick={() => handleSelect(search)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 text-emerald-700 border-t"
            >
              Use "{search}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}