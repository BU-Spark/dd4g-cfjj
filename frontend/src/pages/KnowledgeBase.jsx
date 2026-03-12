import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import {
    UploadCloud, FileSpreadsheet, CheckCircle2,
    RefreshCw, Download, Database, HardDrive, FileText, Loader2, AlertCircle, Lock, X
} from 'lucide-react';
import { useAuth, useUser } from '@clerk/react';
import { cn } from '../lib/utils';
import { createApiClient } from '../lib/api';

const NARRATIVE_KEYWORDS = ['narrative', 'description', 'summary', 'notes', 'comment', 'text', 'detail'];
const STRUCTURED_KEYWORDS = ['id', 'date', 'code', 'status', 'type', 'number', 'count', 'flag'];

function detectType(headers) {
    const lower = headers.map(h => h.toLowerCase());
    const hasNarrative = lower.some(h => NARRATIVE_KEYWORDS.some(k => h.includes(k)));
    const hasStructured = lower.some(h => STRUCTURED_KEYWORDS.some(k => h.includes(k)));
    if (hasNarrative && hasStructured) return 'Mixed';
    if (hasNarrative) return 'Narratives';
    if (hasStructured) return 'Structured';
    return 'Unknown';
}

function previewCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve({
                    rowCount: results.data.length,
                    detectedType: detectType(results.meta.fields || []),
                });
            },
            error: reject,
        });
    });
}

function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
}

