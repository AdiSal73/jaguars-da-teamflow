import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function RankingBadge({ ranking, onManualRank, isUpdating }) {
  const [showDialog, setShowDialog] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);

  const startLongPress = (e) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setInputValue(String(ranking || ''));
      setShowDialog(true);
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setInputValue(String(ranking || ''));
    setShowDialog(true);
  };

  const handleClick = (e) => {
    if (longPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleConfirm = () => {
    const num = parseInt(inputValue);
    if (!num || num < 1 || num > 999) return;
    onManualRank(num);
    setShowDialog(false);
  };

  // Focus input when dialog opens
  useEffect(() => {
    if (showDialog) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showDialog]);

  // Close on outside click
  useEffect(() => {
    if (!showDialog) return;
    const handle = (e) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target)) {
        setShowDialog(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showDialog]);

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <div
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        title="Long press or right-click to edit ranking"
        className={`
          bg-gradient-to-br from-amber-500 to-orange-600 text-white 
          text-sm sm:text-base px-2 sm:px-2.5 py-0.5 rounded-lg font-black shadow-md 
          flex-shrink-0 cursor-pointer select-none
          ${isUpdating ? 'opacity-60 animate-pulse' : 'hover:from-amber-400 hover:to-orange-500 active:scale-95'}
        `}
      >
        #{ranking}
      </div>

      {showDialog && (
        <div
          ref={dialogRef}
          className="absolute z-50 top-8 left-0 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 w-44"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-xs font-semibold text-slate-500 mb-2">Set rank</p>
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={999}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') setShowDialog(false);
            }}
            className="w-full text-center text-xl font-bold h-10 border-2 border-amber-400 rounded-lg focus:outline-none focus:border-amber-500 mb-2"
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowDialog(false)}
              className="flex-1 text-xs py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!inputValue || parseInt(inputValue) < 1}
              className="flex-1 text-xs py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-40"
            >
              Set #{inputValue}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}