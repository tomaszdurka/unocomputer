'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Prompt } from '#/lib/types';
import { Dialog, DialogContent } from '@app/ui/dialog';
import { listPrompts, createPrompt, deletePrompt } from '#/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '@app/ui';

export default function PromptLibraryDialog({ open, onOpenChange, onSelectPrompt }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrompt?: (prompt: Prompt) => void;
}) {
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '', prompt: '' });

  const loadPrompts = useCallback(async () => {
    try {
      const data = await listPrompts();
      setPrompts(data);
    } catch (err: unknown) {
      console.error('Failed to load prompts:', err);
    }
  }, []);

  // `open` is a prop, so this component cannot load from the event that opened it -
  // reacting to the prop is exactly what an effect is for here. The rule guards against
  // cascading renders; this setState lands after an await, a tick later.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPrompts();
    }
  }, [open, loadPrompts]);


  const handleAddPrompt = async () => {
    if (!newPrompt.name.trim() || !newPrompt.prompt.trim()) {
      return;
    }

    try {
      await createPrompt(newPrompt);
      setNewPrompt({ name: '', description: '', prompt: '' });
      setShowAddForm(false);
      await loadPrompts();
    } catch (err: unknown) {
      console.error('Failed to create prompt:', err);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Delete this prompt?')) return;

    try {
      await deletePrompt(promptId);
      await loadPrompts();
    } catch (err: unknown) {
      console.error('Failed to delete prompt:', err);
    }
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    onSelectPrompt?.(prompt);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" title="Saved Prompts">
        <div className="max-h-[60vh]">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {(prompts?.length ?? 0)} saved {(prompts?.length ?? 0) === 1 ? 'prompt' : 'prompts'}
              </p>
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                variant={showAddForm ? 'outline' : 'primary'}
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddForm ? 'Cancel' : 'New Prompt'}
              </Button>
            </div>

            {showAddForm && (
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-neutral-800/40">
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
                  className="w-full min-h-[100px] rounded-md border border-gray-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 dark:ring-neutral-500 resize-y"
                />
                <Button onClick={handleAddPrompt} className="w-full">
                  Save Prompt
                </Button>
              </div>
            )}

            {prompts === null ? (
              <p className="text-center py-8 text-sm text-gray-500 dark:text-neutral-400">Loading...</p>
            ) : (prompts?.length ?? 0) === 0 ? (
              <p className="text-center py-8 text-sm text-gray-500 dark:text-neutral-400">
                No saved prompts yet. Click &quot;New Prompt&quot; to create one.
              </p>
            ) : (
              <div className="space-y-2">
                {(prompts ?? []).map((prompt) => (
                  <div
                    key={prompt.promptId}
                    className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition cursor-pointer group"
                    onClick={() => handleSelectPrompt(prompt)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{prompt.name}</h3>
                        {prompt.description && (
                          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">{prompt.description}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-2 line-clamp-2">
                          {prompt.prompt}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrompt(prompt.promptId);
                        }}
                        className="ml-3 p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
