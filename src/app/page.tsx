import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Code2, Sparkles, Trophy, Zap, Layers } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center items-center text-center px-4 py-32 space-y-10 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-24 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

        <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide uppercase mb-4 border border-primary/20">
            <Sparkles className="h-4 w-4" />
            Learn by Doing, Not Reading
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Master Engineering through <br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Interactive Simulations</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop memorizing. Start building. Put your knowledge to the test with our gamified
            architect challenges and algorithm puzzles.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150">
          <Link href="/system-design/challenge">
            <Button size="lg" className="gap-2 h-14 px-8 text-lg font-bold shadow-lg shadow-primary/20">
              Start Training <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/#challenges">
            <Button size="lg" variant="outline" className="gap-2 h-14 px-8 text-lg font-semibold">
              View Challenges
            </Button>
          </Link>
        </div>
      </section>

      {/* Interactive Challenges Section */}
      <section id="challenges" className="container max-w-6xl mx-auto py-24 px-4 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Gamified Learning Tracks</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Interactive scenarios designed to help you think like a senior engineer.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Link href="/system-design/challenge" className="group">
            <Card className="p-8 h-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-none shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-violet-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-48 h-48 -mr-12 -mt-12 rotate-12" />
              </div>
              <div className="relative z-10 flex flex-col h-full space-y-6">
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Trophy className="w-8 h-8 text-yellow-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold italic tracking-tight">System Architect</h3>
                  <p className="text-lg text-white/80">
                    Design and scale a startup from scratch. Manage budget, latency, and reliability
                    to handle millions of users.
                  </p>
                </div>
                <div className="mt-auto inline-flex items-center gap-2 font-bold bg-white text-indigo-700 px-6 py-3 rounded-xl self-start group-hover:bg-yellow-300 group-hover:text-indigo-900 transition-colors">
                  Play Level 1 <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/data-structures/challenge" className="group">
            <Card className="p-8 h-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-none shadow-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-48 h-48 -mr-12 -mt-12 -rotate-12" />
              </div>
              <div className="relative z-10 flex flex-col h-full space-y-6">
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Zap className="w-8 h-8 text-yellow-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold italic tracking-tight">Algorithm Arena</h3>
                  <p className="text-lg text-white/80">
                    Master pointers and memory. Sort fragmented arrays and connect broken linked
                    lists in our interactive lab.
                  </p>
                </div>
                <div className="mt-auto inline-flex items-center gap-2 font-bold bg-white text-blue-700 px-6 py-3 rounded-xl self-start group-hover:bg-yellow-300 group-hover:text-blue-900 transition-colors">
                  Enter Arena <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Feature Exploration */}
      <section className="bg-muted/30 py-24 px-4 border-y">
        <div className="container max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Deep-Dive Topic Explorer</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Each topic includes detailed text explanations and interactive live demonstrations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 group">
              <Link href="/system-design">
                <CardHeader>
                  <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Visual System Design</CardTitle>
                  <CardDescription>Scalability, Reliability, and Architecture</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground decoration-primary/20">
                    <li>Interactive Traffic Flow Demos</li>
                    <li>Load Balancing & Caching</li>
                    <li>Database Sharding & Replication</li>
                    <li>Real-time Latency Visualizers</li>
                  </ul>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 group">
              <Link href="/data-structures">
                <CardHeader>
                  <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Code2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">interactive Algorithms</CardTitle>
                  <CardDescription>Data Manipulation and Memory Visuals</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Live Node Manipulation</li>
                    <li>Arrays, Linked Lists, & Trees</li>
                    <li>Graph Traversal Visualizations</li>
                    <li>Memory Allocation Simulators</li>
                  </ul>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
