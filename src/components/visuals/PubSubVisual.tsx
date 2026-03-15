"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Radio,
    Send,
    Users,
    MessageSquare,
    Activity,
    BarChart3,
    Zap,
    CheckCircle2,
    AlertCircle,
    Clock,
    Network,
    Layers,
    Play,
    Pause,
    Plus,
    Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic {
    id: string;
    name: string;
    subscribers: string[];
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
    topicId?: string;
    publishedCount: number;
}

interface Subscriber {
    id: string;
    name: string;
    topicIds: string[];
    receivedCount: number;
}

export function PubSubVisual() {
    const [topics, setTopics] = useState<Topic[]>([
        { id: "t1", name: "user-events", subscribers: [], messageCount: 0 },
        { id: "t2", name: "notifications", subscribers: [], messageCount: 0 },
        { id: "t3", name: "analytics", subscribers: [], messageCount: 0 },
    ]);
    const [publishers, setPublishers] = useState<Publisher[]>([
        { id: "p1", name: "Publisher 1", publishedCount: 0 },
    ]);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([
        { id: "s1", name: "Subscriber 1", topicIds: ["t1"], receivedCount: 0 },
        { id: "s2", name: "Subscriber 2", topicIds: ["t1", "t2"], receivedCount: 0 },
    ]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isAutoRunning, setIsAutoRunning] = useState(true);

    // Initialize subscribers for topics
    useEffect(() => {
        setTopics(prev => prev.map(topic => ({
            ...topic,
            subscribers: subscribers
                .filter(s => s.topicIds.includes(topic.id))
                .map(s => s.id),
        })));
    }, [subscribers]);

    const publishMessage = useCallback((publisherId: string, topicId: string) => {
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const content = `Event-${Math.random().toString(36).substr(2, 5)}`;
        
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;

        const message: Message = {
            id: messageId,
            topicId,
            content,
            timestamp: Date.now(),
            deliveredTo: [],
        };

        setMessages(prev => [...prev, message]);
        setTopics(prev => prev.map(t => 
            t.id === topicId ? { ...t, messageCount: t.messageCount + 1 } : t
        ));
        setPublishers(prev => prev.map(p => 
            p.id === publisherId ? { ...p, publishedCount: p.publishedCount + 1 } : p
        ));

        // Deliver to all subscribers
        topic.subscribers.forEach((subscriberId, idx) => {
            setTimeout(() => {
                setMessages(prev => prev.map(m => 
                    m.id === messageId 
                        ? { ...m, deliveredTo: [...m.deliveredTo, subscriberId] }
                        : m
                ));
                setSubscribers(prev => prev.map(s => 
                    s.id === subscriberId 
                        ? { ...s, receivedCount: s.receivedCount + 1 }
                        : s
                ));
            }, idx * 100);
        });

        // Clean up message
        setTimeout(() => {
            setMessages(prev => prev.filter(m => m.id !== messageId));
        }, 5000);
    }, [topics]);

    // Auto-publish messages
    useEffect(() => {
        if (!isAutoRunning || publishers.length === 0) return;
        const interval = setInterval(() => {
            const publisher = publishers[Math.floor(Math.random() * publishers.length)];
            const topic = topics[Math.floor(Math.random() * topics.length)];
            if (publisher && topic) {
                publishMessage(publisher.id, topic.id);
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [isAutoRunning, publishers, topics, publishMessage]);

    const addPublisher = () => {
        const newId = `p${publishers.length + 1}`;
        setPublishers(prev => [...prev, {
            id: newId,
            name: `Publisher ${publishers.length + 1}`,
            publishedCount: 0,
        }]);
    };

    const addSubscriber = () => {
        const newId = `s${subscribers.length + 1}`;
        setSubscribers(prev => [...prev, {
            id: newId,
            name: `Subscriber ${subscribers.length + 1}`,
            topicIds: [],
            receivedCount: 0,
        }]);
    };

    const toggleSubscription = (subscriberId: string, topicId: string) => {
        setSubscribers(prev => prev.map(s => {
            if (s.id !== subscriberId) return s;
            const hasTopic = s.topicIds.includes(topicId);
            return {
                ...s,
                topicIds: hasTopic
                    ? s.topicIds.filter(id => id !== topicId)
                    : [...s.topicIds, topicId],
            };
        }));
    };

    const metrics = useMemo(() => {
        const totalPublished = publishers.reduce((sum, p) => sum + p.publishedCount, 0);
        const totalReceived = subscribers.reduce((sum, s) => sum + s.receivedCount, 0);
        const activeMessages = messages.length;
        const totalSubscriptions = subscribers.reduce((sum, s) => sum + s.topicIds.length, 0);
        return { totalPublished, totalReceived, activeMessages, totalSubscriptions };
    }, [publishers, subscribers, messages]);

    return (
        <Card className="p-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-3xl flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-xl shadow-lg shadow-purple-500/20">
                            <Radio className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 font-semibold italic">
                        Understand event-driven messaging with topics and subscribers
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={() => setIsAutoRunning(!isAutoRunning)}
                        variant={isAutoRunning ? "default" : "outline"}
                        size="sm"
                    >
                        {isAutoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isAutoRunning ? "Pause" : "Resume"}
                    </Button>
                </div>
            </div>

            {/* Main Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Pub-Sub Flow */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Publishers */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Send className="w-3.5 h-3.5" /> Publishers
                            </h4>
                            <Button
                                onClick={addPublisher}
                                size="sm"
                                variant="outline"
                                disabled={publishers.length >= 5}
                            >
                                <Plus className="w-4 h-4" /> Add
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {publishers.map((publisher) => (
                                <motion.div
                                    key={publisher.id}
                                    className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border-2 border-blue-500"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <span className="font-bold text-sm">{publisher.name}</span>
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                        Published: <span className="font-bold">{publisher.publishedCount}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    {/* Topics */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5" /> Topics
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            {topics.map((topic) => {
                                const activeMessages = messages.filter(m => m.topicId === topic.id);
                                return (
                                    <motion.div
                                        key={topic.id}
                                        className={cn(
                                            "p-4 rounded-lg border-2 transition-all relative",
                                            activeMessages.length > 0
                                                ? "bg-purple-50 dark:bg-purple-950 border-purple-500 ring-4 ring-purple-400"
                                                : "bg-slate-50 dark:bg-slate-800 border-slate-300"
                                        )}
                                        animate={{
                                            scale: activeMessages.length > 0 ? [1, 1.05, 1] : 1,
                                        }}
                                        transition={{ duration: 0.5, repeat: activeMessages.length > 0 ? Infinity : 0 }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Radio className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                <span className="font-bold text-sm">{topic.name}</span>
                                            </div>
                                            {activeMessages.length > 0 && (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <Zap className="w-4 h-4 text-purple-500" />
                                                </motion.div>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                            <div>
                                                Subscribers: <span className="font-bold">{topic.subscribers.length}</span>
                                            </div>
                                            <div>
                                                Messages: <span className="font-bold">{topic.messageCount}</span>
                                            </div>
                                        </div>
                                        {activeMessages.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {activeMessages.slice(0, 2).map(msg => (
                                                    <div key={msg.id} className="text-xs font-mono bg-white dark:bg-slate-900 p-1 rounded">
                                                        {msg.content}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Subscribers */}
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> Subscribers
                            </h4>
                            <Button
                                onClick={addSubscriber}
                                size="sm"
                                variant="outline"
                                disabled={subscribers.length >= 5}
                            >
                                <Plus className="w-4 h-4" /> Add
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {subscribers.map((subscriber) => (
                                <motion.div
                                    key={subscriber.id}
                                    className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border-2 border-green-500"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="font-bold">{subscriber.name}</span>
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            Received: <span className="font-bold">{subscriber.receivedCount}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {topics.map(topic => {
                                            const isSubscribed = subscriber.topicIds.includes(topic.id);
                                            return (
                                                <button
                                                    key={topic.id}
                                                    onClick={() => toggleSubscription(subscriber.id, topic.id)}
                                                    className={cn(
                                                        "px-3 py-1 rounded text-xs font-bold transition-all",
                                                        isSubscribed
                                                            ? "bg-purple-500 text-white"
                                                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                                    )}
                                                >
                                                    {topic.name}
                                                    {isSubscribed && <CheckCircle2 className="w-3 h-3 inline ml-1" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    {/* Message Flow Animation */}
                    <div className="relative h-32">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 30">
                            <defs>
                                <marker
                                    id="pubsub-arrow"
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="9"
                                    refY="3"
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                                </marker>
                            </defs>
                            <AnimatePresence>
                                {messages.map((message) => {
                                    const topic = topics.find(t => t.id === message.topicId);
                                    if (!topic) return null;
                                    
                                    return (
                                        <g key={message.id}>
                                            {/* Publisher to Topic */}
                                            <motion.line
                                                x1="10"
                                                y1="15"
                                                x2="50"
                                                y2="15"
                                                stroke="rgb(59, 130, 246)"
                                                strokeWidth="0.3"
                                                markerEnd="url(#pubsub-arrow)"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 0.6 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.5 }}
                                            />
                                            {/* Topic to Subscribers */}
                                            {topic.subscribers.map((subId, idx) => (
                                                <motion.line
                                                    key={subId}
                                                    x1="50"
                                                    y1="15"
                                                    x2="90"
                                                    y2={10 + idx * 5}
                                                    stroke="rgb(168, 85, 247)"
                                                    strokeWidth="0.2"
                                                    strokeDasharray="0.3 0.3"
                                                    markerEnd="url(#pubsub-arrow)"
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 0.4 }}
                                                    transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                                                />
                                            ))}
                                        </g>
                                    );
                                })}
                            </AnimatePresence>
                        </svg>
                    </div>
                </div>

                {/* Metrics */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-3.5 h-3.5" /> Metrics
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Total Published</span>
                                    <span className="text-2xl font-black">{metrics.totalPublished}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Total Received</span>
                                    <span className="text-2xl font-black">{metrics.totalReceived}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Active Messages</span>
                                    <Badge className="bg-purple-500">{metrics.activeMessages}</Badge>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-400">Subscriptions</span>
                                    <Badge variant="outline">{metrics.totalSubscriptions}</Badge>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" /> Pub-Sub Properties
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>One-to-many messaging</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Decoupled publishers & subscribers</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Topic-based routing</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                <span>No message ordering guarantee</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Educational Insight */}
            <div className="bg-slate-900 dark:bg-white p-8 rounded-[2.5rem] text-slate-100 dark:text-slate-900 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-4 bg-purple-500 rounded-3xl shrink-0 shadow-xl shadow-purple-500/20">
                    <Radio className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2 flex-1 relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">System Design Insight</h4>
                    <div className="text-sm font-medium leading-relaxed opacity-90 tracking-tight">
                        <strong>Pub-Sub</strong> enables event-driven architectures where publishers broadcast messages to topics,
                        and all subscribers to that topic receive the message. This pattern provides <strong>loose coupling</strong>,
                        allowing publishers and subscribers to evolve independently. Unlike queues, messages are delivered to
                        <strong>all subscribers</strong>, making it ideal for notifications, event sourcing, and real-time
                        updates. Use pub-sub when you need one-to-many message distribution.
                    </div>
                </div>
            </div>
        </Card>
    );
}
