'use client';

import Link from 'next/link';
import type { Run, Workspace, WorkspaceSessionSummary } from '#/lib/types';
import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Dialog, DialogContent } from '@app/ui/dialog';
import { updateWorkspace, getWorkspaceFile, queueRun } from '#/lib/api';
import { Edit2, Check, X, FileText, Play, Copy } from 'lucide-react';
import RunPromptDialog from '#/components/runs/RunPromptDialog';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, DataTable, Input, Separator } from '@app/ui';
import type { Column } from '@app/ui';

const sessionStatusClass = (status: string) =>
  status === 'success' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' :
  status === 'running' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900' :
  status === 'failure' ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-900' :
  status === 'stopped' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900' :
  'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border-gray-200 dark:border-neutral-800';

const sessionColumns: Column<WorkspaceSessionSummary>[] = [
  {
    key: 'sessionId',
    header: 'Session ID',
    className: 'truncate',
    cell: (session) => <span className="font-mono font-medium">{session.sessionId}</span>
  },
  {
    key: 'status',
    header: 'Status',
    width: '110px',
    cell: (session) => (
      <Badge variant="outline" className={sessionStatusClass(session.status)}>
        {session.status}
      </Badge>
    )
  },
  {
    key: 'runs',
    header: 'Runs',
    width: '110px',
    cell: (session) => (
      <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900">
        {session.runCount} run{session.runCount !== 1 ? 's' : ''}
      </Badge>
    )
  },
  {
    key: 'lastUsed',
    header: 'Last Activity',
    width: '220px',
    className: 'whitespace-nowrap text-gray-500 dark:text-neutral-400',
    cell: (session) => session.lastUsed
  }
];

