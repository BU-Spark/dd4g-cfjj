import { useState } from 'react';
import {
    UploadCloud, FileSpreadsheet, CheckCircle2,
    Clock, AlertCircle, RefreshCw, MoreVertical,
    HardDrive, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function KnowledgeBase() {
    const [isDragging, setIsDragging] = useState(false);

    // Mock data for the table
    const files = [
        {
            id: 1,
            name: "2024_Q3_Complaints_Final.csv",
            date: "Oct 12, 2024",
            status: "Ready",
            records: "4,201",
            type: "Narratives",
        },
        {
            id: 2,
            name: "BPD_Intake_Logs_Recent.csv",
            date: "Oct 10, 2024",
            status: "Processing",
            records: "1,150",
            type: "Structured",
        },
        {
            id: 3,
            name: "Historical_Data_2023.csv",
            date: "Oct 01, 2024",
            status: "Ready",
            records: "12,400",
            type: "Mixed",
        },
        {
            id: 4,
            name: "Incomplete_Export.csv",
            date: "Sep 28, 2024",
            status: "Needs Review",
            records: "0",
            type: "Unknown",
        }
    ];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Ready': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
            case 'Processing': return <RefreshCw className="w-4 h-4 text-cfjj-blue animate-spin" />;
            case 'Needs Review': return <AlertCircle className="w-4 h-4 text-amber-500" />;
            case 'Failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-cfjj-text-secondary" />;
        }
    };

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

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-7 h-7 rounded-full bg-cfjj-muted flex items-center justify-center text-xs font-bold text-cfjj-navy ring-4 ring-white">1</div>
                                <div>
                                    <h4 className="text-sm font-semibold text-cfjj-navy">File Received</h4>
                                    <p className="text-xs text-cfjj-text-secondary">Validated and stored securely.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-7 h-7 rounded-full bg-cfjj-muted flex items-center justify-center text-xs font-bold text-cfjj-navy ring-4 ring-white">2</div>
                                <div>
                                    <h4 className="text-sm font-semibold text-cfjj-navy">Processing Data</h4>
                                    <p className="text-xs text-cfjj-text-secondary">Extracting rows and normalizing fields.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-7 h-7 rounded-full bg-cfjj-orange/10 flex items-center justify-center text-xs font-bold text-cfjj-orange ring-4 ring-white">3</div>
                                <div>
                                    <h4 className="text-sm font-semibold text-cfjj-navy">Ready to Search</h4>
                                    <p className="text-xs text-cfjj-text-secondary">Available in the Analysis Workspace.</p>
                                </div>
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
                            4 Files Uploaded
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-cfjj-border/60 text-xs text-cfjj-text-secondary/80 font-mono tracking-wider bg-cfjj-bg/30">
                                    <th className="px-6 py-4 font-semibold">File Name</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Records</th>
                                    <th className="px-6 py-4 font-semibold hidden md:table-cell">Type</th>
                                    <th className="px-6 py-4 font-semibold text-right">Added</th>
                                    <th className="px-4 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cfjj-border/40">
                                {files.map((file) => (
                                    <tr key={file.id} className="hover:bg-cfjj-muted/30 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded bg-cfjj-bg text-cfjj-text-secondary group-hover:text-cfjj-blue transition-colors">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-cfjj-text-primary">
                                                    {file.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(file.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-mono text-cfjj-text-secondary">
                                                {file.records}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-sm text-cfjj-text-secondary">
                                                {file.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm text-cfjj-text-secondary">
                                                {file.date}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button className="p-1.5 text-cfjj-border group-hover:text-cfjj-text-primary rounded-md hover:bg-cfjj-muted transition-colors opacity-0 group-hover:opacity-100">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-cfjj-border/60 bg-cfjj-bg/30 text-center text-xs text-cfjj-text-secondary/80 font-medium">
                        Files are automatically processed upon upload. Review logs for 'Needs Review' items.
                    </div>

                </div>

            </div>
        </div>
    );
}