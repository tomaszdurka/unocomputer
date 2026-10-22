'use client';

import { useEffect, useState, useMemo } from 'react';
import { modelChoices, type Prompt, type Run } from '#/lib/types';
import { getSettings, listProviders } from '#/lib/api';
import { Dialog, DialogContent } from '@app/ui/dialog';
import { X, ArrowDownNarrowWide } from 'lucide-react';
import PromptSelector from '#/components/prompts/PromptSelector';
import Link from 'next/link';
import { Alert, Badge, Button } from '@app/ui';

type RunPromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    prompt: string;
    schema?: unknown;
    model?: string;
  }) => Promise<{ runId?: string }>;
  dialogTitle?: string;
  runs?: Run[];
  submitButtonText?: string;
};

export default function RunPromptDialog({
  open,
  onOpenChange,
  onSubmit,
  dialogTitle = 'Run Prompt',
  runs = [],
  submitButtonText = 'Run Prompt',
}: RunPromptDialogProps) {
  const [selectedSavedPrompt, setSelectedSavedPrompt] = useState<Prompt | null>(
    null,
  );
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [runSchema, setRunSchema] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runSuccess, setRunSuccess] = useState<string | null>(null);

  // Determine last used model from runs (most recent run's model)
  const lastUsedModel = useMemo(() => {
    if (!runs || runs.length === 0) return null;
    const sortedRuns = [...runs].sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
    return sortedRuns[0]?.model || null;
  }, [runs]);

  // What the picker suggests and what it starts on come from the backend: the
  // providers that are on and installed, and the default from settings. Loaded
  // when the dialog opens so a closed one costs nothing. An empty model is sent
  // as none, and the backend applies the same default itself.
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [settingsDefault, setSettingsDefault] = useState<string | null>(null);
  // True once settings say no preference is usable: every provider off or missing.
  const [noUsableModel, setNoUsableModel] = useState(false);
  const [runModel, setRunModel] = useState(lastUsedModel ?? '');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([listProviders(), getSettings()])
      .then(([providers, settings]) => {
        if (cancelled) return;
        setSuggestions(modelChoices(providers));
        setSettingsDefault(settings.effectiveModel);
        setNoUsableModel(settings.effectiveModel === null);
      })
      .catch(() => {
        // The field still takes free text; the backend validates either way.
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const placeholderModel = lastUsedModel ?? settingsDefault ?? '';

  const handleSelectPrompt = (selectedPrompt: Prompt) => {
    setSelectedSavedPrompt(selectedPrompt);
  };

  const handleCopyPromptToTextarea = () => {
    if (selectedSavedPrompt) {
      const currentText = additionalPrompt.trim();
      const promptText = selectedSavedPrompt.prompt.trim();
      setAdditionalPrompt(
        currentText ? `${promptText}\n\n${currentText}` : promptText,
      );
      setSelectedSavedPrompt(null);
    }
  };

  const handleRemoveSavedPrompt = () => {
    setSelectedSavedPrompt(null);
  };

  const handleSubmit = async () => {
    const finalPrompt = selectedSavedPrompt
      ? additionalPrompt.trim()
        ? `${selectedSavedPrompt.prompt}\n\n${additionalPrompt}`
        : selectedSavedPrompt.prompt
      : additionalPrompt;

    if (!finalPrompt.trim()) {
      setRunError('Prompt is required');
      return;
    }

    setIsSubmitting(true);
    setRunError(null);
    setRunSuccess(null);

    try {
      let schema = undefined;
      if (runSchema.trim()) {
        try {
          schema = JSON.parse(runSchema);
        } catch {
          setRunError('Invalid JSON schema format');
          setIsSubmitting(false);
          return;
        }
      }

      const result = await onSubmit({
        prompt: finalPrompt,
        schema,
        model: runModel.trim() || undefined,
      });

      setRunSuccess(`Job queued successfully! Run ID: ${result.runId}`);
      setSelectedSavedPrompt(null);
      setAdditionalPrompt('');
      setRunSchema('');

      // Close dialog after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setRunSuccess(null);
        window.location.reload(); // Refresh to show new run
      }, 2000);
    } catch (err: unknown) {
      setRunError(
        (err instanceof Error ? err.message : String(err)) ||
          'Failed to queue job',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={dialogTitle}>
        <div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <input
                list="run-model-options"
                value={runModel}
                onChange={(e) => setRunModel(e.target.value)}
                placeholder={placeholderModel}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 dark:ring-neutral-500"
                disabled={isSubmitting}
              />
              <datalist id="run-model-options">
                {suggestions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                A provider, optionally pinning its model as provider:model.
                Leave empty for{' '}
                {lastUsedModel
                  ? `the session's last (${lastUsedModel})`
                  : settingsDefault
                    ? `the default (${settingsDefault})`
                    : 'the default'}
                .
              </p>
              {noUsableModel ? (
                <Alert variant="warning" className="mt-2">
                  No provider can take this run: every one is disabled or not
                  installed. Fix that in{' '}
                  <Link href="/settings/providers" className="underline">
                    Settings &rarr; Providers
                  </Link>
                  .
                </Alert>
              ) : null}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  {selectedSavedPrompt ? 'Additional Instructions' : 'Prompt'}{' '}
                  <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <PromptSelector onSelect={handleSelectPrompt} />
              </div>
              {selectedSavedPrompt && (
                <div className="mb-2 flex items-center gap-2 p-2 rounded-lg border bg-gray-100 dark:bg-neutral-800/30">
                  <Badge
                    variant="outline"
                    className="bg-mint/10 text-mint border-mint/20"
                  >
                    {selectedSavedPrompt.name}
                  </Badge>
                  <button
                    onClick={handleCopyPromptToTextarea}
                    className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-neutral-100 transition flex items-center gap-1"
                    title="Copy to textarea to edit"
                    type="button"
                  >
                    <ArrowDownNarrowWide className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handleRemoveSavedPrompt}
                    className="ml-auto p-1 text-gray-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                    title="Remove saved prompt"
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <textarea
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder={
                  selectedSavedPrompt
                    ? 'Add additional instructions (optional)...'
                    : 'Enter your prompt here...'
                }
                className={`w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 dark:ring-neutral-500 resize-y ${selectedSavedPrompt ? 'min-h-[120px] max-h-[60vh]' : 'min-h-[240px] max-h-[60vh]'}`}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Output Schema (Optional JSON)
              </label>
              <textarea
                value={runSchema}
                onChange={(e) => setRunSchema(e.target.value)}
                placeholder='{"type": "object", "properties": {...}}'
                className="w-full min-h-[100px] rounded-md border border-gray-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-400 dark:ring-neutral-500 resize-y"
                disabled={isSubmitting}
              />
            </div>
            {runError && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-sm text-rose-700 dark:text-rose-400">
                {runError}
              </div>
            )}
            {runSuccess && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                {runSuccess}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (!selectedSavedPrompt && !additionalPrompt.trim())
                }
              >
                {isSubmitting ? 'Queuing...' : submitButtonText}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