export default function WorkspaceDetailView({ workspace }: { workspace: Workspace }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(workspace.name || '');
  const [currentName, setCurrentName] = useState(workspace.name || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState('AGENTS.md');
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const runs = workspace.runs ?? [];
  const availableFiles = ['AGENTS.md'];

  // Extract unique sessions from runs with status
  const sessions = useMemo(() => {
    const sessionMap = new Map();
    runs.forEach((run) => {
      if (run.session) {
        const sid = run.session.sessionId;
        if (!sessionMap.has(sid)) {
          sessionMap.set(sid, {
            sessionId: sid,
            lastUsed: run.startedAt,
            runCount: 0,
            runs: []
          });
        }
        sessionMap.get(sid).runCount++;
        sessionMap.get(sid).runs.push(run);
        const lastUsed = sessionMap.get(sid).lastUsed;
        if (Date.parse(run.startedAt) > Date.parse(lastUsed)) {
          sessionMap.get(sid).lastUsed = run.startedAt;
        }
      }
    });

    // Compute status for each session
    return Array.from(sessionMap.values()).map(session => {
      const sessionRuns = session.runs;
      let status = 'success';

      if (sessionRuns.some((r: Run) => r.status === 'running')) {
        status = 'running';
      } else if (sessionRuns.some((r: Run) => r.status === 'failure')) {
        status = 'failure';
      } else if (sessionRuns.some((r: Run) => r.status === 'stopped')) {
        status = 'stopped';
      }

      return { ...session, status };
    }).sort(
      (a, b) => (Date.parse(a.lastUsed ?? '') || 0) - (Date.parse(b.lastUsed ?? '') || 0)
    );
  }, [runs]);

  const handleSaveName = async () => {
    setIsSaving(true);
    try {
      await updateWorkspace(workspace.workspaceId, {
        name: editedName.trim() || null
      });
      setCurrentName(editedName.trim() || null);
      setIsEditingName(false);
    } catch (err: unknown) {
      console.error('Failed to update workspace name:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(currentName || '');
    setIsEditingName(false);
  };

  const handleOpenFiles = async () => {
    setShowFilesDialog(true);
    await loadFile('AGENTS.md');
  };

  const loadFile = async (filename: string) => {
    setSelectedFile(filename);
    setLoadingFile(true);
    setFileError(null);
    try {
      const data = await getWorkspaceFile(workspace.workspaceId, filename);
      setFileContent(data.content);
    } catch (err: unknown) {
      setFileError((err instanceof Error ? err.message : String(err)) || 'Failed to load file');
      setFileContent('');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleRunSubmit = async ({ prompt, schema, model }: { prompt: string; schema?: unknown; model?: string }) => {
    return await queueRun({
      prompt,
      schema,
      workspaceId: workspace.workspaceId, // Always create new session
      model,
    });
  };

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(workspace.workingDir);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    } catch (err: unknown) {
      console.error('Failed to copy path:', err);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Workspace name"
                  className="flex-1 text-lg font-semibold"
                  autoFocus
                  disabled={isSaving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="p-2 text-green-700 hover:bg-green-50 rounded-lg transition"
                  title="Save"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-2 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                  title="Cancel"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <h2 className="flex-1 text-2xl font-bold tracking-tight">
                  {currentName || (
                    <span className="text-gray-500 dark:text-neutral-400 italic">Unnamed Workspace</span>
                  )}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-2 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
                  title="Edit name"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showFilesDialog} onOpenChange={setShowFilesDialog}>
        <DialogContent title="Workspace Files">
          <div className="max-h-[70vh]">
            <div className="mb-4 flex gap-2 border-b">
              {availableFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => loadFile(file)}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    selectedFile === file
                      ? 'border-b-2 border-mint text-mint'
                      : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100'
                  }`}
                >
                  {file}
                </button>
              ))}
            </div>
            {loadingFile ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-gray-500 dark:text-neutral-400">Loading...</div>
              </div>
            ) : fileError ? (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-400">
                {fileError}
              </div>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-neutral-100" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-neutral-100" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-neutral-100" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-base font-semibold mt-3 mb-2 text-gray-900 dark:text-neutral-100" {...props} />,
                    h5: ({node, ...props}) => <h5 className="text-sm font-semibold mt-3 mb-2 text-gray-900 dark:text-neutral-100" {...props} />,
                    h6: ({node, ...props}) => <h6 className="text-sm font-semibold mt-3 mb-2 text-gray-700 dark:text-neutral-300" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-gray-700 dark:text-neutral-300 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="mb-4 ml-6 list-disc space-y-2 text-gray-700 dark:text-neutral-300" {...props} />,
                    ol: ({node, ...props}) => <ol className="mb-4 ml-6 list-decimal space-y-2 text-gray-700 dark:text-neutral-300" {...props} />,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-neutral-700 pl-4 my-4 italic text-gray-600 dark:text-neutral-400" {...props} />,
                    code: ({node, className, ...props}) =>
                      className?.startsWith('language-')
                        ? <code className={`block bg-gray-100 dark:bg-neutral-800 p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono ${className}`} {...props} />
                        : <code className="bg-gray-100 dark:bg-neutral-800 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-gray-100 dark:bg-neutral-800 p-4 rounded-lg my-4 overflow-x-auto" {...props} />,
                    a: ({node, ...props}) => <a className="text-mint hover:underline font-medium" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-6 border-gray-200 dark:border-neutral-800" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-neutral-100" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                  }}
                >
                  {fileContent}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Workspace Info</CardTitle>
            <Button onClick={() => setShowRunDialog(true)}>
              <Play className="h-4 w-4 mr-2" />
              Run Prompt
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="grid-label">Workspace ID:</span>{' '}
            <span className="ml-2 font-mono">{workspace.workspaceId}</span>
          </p>
          <p>
            <span className="grid-label">Working Dir:</span>{' '}
            {workspace.workingDir ? (
              <span className="relative inline-block ml-2">
                <button
                  onClick={handleCopyPath}
                  className="text-gray-500 dark:text-neutral-400 hover:text-gray-600 dark:hover:text-neutral-400 inline-flex items-center gap-1.5 group/path transition"
                >
                  <span>{workspace.workingDir}</span>
                  <Copy className="h-3 w-3 text-gray-400 dark:text-neutral-500 opacity-0 group-hover/path:opacity-100 transition" />
                </button>
                {copiedPath && (
                  <span className="absolute right-0 top-full mt-1 bg-gray-900 dark:bg-neutral-100 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                    Copied!
                  </span>
                )}
              </span>
            ) : (
              <span className="ml-2 text-gray-500 dark:text-neutral-400">-</span>
            )}
          </p>
          <p>
            <span className="grid-label">Created:</span>{' '}
            <span className="ml-2 text-gray-500 dark:text-neutral-400">{workspace.createdAt}</span>
          </p>
          <p>
            <span className="grid-label">Updated:</span>{' '}
            <span className="ml-2 text-gray-500 dark:text-neutral-400">{workspace.updatedAt}</span>
          </p>
          <Separator className="my-4" />
          <Button
            variant="outline"
            className="w-full"
            onClick={handleOpenFiles}
          >
            <FileText className="h-4 w-4 mr-2" />
            View Workspace Files
          </Button>
        </CardContent>
      </Card>

      <RunPromptDialog
        open={showRunDialog}
        onOpenChange={setShowRunDialog}
        onSubmit={handleRunSubmit}
        dialogTitle="New Run (Creates New Session)"
        runs={runs}
        submitButtonText="Run Prompt"
      />

      <DataTable
        title={`Sessions (${sessions.length})`}
        columns={sessionColumns}
        rows={sessions}
        rowKey={(session) => session.sessionId}
        rowHref={(session) => `/sessions/${session.sessionId}`}
        empty="No sessions in this workspace yet."
      />
    </div>
  );
}
