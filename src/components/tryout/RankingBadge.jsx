import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Ranking badge that supports long-press (or right-click on desktop) to manually set a ranking.
 * onManualRank(newRanking: number) — called when user confirms a new rank.
 */
export default function RankingBadge({ ranking, onManualRank, isUpdating }) {
  const [showDialog, setShowDialog] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

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
    // Prevent card navigation if long press was triggered
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

  return (
    <>
      <div
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        title="Long press to edit ranking"
        className={`
          bg-gradient-to-br from-amber-500 to-orange-600 text-white 
          text-sm sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg font-black shadow-md 
          flex-shrink-0 cursor-pointer select-none
          ${isUpdating ? 'opacity-60 animate-pulse' : 'hover:from-amber-400 hover:to-orange-500 active:scale-95'}
        `}
      >
        #{ranking}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xs" onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-base">Set Age Group Ranking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Enter a rank number. Other players' rankings will shift to accommodate.
            </p>
            <Input
              type="number"
              min={1}
              max={999}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') setShowDialog(false); }}
              className="text-center text-2xl font-bold h-14"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                onClick={handleConfirm}
                disabled={!inputValue || parseInt(inputValue) < 1}
              >
                Set Rank #{inputValue}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}