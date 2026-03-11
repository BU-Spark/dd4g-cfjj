import { useState, useEffect, useCallback } from 'react';
import {
    UploadCloud, FileSpreadsheet, CheckCircle2,
    RefreshCw, Download, Database, HardDrive, FileText, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '@clerk/react';
import { cn } from '../lib/utils';
import { createApiClient } from '../lib/api';

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

function formatTotalSize(files) {
    const total = files.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
    return formatSize(total);
}

export default function KnowledgeBase() {
    const { getToken } = useAuth();
    const api = useCallback(() => createApiClient(getToken), [getToken])();

    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        api.listRagFiles()
            .then(setFiles)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

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
                            {loading ? '...' : formatTotalSize(files)}
                        </span>
                    </div>
                    <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cfjj-muted text-cfjj-navy hover:bg-cfjj-border/50 border border-cfjj-border/60 transition-colors text-sm font-medium"
                        onClick={() => {
                            setLoading(true);
                            setError(null);
                            api.listRagFiles()
                                .then(setFiles)
                                .catch((err) => setError(err.message))
                                .finally(() => setLoading(false));
                        }}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Sync Status
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Upload & Workflow */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Upload Dropzone */}
                    <div
                        className={cn(
                            "relative group rounded-2xl border-2 border-dashed p-8 text-center transition-all bg-white flex flex-col items-center justify-center min-h-[240px]",
                            isDragging
                                ? "border-cfjj-blue bg-cfjj-muted/50 scale-[1.02]"
                                : "border-cfjj-border/80 hover:border-cfjj-navy/40 hover:bg-cfjj-muted/20"
                        )}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
                    >
                        <div className="w-14 h-14 bg-cfjj-muted rounded-full flex items-center justify-center mb-4 text-cfjj-blue group-hover:scale-110 transition-transform duration-300">
                            <UploadCloud className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-semibold text-cfjj-navy mb-1.5">
                            Upload Sources
                        </h3>
                        <p className="text-sm text-cfjj-text-secondary mb-6 max-w-[200px]">
                            Drop CSV files here or browse to upload new source data
                        </p>
                        <button className="px-5 py-2.5 rounded-xl bg-cfjj-navy text-white text-sm font-medium hover:bg-cfjj-deep-blue transition-colors shadow-sm w-full mx-auto max-w-[200px]">
                            Select Files
                        </button>
                        <p className="text-xs text-cfjj-text-secondary/70 mt-4 font-mono">
                            CSV only, up to 50MB per file
                        </p>
                    </div>

                    {/* Workflow Cards */}
                    <div className="bg-white rounded-2xl border border-cfjj-border/60 p-5 space-y-4 shadow-sm">
                        <h3 className="font-heading font-semibold text-cfjj-navy text-sm flex items-center gap-2 pb-2 border-b border-cfjj-border/40">
                            <HardDrive className="w-4 h-4 text-cfjj-text-secondary" />
                            Ingestion Process
                        </h3>

                        <div className="flex items-start gap-4">
                            <div className="w-7 h-7 rounded-full bg-cfjj-muted flex items-center justify-center text-xs font-bold text-cfjj-navy z-10 ring-4 ring-white">1</div>
                            <div className="pt-0.5">
                                <h4 className="text-sm font-semibold text-cfjj-navy">File Received</h4>
                                <p className="text-xs text-cfjj-text-secondary mt-0.5">Validated and stored securely.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-7 h-7 rounded-full bg-cfjj-muted flex items-center justify-center text-xs font-bold text-cfjj-navy z-10 ring-4 ring-white">2</div>
                            <div className="pt-0.5">
                                <h4 className="text-sm font-semibold text-cfjj-navy">Processing Data</h4>
                                <p className="text-xs text-cfjj-text-secondary mt-0.5">Extracting rows and normalizing fields.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-7 h-7 rounded-full bg-cfjj-orange/10 flex items-center justify-center text-xs font-bold text-cfjj-orange z-10 ring-4 ring-white">3</div>
                            <div className="pt-0.5">
                                <h4 className="text-sm font-semibold text-cfjj-navy">Ready to Search</h4>
                                <p className="text-xs text-cfjj-text-secondary mt-0.5">Available in the Analysis Workspace.</p>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Right Column: Data Library Table */}
                <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-cfjj-border/60 shadow-sm overflow-hidden">

                    <div className="px-6 py-5 border-b border-cfjj-border/60 flex items-center justify-between bg-cfjj-bg/50">
                        <h2 className="font-heading font-semibold text-cfjj-navy text-lg flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-cfjj-blue" />
                            Data Library
                        </h2>
                        <div className="text-xs font-medium text-cfjj-text-secondary bg-white px-3 py-1.5 rounded-md border border-cfjj-border/60">
                            {loading ? '...' : `${files.length} Files`}
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
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-cfjj-border/60 text-xs text-cfjj-text-secondary/80 font-mono tracking-wider bg-cfjj-bg/30">
                                        <th className="px-6 py-4 font-semibold">File Name</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold hidden md:table-cell">Size</th>
                                        <th className="px-6 py-4 font-semibold text-right">Added</th>
                                        <th className="px-4 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-cfjj-border/40">
                                    {files.map((file) => (
                                        <tr key={file.name} className="hover:bg-cfjj-muted/30 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded bg-cfjj-bg text-cfjj-text-secondary group-hover:text-cfjj-blue transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-cfjj-text-primary">
                                                        {file.displayName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
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
