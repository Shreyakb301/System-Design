"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Database,
    Table,
    FileJson,
    Zap,
    Lock,
    Scale,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Activity,
    Info,
    Play,
    Pause,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DbType = "sql" | "nosql";

interface Query {
    id: string;
    type: DbType;
    operation: "read" | "write" | "join" | "aggregate";
    status: "pending" | "executing" | "completed";
    latency: number;
}

const SQL_SCHEMA = [
    { name: "id", type: "INTEGER", required: true },
    { name: "name", type: "VARCHAR(255)", required: true },
    { name: "email", type: "VARCHAR(255)", required: true },
    { name: "age", type: "INTEGER", required: false },
    { name: "created_at", type: "TIMESTAMP", required: true },
];

const NOSQL_SCHEMA = [
    { name: "_id", type: "ObjectId", required: true },
    { name: "name", type: "String", required: false },
    { name: "email", type: "String", required: false },
    { name: "metadata", type: "Object {}", required: false },
    { name: "tags", type: "Array []", required: false },
];

const COMPARISON = [
    { key: "Consistency", sql: "ACID — Strong", nosql: "BASE — Eventual" },
    { key: "Scalability", sql: "Vertical (limited)", nosql: "Horizontal (unlimited)" },
    { key: "Schema", sql: "Fixed, enforced", nosql: "Flexible, dynamic" },
    { key: "Joins", sql: "Supported (complex)", nosql: "Not supported" },
    { key: "Best For", sql: "Finance, e-commerce", nosql: "Social, IoT, logs" },
];

