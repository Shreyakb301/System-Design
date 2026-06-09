"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Inbox,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Radio,
  Send,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic { id: string; name: string; color: TopicColor; messageCount: number }
interface Message { id: string; topicId: string; content: string; timestamp: number; deliveredTo: string[] }
interface Publisher { id: string; name: string; publishedCount: number }
interface Subscriber { id: string; name: string; topicIds: string[]; receivedCount: number }

type TopicColor = "sky" | "amber" | "purple";

const TOPICS: Topic[] = [
  { id: "t1", name: "user-events", color: "sky", messageCount: 0 },
  { id: "t2", name: "notifications", color: "amber", messageCount: 0 },
  { id: "t3", name: "analytics", color: "purple", messageCount: 0 },
];

const topicNode: Record<TopicColor, string> = {
  sky: "border-sky-300 bg-sky-50",
  amber: "border-amber-300 bg-amber-50",
  purple: "border-purple-300 bg-purple-50",
};
const topicDot: Record<TopicColor, string> = { sky: "bg-sky-500", amber: "bg-amber-500", purple: "bg-purple-500" };
const topicText: Record<TopicColor, string> = { sky: "text-sky-700", amber: "text-amber-700", purple: "text-purple-700" };
const topicChipActive: Record<TopicColor, string> = {
  sky: "border-sky-500 bg-sky-500 text-white",
  amber: "border-amber-500 bg-amber-500 text-white",
  purple: "border-purple-500 bg-purple-500 text-white",
};

const pageMotion = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" as const } } };
const cardMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: "easeInOut" as const } };

function DashboardCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <motion.section {...cardMotion} className={cn("rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm", className)}>{children}</motion.section>;
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      {eyebrow && <p className="text-base font-semibold uppercase tracking-[0.16em] text-slate-600">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
      {subtitle && <p className="mt-2 max-w-[720px] text-base leading-7 text-slate-700">{subtitle}</p>}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent }: { icon: typeof Activity; label: string; value: number; accent?: string }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-base font-semibold text-slate-700"><Icon className="h-4 w-4" />{label}</div>
      <motion.span key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-3 text-2xl font-bold tabular-nums", accent ?? "text-slate-950")}>{value}</motion.span>
    </div>
  );
}

