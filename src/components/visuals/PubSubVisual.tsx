"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Radio,
    Send,
    Users,
    MessageSquare,
    Zap,
    CheckCircle2,
    AlertCircle,
    Play,
    Pause,
    Info,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic {
    id: string;
    name: string;
    color: string;
    messageCount: number;
}

interface Message {
    id: string;
    topicId: string;
    content: string;
    timestamp: number;
    deliveredTo: string[];
}

interface Publisher {
    id: string;
    name: string;
    publishedCount: number;
}

interface Subscriber {
    id: string;
    name: string;
    topicIds: string[];
    receivedCount: number;
}

const TOPICS: Topic[] = [
    { id: "t1", name: "user-events", color: "blue", messageCount: 0 },
    { id: "t2", name: "notifications", color: "purple", messageCount: 0 },
    { id: "t3", name: "analytics", color: "green", messageCount: 0 },
];

const topicColorMap: Record<string, string> = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
};
const topicLightMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700",
    purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700",
    green: "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700",
};
const topicTextMap: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    green: "text-green-600 dark:text-green-400",
};

export function PubSubVisual() {
    const [topics, setTopics] = useState<Topic[]>(TOPICS);
    const [publishers, setPublishers] = useState<Publisher[]>([
        { id: "p1", name: "Pub 1", publishedCount: 0 },
    ]);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([
        { id: "s1", name: "Sub 1", topicIds: ["t1"], receivedCount: 0 },
        { id: "s2", name: "Sub 2", topicIds: ["t1", "t2"], receivedCount: 0 },
    ]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isAutoRunning, setIsAutoRunning] = useState(true);

    const topicSubscribers = useMemo(() =>
        topics.reduce<Record<string, string[]>>((acc, t) => {
            acc[t.id] = subscribers.filter(s => s.topicIds.includes(t.id)).map(s => s.id);
            return acc;
        }, {}),
        [topics, subscribers]
    );

    const publishMessage = useCallback((publisherId: string, topicId: string) => {
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const content = `Evt-${Math.random().toString(36).substr(2, 4)}`;
        const subscriberIds = topicSubscribers[topicId] ?? [];

        setMessages(prev => [...prev, { id: messageId, topicId, content, timestamp: Date.now(), deliveredTo: [] }]);
        setTopics(prev => prev.map(t => t.id === topicId ? { ...t, messageCount: t.messageCount + 1 } : t));
        setPublishers(prev => prev.map(p => p.id === publisherId ? { ...p, publishedCount: p.publishedCount + 1 } : p));

        subscriberIds.forEach((sId, idx) => {
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deliveredTo: [...m.deliveredTo, sId] } : m));
                setSubscribers(prev => prev.map(s => s.id === sId ? { ...s, receivedCount: s.receivedCount + 1 } : s));
            }, idx * 150);
        });

        setTimeout(() => setMessages(prev => prev.filter(m => m.id !== messageId)), 4000);
    }, [topicSubscribers]);

    useEffect(() => {
        if (!isAutoRunning || publishers.length === 0) return;
        const interval = setInterval(() => {
            const pub = publishers[Math.floor(Math.random() * publishers.length)];
            const topic = topics[Math.floor(Math.random() * topics.length)];
            if (pub && topic) publishMessage(pub.id, topic.id);
        }, 1800);
        return () => clearInterval(interval);
    }, [isAutoRunning, publishers, topics, publishMessage]);

    const toggleSubscription = (subscriberId: string, topicId: string) => {
        setSubscribers(prev => prev.map(s => {
            if (s.id !== subscriberId) return s;
            return { ...s, topicIds: s.topicIds.includes(topicId) ? s.topicIds.filter(id => id !== topicId) : [...s.topicIds, topicId] };
        }));
    };

    const metrics = useMemo(() => ({
        totalPublished: publishers.reduce((sum, p) => sum + p.publishedCount, 0),
        totalReceived: subscribers.reduce((sum, s) => sum + s.receivedCount, 0),
        activeMessages: messages.length,
        totalSubscriptions: subscribers.reduce((sum, s) => sum + s.topicIds.length, 0),
    }), [publishers, subscribers, messages]);

    return (
        <>
            <Card className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-violet-500" />

                <div className="flex flex-col gap-8">
                    {/* Canvas */}
                    <div className="w-full h-[450px] bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 relative shadow-inner bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden flex gap-3 p-4">
                        <div className="absolute top-3 left-4 flex items-center gap-2 z-10">
                            <Radio className="w-4 h-4 text-purple-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pub/Sub Simulation</span>
                        </div>

                        {/* Publishers */}
                        <div className="flex flex-col gap-2 shrink-0 w-24 mt-8">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-center mb-1">Publishers</span>
                            {publishers.map(pub => (
                                <div key={pub.id} className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 text-center">
                                    <Send className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                                    <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 block">{pub.name}</span>
                                    <span className="text-[8px] text-slate-400">sent: {pub.publishedCount}</span>
                                </div>
                            ))}
                        </div>

                        {/* Flow lines + Topics */}
                        <div className="flex-1 flex flex-col gap-2 mt-8 min-w-0">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-center mb-1">Topics</span>
                            <div className="flex flex-col gap-3 flex-1">
                                {topics.map(topic => {
                                    const activeMsgs = messages.filter(m => m.topicId === topic.id);
                                    const subCount = (topicSubscribers[topic.id] ?? []).length;
                                    return (
                                        <motion.div key={topic.id}
                                            animate={{ scale: activeMsgs.length > 0 ? [1, 1.02, 1] : 1 }}
                                            transition={{ duration: 0.4, repeat: activeMsgs.length > 0 ? Infinity : 0 }}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                                                activeMsgs.length > 0 ? topicLightMap[topic.color] : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                            )}
                                        >
                                            <div className={cn("p-1.5 rounded-lg", topicColorMap[topic.color])}>
                                                <MessageSquare className="w-3.5 h-3.5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[9px] font-black text-slate-600 dark:text-slate-300 truncate">{topic.name}</div>
                                                <div className="text-[8px] text-slate-400">{subCount} sub · {topic.messageCount} total</div>
                                            </div>
                                            {activeMsgs.length > 0 && (
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                                    <Zap className={cn("w-3.5 h-3.5", topicTextMap[topic.color])} />
                                                </motion.div>
                                            )}
                                            {activeMsgs.slice(0, 2).map(m => (
                                                <motion.div key={m.id}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="text-[8px] font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border text-slate-500 shrink-0"
                                                >
                                                    {m.content}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Subscribers */}
                        <div className="flex flex-col gap-2 shrink-0 w-32 mt-8">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-center mb-1">Subscribers</span>
                            {subscribers.map(sub => {
                                const isActive = messages.some(m => m.deliveredTo.includes(sub.id));
                                return (
                                    <motion.div key={sub.id}
                                        animate={{ scale: isActive ? [1, 1.03, 1] : 1 }}
                                        transition={{ duration: 0.3 }}
                                        className={cn(
                                            "p-2 rounded-xl border-2 transition-all",
                                            isActive ? "bg-green-50 dark:bg-green-950/30 border-green-400" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3 text-green-500" />
                                                <span className="text-[9px] font-black text-slate-600 dark:text-slate-300">{sub.name}</span>
                                            </div>
                                            {isActive && <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                        </div>
                                        <div className="text-[8px] text-slate-400 mb-1.5">rcvd: {sub.receivedCount}</div>
                                        <div className="flex flex-wrap gap-1">
                                            {topics.map(t => {
                                                const subscribed = sub.topicIds.includes(t.id);
                                                return (
                                                    <button key={t.id} onClick={() => toggleSubscription(sub.id, t.id)}
                                                        className={cn("text-[7px] px-1.5 py-0.5 rounded font-bold transition-all",
                                                            subscribed ? topicColorMap[t.color] + " text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500")}
                                                    >
                                                        {t.id}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        {/* Col 1: Controls */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Controls</h4>
                            <Button
                                onClick={() => setIsAutoRunning(!isAutoRunning)}
                                className={cn("w-full gap-2 h-10 text-xs", isAutoRunning ? "bg-purple-600 hover:bg-purple-700 text-white" : "")}
                                variant={isAutoRunning ? "default" : "outline"}
                            >
                                {isAutoRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                {isAutoRunning ? "Pause Auto-Publish" : "Resume Auto-Publish"}
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" onClick={() => publishers.length < 3 && setPublishers(prev => [...prev, { id: `p${prev.length + 1}`, name: `Pub ${prev.length + 1}`, publishedCount: 0 }])}
                                    disabled={publishers.length >= 3} className="h-9 gap-1 text-xs">
                                    <Plus className="w-3 h-3" /> Publisher
                                </Button>
                                <Button variant="outline" onClick={() => subscribers.length < 4 && setSubscribers(prev => [...prev, { id: `s${prev.length + 1}`, name: `Sub ${prev.length + 1}`, topicIds: [], receivedCount: 0 }])}
                                    disabled={subscribers.length >= 4} className="h-9 gap-1 text-xs">
                                    <Plus className="w-3 h-3" /> Subscriber
                                </Button>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                Click topic buttons (t1/t2/t3) on each subscriber to toggle subscriptions.
                            </p>
                        </div>

                        {/* Col 2: Manual Publish */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Manual Publish</h4>
                            <div className="flex flex-col gap-2">
                                {topics.map(t => (
                                    <button key={t.id} onClick={() => publishMessage("p1", t.id)}
                                        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-white", topicColorMap[t.color], "hover:opacity-90")}
                                    >
                                        <Send className="w-3 h-3" /> Publish to {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Col 3: Metrics */}
                        <div className="space-y-3 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-2">
                                <Zap className="w-4 h-4" /> Live Stats
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Published</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.totalPublished}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500">Delivered</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.totalReceived}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Active Msgs</span>
                                    <span className="text-xs font-bold tabular-nums text-purple-600">{metrics.activeMessages}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-orange-500" /> Subscriptions</span>
                                    <span className="text-xs font-bold tabular-nums">{metrics.totalSubscriptions}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Explanations */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-purple-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">What&apos;s happening?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Publishers broadcast events to topics (channels). Every subscriber that has subscribed to a topic automatically receives a copy of each message.
                        Toggle the colored topic buttons on each subscriber to subscribe or unsubscribe in real time.
                        Use <span className="font-semibold">Manual Publish</span> to push messages to specific topics and watch delivery fan out.
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Radio className="w-4 h-4 text-purple-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Why it matters?</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Pub/Sub enables <span className="font-semibold">one-to-many</span> messaging with loose coupling — publishers don&apos;t know who&apos;s listening.
                        Unlike queues (one consumer per message), every subscriber gets their own copy.
                        This is how systems like Google Pub/Sub, Kafka topics, and WebSocket rooms broadcast notifications, analytics events, and real-time updates to thousands of clients.
                    </p>
                </div>
            </div>
        </>
    );
}