export function SQLNoSQLVisual() {
    const [selectedType, setSelectedType] = useState<DbType>("sql");
    const [queries, setQueries] = useState<Query[]>([]);
    const [isAutoRunning, setIsAutoRunning] = useState(true);

    const generateQuery = useCallback(() => {
        if (queries.length > 12) return;
        const sqlOps = ["read", "write", "join", "aggregate"] as const;
        const nosqlOps = ["read", "write", "aggregate"] as const;
        const operation = selectedType === "sql"
            ? sqlOps[Math.floor(Math.random() * sqlOps.length)]
            : nosqlOps[Math.floor(Math.random() * nosqlOps.length)];

        const latency = selectedType === "sql"
            ? operation === "join" ? 150 : operation === "aggregate" ? 120 : 40 + Math.random() * 30
            : operation === "aggregate" ? 80 : 20 + Math.random() * 20;

        const query: Query = {
            id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            type: selectedType,
            operation,
            status: "pending",
            latency: Math.round(latency),
        };

        setQueries(prev => [...prev, query]);
        setTimeout(() => setQueries(prev => prev.map(q => q.id === query.id ? { ...q, status: "executing" } : q)), 100);
        setTimeout(() => setQueries(prev => prev.map(q => q.id === query.id ? { ...q, status: "completed" } : q)), query.latency);
        setTimeout(() => setQueries(prev => prev.filter(q => q.id !== query.id)), query.latency + 2000);
    }, [selectedType, queries.length]);

    useEffect(() => {
        if (!isAutoRunning) return;
        const interval = setInterval(generateQuery, 1500);
        return () => clearInterval(interval);
    }, [isAutoRunning, generateQuery]);

    const metrics = useMemo(() => {
        const completed = queries.filter(q => q.status === "completed");
        return {
            avgLatency: completed.length > 0 ? Math.round(completed.reduce((s, q) => s + q.latency, 0) / completed.length) : 0,
            total: completed.length,
            reads: completed.filter(q => q.operation === "read").length,
            writes: completed.filter(q => q.operation === "write").length,
            joins: completed.filter(q => q.operation === "join").length,
            aggregates: completed.filter(q => q.operation === "aggregate").length,
        };
    }, [queries]);

    const opColors: Record<string, string> = {
        read: "bg-blue-500",
        write: "bg-orange-500",
        join: "bg-purple-500",
        aggregate: "bg-indigo-500",
    };

    const schema = selectedType === "sql" ? SQL_SCHEMA : NOSQL_SCHEMA;

    return (
        <>
            <Card className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                <div className="flex flex-col gap-8">
                    {/* Canvas */}
                    <div className="w-full h-[450px] bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 relative shadow-inner bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden flex gap-4 p-4">
                        <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
                            <Database className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SQL vs NoSQL</span>
                        </div>

                        {/* Schema Column */}
                        <div className="flex flex-col gap-2 w-48 shrink-0 mt-8">
                            <div className="flex items-center gap-1.5 mb-1">
                                {selectedType === "sql" ? <Table className="w-3.5 h-3.5 text-blue-500" /> : <FileJson className="w-3.5 h-3.5 text-purple-500" />}
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Schema</span>
                                <Badge className={cn("text-[7px] px-1.5 py-0 ml-auto", selectedType === "sql" ? "bg-blue-500" : "bg-purple-500")}>
                                    {selectedType === "sql" ? "Rigid" : "Flexible"}
                                </Badge>
                            </div>
                            <div className="flex-1 space-y-1 overflow-hidden">
                                {schema.map((field, idx) => (
                                    <motion.div key={`${selectedType}-${field.name}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                    >
                                        <code className={cn("text-[9px] font-bold", selectedType === "sql" ? "text-blue-600 dark:text-blue-400" : "text-purple-600 dark:text-purple-400")}>
                                            {field.name}
                                        </code>
                                        <span className="text-[8px] text-slate-400">{field.type}</span>
                                        {field.required
                                            ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                            : <XCircle className="w-3 h-3 text-slate-300 shrink-0" />}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px bg-slate-100 dark:bg-slate-800 my-8 shrink-0" />

                        {/* Query Execution Column */}
                        <div className="flex-1 flex flex-col gap-2 mt-8 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Activity className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live Queries</span>
                                <Badge variant="outline" className="text-[8px] ml-auto">{queries.filter(q => q.type === selectedType).length}</Badge>
                            </div>
                            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[350px] pr-1">
                                <AnimatePresence>
                                    {queries.filter(q => q.type === selectedType).map(query => (
                                        <motion.div key={query.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-lg border-2 transition-all text-[10px]",
                                                query.status === "executing" ? "bg-blue-50 dark:bg-blue-950/30 border-blue-400" :
                                                    query.status === "completed" ? "bg-green-50 dark:bg-green-950/30 border-green-400" :
                                                        "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Badge className={cn("text-[8px] px-1.5 py-0 shrink-0", opColors[query.operation])}>
                                                    {query.operation.toUpperCase()}
                                                </Badge>
                                                <code className="text-slate-500 truncate">
                                                    {selectedType === "sql"
                                                        ? query.operation === "join" ? "SELECT u.*, o.* FROM users u JOIN orders o ON u.id = o.user_id"
                                                            : query.operation === "aggregate" ? "SELECT COUNT(*), AVG(age) FROM users GROUP BY city"
                                                                : "SELECT * FROM users WHERE id = ?"
                                                        : query.operation === "aggregate" ? "db.users.aggregate([{$group: {_id: '$city'}}])"
                                                            : "db.users.find({ _id: ObjectId('...') })"}
                                                </code>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span className="font-bold">{query.latency}ms</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {queries.filter(q => q.type === selectedType).length === 0 && (
                                    <div className="flex items-center justify-center h-20 text-[10px] text-slate-300 font-bold">Waiting for queries…</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        {/* Col 1: DB toggle */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Database Type</h4>
                            <div className="flex flex-col p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
                                <button onClick={() => setSelectedType("sql")}
                                    className={cn("flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold transition-all",
                                        selectedType === "sql" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500")}
                                >
                                    <Table className="w-3.5 h-3.5" /> SQL (Relational)
                                </button>
                                <button onClick={() => setSelectedType("nosql")}
                                    className={cn("flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold transition-all",
                                        selectedType === "nosql" ? "bg-white dark:bg-slate-700 shadow-sm text-purple-600" : "text-slate-500")}
                                >
                                    <FileJson className="w-3.5 h-3.5" /> NoSQL (Document)
                                </button>
                            </div>
                            <Button variant="outline" onClick={() => setIsAutoRunning(!isAutoRunning)} className="w-full h-9 gap-1.5 text-xs">
                                {isAutoRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                {isAutoRunning ? "Pause Queries" : "Resume"}
                            </Button>
                        </div>

                        {/* Col 2: Metrics */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Query Stats</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Avg Latency</span>
                                    <span className="text-xs font-bold">{metrics.avgLatency}ms</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Reads</span>
                                    <Badge className="bg-blue-500 text-white text-[8px]">{metrics.reads}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Writes</span>
                                    <Badge className="bg-orange-500 text-white text-[8px]">{metrics.writes}</Badge>
                                </div>
                                {selectedType === "sql" && (
                                    <div className="flex justify-between">
                                        <span className="text-[10px] text-slate-500">Joins</span>
                                        <Badge className="bg-purple-500 text-white text-[8px]">{metrics.joins}</Badge>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Aggregates</span>
                                    <Badge className="bg-indigo-500 text-white text-[8px]">{metrics.aggregates}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Col 3: Comparison */}
                        <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-2">
                                <Scale className="w-4 h-4" /> Side-by-side
                            </div>
                            <div className="space-y-1.5">
                                {COMPARISON.map(row => (
                                    <div key={row.key}>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">{row.key}</div>
                                        <div className="grid grid-cols-2 gap-1">
                                            <div className={cn("text-[8px] px-1.5 py-0.5 rounded font-medium", selectedType === "sql" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                                                {row.sql}
                                            </div>
                                            <div className={cn("text-[8px] px-1.5 py-0.5 rounded font-medium", selectedType === "nosql" ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                                                {row.nosql}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Explanations */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">What&apos;s happening?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Switch between SQL and NoSQL to see how their schemas and query patterns differ.
                        SQL enforces a <span className="font-semibold">rigid schema</span> with typed columns — notice how JOIN queries have higher latency.
                        NoSQL uses a <span className="font-semibold">flexible document model</span> — fields are optional, and reads are faster because there are no joins.
                        The side-by-side comparison highlights the key tradeoffs.
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-blue-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Why it matters?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        SQL excels at <span className="font-semibold">complex relationships, transactions, and data integrity</span> — critical for banking, e-commerce, and inventory systems.
                        NoSQL excels at <span className="font-semibold">horizontal scale, flexible data models, and high write throughput</span> — ideal for social feeds, analytics, and IoT.
                        Most modern systems use both: SQL for transactional data, NoSQL for high-volume reads/writes.
                    </p>
                </div>
            </div>
        </>
    );
}
