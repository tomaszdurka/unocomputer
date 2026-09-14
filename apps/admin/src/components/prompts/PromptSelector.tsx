'use client';

import { useState, useCallback } from 'react';
import type { Prompt } from '#/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@app/ui/popover';
import { Dialog, DialogContent } from '@app/ui/dialog';
import { listPrompts, createPrompt, deletePrompt } from '#/lib/api';
import { BookmarkPlus, Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '@app/ui';

export default function PromptSelector({ onSelect }: { onSelect: (prompt: Prompt) => void }) {
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '', prompt: '' });

  const loadPrompts = useCallback(async () => {
    try {
      const data = await listPrompts();
      setPrompts(data);
    } catch (err: unknown) {
      console.error('Failed to load prompts:', err);
    }
  }, []);



  const handleCreatePrompt = async () => {
    if (!newPrompt.name.trim() || !newPrompt.prompt.trim()) {
      return;
    }

    try {
      await createPrompt(newPrompt);
      setNewPrompt({ name: '', description: '', prompt: '' });
      setShowCreateDialog(false);
      await loadPrompts();
    } catch (err: unknown) {
      console.error('Failed to create prompt:', err);
    }
  };

  const handleDeletePrompt = async (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this prompt?')) return;

    try {
      await deletePrompt(promptId);
      await loadPrompts();
    } catch (err: unknown) {
      console.error('Failed to delete prompt:', err);
    }
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    onSelect(prompt);
    setOpen(false);
  };

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Load on open rather than from an effect: the component owns this state, so
          // the fetch belongs in the event that causes it.
          if (next) loadPrompts();
        }}
      >
        <PopoverTrigger asChild>
          <button
            className="text-xs text-mint hover:text-mint/80 flex items-center gap-1 transition"
            type="button"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            Browse Saved
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2 max-h-[400px] overflow-y-auto" align="end">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                {(prompts?.length ?? 0)} saved
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowCreateDialog(true);
                  setOpen(false);
                }}
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            </div>
            {prompts === null ? (
              <p className="text-center py-4 text-xs text-gray-500 dark:text-neutral-400">Loading...</p>
            ) : (prompts?.length ?? 0) === 0 ? (
              <p className="text-center py-4 text-xs text-gray-500 dark:text-neutral-400">No saved prompts</p>
            ) : (
              (prompts ?? []).map((prompt) => (
                <div
                  key={prompt.promptId}
                  className="p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer group"
                  onClick={() => handleSelectPrompt(prompt)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{prompt.name}</p>
                      {prompt.description && (
                        <p className="text-[11px] text-gray-500 dark:text-neutral-400 truncate mt-0.5">
                          {prompt.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeletePrompt(e, prompt.promptId)}
                      className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent title="Create New Prompt" className="max-w-2xl">
          <div>
            <div className="space-y-3">
              <Input
                placeholder="Prompt name"
                value={newPrompt.name}
                onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
              />
              <Input
                placeholder="Description (optional)"
                value={newPrompt.description}
                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
              />
              <textarea
                placeholder="Prompt text"
                value={newPrompt.prompt}
                onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                className="w-full min-h-[400px] max-h-[60vh] rounded-md border border-gray-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 dark:ring-neutral-500 resize-y"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePrompt}>
                  Save Prompt
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