function formatDate(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

const getStatusBadge = (status) => {
    const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border";
    switch (status) {
        case 'Ready': return cn(base, "bg-emerald-50 text-emerald-700 border-emerald-200");
        case 'Processing': return cn(base, "bg-blue-50 text-cfjj-blue border-blue-200");
        case 'Needs Review': return cn(base, "bg-amber-50 text-amber-700 border-amber-200");
        case 'Failed': return cn(base, "bg-red-50 text-red-700 border-red-200");
        default: return cn(base, "bg-gray-50 text-gray-700 border-gray-200");
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'Ready': return <CheckCircle2 className="w-3.5 h-3.5" />;
        case 'Processing': return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
        case 'Failed': return <AlertCircle className="w-3.5 h-3.5" />;
        default: return null;
    }
};

export default function KnowledgeBase() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';
    const api = useCallback(() => createApiClient(getToken), [getToken])();

    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [ragFiles, setRagFiles] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        api.listRagFiles()
            .then(setRagFiles)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const validateFile = (file) => {
        if (!file.name.endsWith('.csv')) return 'Only CSV files are accepted.';
        if (file.size > 50 * 1024 * 1024) return 'File exceeds 50MB limit.';
        return null;
    };

    const handleFile = async (file) => {
        if (!file) return;
        setUploadError(null);

        const err = validateFile(file);
        if (err) { setUploadError(err); return; }

        let preview = { rowCount: '—', detectedType: 'Unknown' };
        try {
            preview = await previewCSV(file);
        } catch {
            // non-blocking, fall back to defaults
        }

        const newEntry = {
            id: Date.now(),
            name: file.name,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'Processing',
            records: preview.rowCount !== '—' ? preview.rowCount.toLocaleString() : '—',
            type: preview.detectedType,
        };
        setUploadedFiles(f => [newEntry, ...f]);
        setUploading(true);

        try {
            await api.uploadRagFile(file);
            setUploadedFiles(f => f.map(entry =>
                entry.id === newEntry.id
                    ? { ...entry, status: 'Ready' }
                    : entry
            ));
        } catch {
            setUploadedFiles(f => f.map(entry =>
                entry.id === newEntry.id ? { ...entry, status: 'Failed' } : entry
            ));
            setUploadError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleInputChange = (e) => {
        handleFile(e.target.files[0]);
        e.target.value = '';
    };

    const handleRemove = (id) => setUploadedFiles(f => f.filter(entry => entry.id !== id));

    async function handleDownload(file) {
        if (!file.gcsUri || downloading) return;
        setDownloading(file.name);
        try {
            const blob = await api.downloadRagFile(file.gcsUri);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.displayName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setDownloading(null);
        }
    }

    const totalFiles = ragFiles.length + uploadedFiles.length;

    return (
        <div className="flex-1 flex flex-col gap-8 animate-fade-in max-w-6xl mx-auto w-full">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-cfjj-navy tracking-tight">
                        Knowledge Base
                    </h1>
                    <p className="text-cfjj-text-secondary">
                        Upload CSV files to refresh the data used for source-backed analysis.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-cfjj-border/60 shadow-sm">
                        <Database className="w-4 h-4 text-cfjj-blue" />
                        <span className="text-sm font-medium text-cfjj-navy">
                            {loading ? '...' : `${totalFiles} Files`}
                        </span>
                    </div>
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cfjj-muted text-cfjj-navy hover:bg-cfjj-border/50 border border-cfjj-border/60 transition-colors text-sm font-medium"
                        onClick={() => {
                            setLoading(true);
                            setError(null);
                            api.listRagFiles()
                                .then(setRagFiles)
                                .catch((err) => setError(err.message))
                                .finally(() => setLoading(false));
                        }}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Sync Status
                    </button>
                </div>
            </div>

            {uploadError && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium animate-fade-in">
                    <AlertCircle className="w-4 h-4 flex-none" />
                    {uploadError}
                    <button onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">

                    {isAdmin ? (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleInputChange}
                            />
                            <div
                                className={cn(
                                    "relative group rounded-2xl border-2 border-dashed p-8 text-center transition-all bg-white flex flex-col items-center justify-center min-h-[240px]",
                                    isDragging ? "border-cfjj-blue bg-cfjj-muted/50 scale-[1.02]" : "border-cfjj-border/80 hover:border-cfjj-navy/40 hover:bg-cfjj-muted/20",
                                    uploading && "pointer-events-none opacity-60"
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                            >
                                <div className={cn(
                                    "w-14 h-14 bg-cfjj-muted rounded-full flex items-center justify-center mb-4 text-cfjj-blue transition-transform duration-300",
                                    !uploading && "group-hover:scale-110"
                                )}>
                                    {uploading ? <RefreshCw className="w-7 h-7 animate-spin" /> : <UploadCloud className="w-7 h-7" />}
                                </div>
                                <h3 className="text-base font-semibold text-cfjj-navy mb-1.5">
                                    {uploading ? 'Uploading...' : 'Upload Sources'}
                                </h3>
                                <p className="text-sm text-cfjj-text-secondary mb-6 max-w-[200px]">
                                    {uploading ? 'Processing your file, please wait.' : 'Drop CSV files here or browse to upload new source data'}
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-5 py-2.5 rounded-xl bg-cfjj-navy text-white text-sm font-medium hover:bg-cfjj-deep-blue transition-colors shadow-sm w-full mx-auto max-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? 'Uploading...' : 'Select Files'}
                                </button>
                                <p className="text-xs text-cfjj-text-secondary/70 mt-4 font-mono">
                                    CSV only, up to 50MB per file
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-2xl border-2 border-dashed border-cfjj-border/60 p-8 text-center bg-white flex flex-col items-center justify-center min-h-[240px]">
                            <div className="w-14 h-14 bg-cfjj-muted rounded-full flex items-center justify-center mb-4 text-cfjj-text-secondary">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-semibold text-cfjj-navy mb-1.5">View Only</h3>
                            <p className="text-sm text-cfjj-text-secondary max-w-[200px]">
                                Only admins can upload new source files.
                            </p>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-cfjj-border/60 p-5 space-y-4 shadow-sm">
                        <h3 className="font-heading font-semibold text-cfjj-navy text-sm flex items-center gap-2 pb-2 border-b border-cfjj-border/40">
                            <HardDrive className="w-4 h-4 text-cfjj-text-secondary" />
                            Ingestion Process
                        </h3>
                        <div className="space-y-4">
                            {[
                                { step: 1, title: 'File Received', desc: 'Validated and stored securely.', accent: false },
                                { step: 2, title: 'Processing Data', desc: 'Extracting rows and normalizing fields.', accent: false },
                                { step: 3, title: 'Ready to Search', desc: 'Available in the Analysis Workspace.', accent: true },
                            ].map(({ step, title, desc, accent }) => (
                                <div key={step} className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white",
                                        accent ? "bg-cfjj-orange/10 text-cfjj-orange" : "bg-cfjj-muted text-cfjj-navy"
                                    )}>
                                        {step}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-cfjj-navy">{title}</h4>
                                        <p className="text-xs text-cfjj-text-secondary">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-cfjj-border/60 shadow-sm overflow-hidden">

                    <div className="px-6 py-5 border-b border-cfjj-border/60 flex items-center justify-between bg-cfjj-bg/50">
                        <h2 className="font-heading font-semibold text-cfjj-navy text-lg flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-cfjj-blue" />
                            Data Library
                        </h2>
                        <div className="text-xs font-medium text-cfjj-text-secondary bg-white px-3 py-1.5 rounded-md border border-cfjj-border/60">
                            {loading ? '...' : `${totalFiles} ${totalFiles === 1 ? 'File' : 'Files'}`}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center py-20 text-cfjj-text-secondary">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            <span className="text-sm">Loading files…</span>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center py-20 text-red-600 gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    ) : totalFiles === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-cfjj-text-secondary gap-3">
                            <FileSpreadsheet className="w-8 h-8 opacity-30" />
                            <p className="text-sm">No files uploaded yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-cfjj-border/60 text-xs text-cfjj-text-secondary/80 font-mono tracking-wider bg-cfjj-bg/30">
                                        <th className="px-6 py-4 font-semibold">File Name</th>
                                        <th className="px-6 py4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold hidden md:table-cell">Size / Records</th>
                                        <th className="px-6 py-4 font-semibold text-right">Added</th>
                                        <th className="px-4 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-cfjj-border/40">
                                    {/* RAG corpus files */}
                                    {ragFiles.map((file) => (
                                        <tr key={file.name} className="hover:bg-cfjj-muted/30 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded bg-cfjj-bg text-cfjj-text-secondary group-hover:text-cfjj-blue transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-cfjj-text-primary truncate max-w-[180px]">
                                                        {file.displayName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={getStatusBadge('Ready')}>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Ready
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="text-sm font-mono text-cfjj-text-secondary">
                                                    {formatSize(file.sizeBytes)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm text-cfjj-text-secondary">
                                                    {formatDate(file.createTime)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button
                                                    title={file.gcsUri ? 'Download file' : 'No source file available'}
                                                    disabled={!file.gcsUri || downloading === file.name}
                                                    onClick={() => handleDownload(file)}
                                                    className={cn(
                                                        "p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100",
                                                        file.gcsUri
                                                            ? "text-cfjj-text-secondary hover:text-cfjj-navy hover:bg-cfjj-muted"
                                                            : "text-cfjj-border cursor-not-allowed"
                                                    )}
                                                >
                                                    {downloading === file.name
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <Download className="w-4 h-4" />
                                                    }
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Locally uploaded files */}
                                    {uploadedFiles.map((file) => (
                                        <tr key={file.id} className="hover:bg-cfjj-muted/30 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded bg-cfjj-bg text-cfjj-text-secondary group-hover:text-cfjj-blue transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-cfjj-text-primary truncate max-w-[180px]">
                                                        {file.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={getStatusBadge(file.status)}>
                                                    {getStatusIcon(file.status)}
                                                    {file.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="text-sm font-mono text-cfjj-text-secondary">
                                                    {file.records} rows
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm text-cfjj-text-secondary">
                                                    {file.date}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button
                                                    onClick={() => handleRemove(file.id)}
                                                    className="p-1.5 text-cfjj-border group-hover:text-red-400 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove file"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="p-4 border-t border-cfjj-border/60 bg-cfjj-bg/30 text-center text-xs text-cfjj-text-secondary/80 font-medium">
                        Files are automatically processed upon upload. Review logs for 'Needs Review' items.
                    </div>

                </div>

            </div>
        </div>
    );
}