export function PubSubVisual() {
  const [topics, setTopics] = useState<Topic[]>(TOPICS);
  const [publishers, setPublishers] = useState<Publisher[]>([{ id: "p1", name: "Pub 1", publishedCount: 0 }]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([
    { id: "s1", name: "Sub 1", topicIds: ["t1"], receivedCount: 0 },
    { id: "s2", name: "Sub 2", topicIds: ["t1", "t2"], receivedCount: 0 },
  ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAutoRunning, setIsAutoRunning] = useState(true);

  const topicSubscribers = useMemo(() =>
    topics.reduce<Record<string, string[]>>((acc, t) => {
      acc[t.id] = subscribers.filter((s) => s.topicIds.includes(t.id)).map((s) => s.id);
      return acc;
    }, {}),
    [topics, subscribers],
  );

  const publishMessage = useCallback((publisherId: string, topicId: string) => {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const content = `Evt-${Math.random().toString(36).substr(2, 4)}`;
    const subscriberIds = topicSubscribers[topicId] ?? [];

    setMessages((prev) => [...prev, { id: messageId, topicId, content, timestamp: Date.now(), deliveredTo: [] }]);
    setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, messageCount: t.messageCount + 1 } : t)));
    setPublishers((prev) => prev.map((p) => (p.id === publisherId ? { ...p, publishedCount: p.publishedCount + 1 } : p)));

    subscriberIds.forEach((sId, idx) => {
      setTimeout(() => {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, deliveredTo: [...m.deliveredTo, sId] } : m)));
        setSubscribers((prev) => prev.map((s) => (s.id === sId ? { ...s, receivedCount: s.receivedCount + 1 } : s)));
      }, idx * 150);
    });

    setTimeout(() => setMessages((prev) => prev.filter((m) => m.id !== messageId)), 4000);
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
    setSubscribers((prev) => prev.map((s) => {
      if (s.id !== subscriberId) return s;
      return { ...s, topicIds: s.topicIds.includes(topicId) ? s.topicIds.filter((id) => id !== topicId) : [...s.topicIds, topicId] };
    }));
  };

  const metrics = useMemo(() => ({
    totalPublished: publishers.reduce((sum, p) => sum + p.publishedCount, 0),
    totalReceived: subscribers.reduce((sum, s) => sum + s.receivedCount, 0),
    activeMessages: messages.length,
    totalSubscriptions: subscribers.reduce((sum, s) => sum + s.topicIds.length, 0),
  }), [publishers, subscribers, messages]);

  return (
    <motion.div {...pageMotion} className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1240px] space-y-6">
        {/* Concept snapshot */}
        <DashboardCard>
          <SectionHeader eyebrow="Concept snapshot" title="One publish, many subscribers" subtitle="Publishers broadcast events to topics; every subscriber on a topic gets its own copy. Loose coupling — publishers never know who is listening." />
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <NodeBadge icon={Send} label="Publisher" styleKey="border-sky-300 bg-sky-50 text-sky-700" />
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-300" />
            <NodeBadge icon={MessageSquare} label="Topic" styleKey="border-amber-300 bg-amber-50 text-amber-700" />
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-300" />
            <div className="flex items-center gap-2">
              <NodeBadge icon={Users} label="Subscriber" styleKey="border-indigo-300 bg-indigo-50 text-indigo-700" compact />
              <NodeBadge icon={Users} label="Subscriber" styleKey="border-indigo-300 bg-indigo-50 text-indigo-700" compact />
              <NodeBadge icon={Users} label="Subscriber" styleKey="border-indigo-300 bg-indigo-50 text-indigo-700" compact />
            </div>
          </div>
        </DashboardCard>

        {/* Live canvas */}
        <DashboardCard className="min-h-[380px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Live fan-out</h2>
              <p className="text-base text-slate-700">Each message delivered to every subscriber of its topic.</p>
            </div>
            <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-base font-semibold text-slate-700">
              <Radio className="h-4 w-4 text-purple-600" /> Pub/Sub
            </span>
          </div>

          <div
            className="grid gap-4 rounded-[1.25rem] border border-slate-200 bg-amber-50/40 p-5 md:grid-cols-3"
            style={{ backgroundImage: "radial-gradient(circle, rgba(120,113,108,0.16) 1px, transparent 1px)", backgroundSize: "18px 18px" }}
          >
            {/* Publishers */}
            <div className="space-y-2">
              <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-600">Publishers</p>
              {publishers.map((pub) => (
                <div key={pub.id} className="flex items-center gap-3 rounded-2xl border-2 border-sky-300 bg-sky-50 px-3 py-2.5">
                  <Send className="h-5 w-5 text-sky-600" />
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-950">{pub.name}</p>
                    <p className="text-base text-slate-600">sent {pub.publishedCount}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-600">Topics</p>
              {topics.map((topic) => {
                const active = messages.filter((m) => m.topicId === topic.id);
                const subCount = (topicSubscribers[topic.id] ?? []).length;
                return (
                  <motion.div
                    key={topic.id}
                    animate={{ scale: active.length > 0 ? [1, 1.015, 1] : 1 }}
                    transition={{ duration: 0.4, repeat: active.length > 0 ? Infinity : 0 }}
                    className={cn("flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 transition", active.length > 0 ? topicNode[topic.color] : "border-slate-200 bg-white")}
                  >
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", topicDot[topic.color])}>
                      <MessageSquare className="h-4 w-4 text-white" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-base font-bold", topicText[topic.color])}>{topic.name}</p>
                      <p className="text-base text-slate-600">{subCount} subscribers · {topic.messageCount} total</p>
                    </div>
                    <AnimatePresence>
                      {active.slice(0, 1).map((m) => (
                        <motion.span key={m.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-base text-slate-600">{m.content}</motion.span>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Subscribers */}
            <div className="space-y-2">
              <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-600">Subscribers</p>
              {subscribers.map((sub) => {
                const isActive = messages.some((m) => m.deliveredTo.includes(sub.id));
                return (
                  <motion.div
                    key={sub.id}
                    animate={{ scale: isActive ? [1, 1.02, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn("rounded-2xl border-2 px-3 py-2.5 transition", isActive ? "border-emerald-300 bg-emerald-50" : "border-indigo-300 bg-indigo-50")}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className={cn("h-5 w-5", isActive ? "text-emerald-600" : "text-indigo-600")} />
                        <p className="text-base font-bold text-slate-950">{sub.name}</p>
                      </div>
                      <span className="text-base text-slate-600">rcvd {sub.receivedCount}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {topics.map((t) => {
                        const subscribed = sub.topicIds.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            onClick={() => toggleSubscription(sub.id, t.id)}
                            className={cn("rounded-full border px-2.5 py-1 text-base font-semibold transition", subscribed ? topicChipActive[t.color] : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </DashboardCard>

        {/* Metrics */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Send} label="Published" value={metrics.totalPublished} />
          <MetricCard icon={CheckCircle2} label="Delivered" value={metrics.totalReceived} accent="text-emerald-600" />
          <MetricCard icon={Activity} label="Active messages" value={metrics.activeMessages} accent="text-purple-600" />
          <MetricCard icon={Inbox} label="Subscriptions" value={metrics.totalSubscriptions} />
        </div>

        {/* Controls */}
        <DashboardCard>
          <SectionHeader eyebrow="Controls" title="Drive the simulation" subtitle="Subscribe or unsubscribe each subscriber to topics above, then publish and watch the fan-out." />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-600">Auto-publish</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setIsAutoRunning((v) => !v)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-base font-semibold text-white">
                  {isAutoRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isAutoRunning ? "Pause" : "Resume"}
                </button>
                <button onClick={() => publishers.length < 3 && setPublishers((prev) => [...prev, { id: `p${prev.length + 1}`, name: `Pub ${prev.length + 1}`, publishedCount: 0 }])} disabled={publishers.length >= 3} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-40">
                  <Plus className="h-4 w-4" /> Publisher
                </button>
                <button onClick={() => subscribers.length < 4 && setSubscribers((prev) => [...prev, { id: `s${prev.length + 1}`, name: `Sub ${prev.length + 1}`, topicIds: [], receivedCount: 0 }])} disabled={subscribers.length >= 4} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-40">
                  <Plus className="h-4 w-4" /> Subscriber
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-600">Manual publish</p>
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <button key={t.id} onClick={() => publishMessage(publishers[0]?.id ?? "p1", t.id)} className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 py-2 text-base font-semibold transition hover:opacity-90", topicNode[t.color], topicText[t.color])}>
                    <Send className="h-4 w-4" /> {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Insight */}
        <DashboardCard>
          <SectionHeader eyebrow="Why it matters" title="One-to-many, loosely coupled" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-600">What&apos;s happening</p>
              <p className="mt-2 text-base leading-7 text-slate-700">Publishers send events to a topic. Every subscriber on that topic receives its own copy — delivery fans out to all of them at once.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-base font-bold uppercase tracking-[0.12em] text-slate-600">Why it matters</p>
              <p className="mt-2 text-base leading-7 text-slate-700">Unlike a queue (one consumer per message), Pub/Sub broadcasts to many. Publishers stay decoupled from subscribers — the model behind Kafka topics, Google Pub/Sub, and real-time notifications.</p>
            </div>
          </div>
        </DashboardCard>
      </div>
    </motion.div>
  );
}

function NodeBadge({ icon: Icon, label, styleKey, compact }: { icon: typeof Send; label: string; styleKey: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl border-2 text-center shadow-sm", styleKey, compact ? "px-2 py-1.5" : "px-3 py-2.5")}>
      <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
      <span className={cn("mt-1 font-bold text-slate-950", compact ? "text-base" : "text-base")}>{label}</span>
    </div>
  );
}
