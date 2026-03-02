"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Database,
    Table,
    FileJson,
    Zap,
    Lock,
    Scale,
    TrendingUp,
    Network,
    CheckCircle2,
    XCircle,
    ArrowRight,
    BarChart3,
    Activity,
    AlertCircle,
    Info,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DatabaseType = "sql" | "nosql";

interface Query {
    id: string;
    type: DatabaseType;
    operation: "read" | "write" | "join" | "aggregate";
    status: "pending" | "executing" | "completed";
    latency: number;
    timestamp: number;
}

interface SchemaField {
    name: string;
    type: string;
    required: boolean;
}

export function SQLNoSQLVisual() {
    const [selectedType, setSelectedType] = useState<DatabaseType>("sql");
    const [queries, setQueries] = useState<Query[]>([]);
    const [isAutoRunning, setIsAutoRunning] = useState(true);

    const sqlSchema: SchemaField[] = [
        { name: "id", type: "INTEGER", required: true },
        { name: "name", type: "VARCHAR(255)", required: true },
        { name: "email", type: "VARCHAR(255)", required: true },
        { name: "age", type: "INTEGER", required: false },
        { name: "created_at", type: "TIMESTAMP", required: true },
    ];

    const nosqlSchema: SchemaField[] = [
        { name: "_id", type: "ObjectId", required: true },
        { name: "name", type: "String", required: false },
        { name: "email", type: "String", required: false },
        { name: "metadata", type: "Object", required: false },
        { name: "tags", type: "Array", required: false },
    ];

    const generateQuery = useCallback(() => {
        if (queries.length > 15) return;

        const operations: Array<"read" | "write" | "join" | "aggregate"> = 
            selectedType === "sql" 
                ? ["read", "write", "join", "aggregate"]
                : ["read", "write", "aggregate"];

        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        // Latency varies by operation and type
        let latency = 50;
        if (selectedType === "sql") {
            if (operation === "join") latency = 150;
            else if (operation === "aggregate") latency = 120;
            else latency = 40 + Math.random() * 30;
        } else {
            if (operation === "aggregate") latency = 80;
            else latency = 20 + Math.random() * 20;
        }

        const query: Query = {
            id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: selectedType,
            operation,
            status: "pending",
            latency: Math.round(latency),
            timestamp: Date.now(),
        };

        setQueries(prev => [...prev, query]);

        // Simulate execution
        setTimeout(() => {
            setQueries(prev => prev.map(q => 
                q.id === query.id ? { ...q, status: "executing" } : q
            ));
        }, 100);

        setTimeout(() => {
            setQueries(prev => prev.map(q => 
                q.id === query.id ? { ...q, status: "completed" } : q
            ));
        }, query.latency);

        setTimeout(() => {
            setQueries(prev => prev.filter(q => q.id !== query.id));
        }, query.latency + 2000);
    }, [selectedType, queries.length]);

    useEffect(() => {
        if (!isAutoRunning) return;
        const interval = setInterval(generateQuery, 2000);
        return () => clearInterval(interval);
    }, [isAutoRunning, generateQuery]);

    const metrics = useMemo(() => {
        const completed = queries.filter(q => q.status === "completed");
        const avgLatency = completed.length > 0
            ? Math.round(completed.reduce((sum, q) => sum + q.latency, 0) / completed.length)
            : 0;
        
        const operationCounts = {
            read: completed.filter(q => q.operation === "read").length,
            write: completed.filter(q => q.operation === "write").length,
            join: completed.filter(q => q.operation === "join").length,
            aggregate: completed.filter(q => q.operation === "aggregate").length,
        };

        return { avgLatency, operationCounts, total: completed.length };
    }, [queries]);

    const comparison = useMemo(() => ({
        sql: {
            consistency: "ACID - Strong",
            scalability: "Vertical (Limited)",
            schema: "Fixed Schema",
            joins: "Supported",
            useCase: "Financial, E-commerce",
        },
        nosql: {
            consistency: "BASE - Eventual",
            scalability: "Horizontal (Unlimited)",
            schema: "Flexible Schema",
            joins: "Not Supported",
            useCase: "Social Media, IoT",
        },
    }), []);

    return (
        <Card className="p-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-3xl flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                            <Database className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            SQL vs NoSQL
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 font-semibold italic">
                        Compare relational and non-relational database models
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={() => setIsAutoRunning(!isAutoRunning)}
                        variant={isAutoRunning ? "default" : "outline"}
                        size="sm"
                    >
                        {isAutoRunning ? "Pause" : "Resume"}
                    </Button>
                </div>
            </div>

            {/* Database Type Selector */}
            <div className="grid grid-cols-2 gap-4">
                <Card
                    className={cn(
                        "p-6 cursor-pointer transition-all border-2",
                        selectedType === "sql"
                            ? "bg-blue-50 dark:bg-blue-950 border-blue-500 shadow-lg"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300"
                    )}
                    onClick={() => setSelectedType("sql")}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Table className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            <h3 className="text-xl font-bold">SQL (Relational)</h3>
                        </div>
                        {selectedType === "sql" && (
                            <Badge className="bg-blue-500 text-white">Active</Badge>
                        )}
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>ACID Transactions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Structured Schema</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Complex Joins</span>
                        </div>
                    </div>
                </Card>

                <Card
                    className={cn(
                        "p-6 cursor-pointer transition-all border-2",
                        selectedType === "nosql"
                            ? "bg-purple-50 dark:bg-purple-950 border-purple-500 shadow-lg"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300"
                    )}
                    onClick={() => setSelectedType("nosql")}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <FileJson className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            <h3 className="text-xl font-bold">NoSQL (Document)</h3>
                        </div>
                        {selectedType === "nosql" && (
                            <Badge className="bg-purple-500 text-white">Active</Badge>
                        )}
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Horizontal Scaling</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Flexible Schema</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>High Performance</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Schema & Query Visualization */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Schema Display */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Table className="w-3.5 h-3.5" /> Schema Structure
                        </h4>
                        <div className="space-y-3">
                            {(selectedType === "sql" ? sqlSchema : nosqlSchema).map((field, idx) => (
                                <motion.div
                                    key={field.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <code className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {field.name}
                                        </code>
                                        <Badge variant="outline" className="text-xs">
                                            {field.type}
                                        </Badge>
                                    </div>
                                    {field.required && (
                                        <Badge className="bg-red-500 text-white text-xs">Required</Badge>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    {/* Query Execution */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[300px]">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> Query Execution
                        </h4>
                        <div className="space-y-2">
                            <AnimatePresence>
                                {queries
                                    .filter(q => q.type === selectedType)
                                    .map((query) => (
                                        <motion.div
                                            key={query.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                                                query.status === "pending" && "bg-slate-50 dark:bg-slate-800 border-slate-300",
                                                query.status === "executing" && "bg-blue-50 dark:bg-blue-950 border-blue-500",
                                                query.status === "completed" && "bg-green-50 dark:bg-green-950 border-green-500"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    className={cn(
                                                        query.operation === "read" && "bg-blue-500",
                                                        query.operation === "write" && "bg-orange-500",
                                                        query.operation === "join" && "bg-purple-500",
                                                        query.operation === "aggregate" && "bg-indigo-500"
                                                    )}
                                                >
                                                    {query.operation.toUpperCase()}
                                                </Badge>
                                                <span className="text-sm font-medium">
                                                    {selectedType === "sql" 
                                                        ? `SELECT * FROM users WHERE id = ?`
                                                        : `db.users.find({ _id: "..." })`
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-bold">{query.latency}ms</span>
                                            </div>
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                        </div>
                    </Card>
                </div>

                {/* Metrics & Comparison */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Metrics */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-3.5 h-3.5" /> Performance Metrics
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Avg Latency</span>
                                    <span className="text-2xl font-black">{metrics.avgLatency}ms</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Total Queries</span>
                                    <Badge variant="outline">{metrics.total}</Badge>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Reads</span>
                                    <Badge className="bg-blue-500">{metrics.operationCounts.read}</Badge>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Writes</span>
                                    <Badge className="bg-orange-500">{metrics.operationCounts.write}</Badge>
                                </div>
                                {selectedType === "sql" && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Joins</span>
                                        <Badge className="bg-purple-500">{metrics.operationCounts.join}</Badge>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Aggregates</span>
                                    <Badge className="bg-indigo-500">{metrics.operationCounts.aggregate}</Badge>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Comparison Table */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Scale className="w-3.5 h-3.5" /> Comparison
                        </h4>
                        <div className="space-y-3">
                            {Object.entries(comparison.sql).map(([key, sqlValue]) => (
                                <div key={key} className="space-y-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                                        {key.replace(/([A-Z])/g, " $1").trim()}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 rounded bg-blue-50 dark:bg-blue-950 text-xs font-medium">
                                            {sqlValue}
                                        </div>
                                        <div className="p-2 rounded bg-purple-50 dark:bg-purple-950 text-xs font-medium">
                                            {comparison.nosql[key as keyof typeof comparison.nosql]}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Educational Insight */}
            <div className="bg-slate-900 dark:bg-white p-8 rounded-[2.5rem] text-slate-100 dark:text-slate-900 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-4 bg-blue-500 rounded-3xl shrink-0 shadow-xl shadow-blue-500/20">
                    <Database className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2 flex-1 relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">System Design Insight</h4>
                    <div className="text-sm font-medium leading-relaxed opacity-90 tracking-tight">
                        <strong>SQL databases</strong> excel at complex queries, joins, and ACID transactions—perfect for financial systems
                        and e-commerce. <strong>NoSQL databases</strong> prioritize horizontal scalability and flexibility, ideal for
                        social media feeds and IoT data. Choose SQL for structured data with relationships; choose NoSQL for
                        high-volume, schema-less data that needs to scale across multiple servers.
                    </div>
                </div>
            </div>
        </Card>
    );
}

