import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Share2, Code2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-24 space-y-8 bg-gradient-to-b from-background to-muted/20">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Visualize Complete System Design & Data Structures
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Interactive explanations of complex engineering concepts. Built for developers who learn by seeing.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/system-design">
            <Button size="lg" className="gap-2 h-12 px-6">
              Start System Design <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/data-structures">
            <Button size="lg" variant="outline" className="gap-2 h-12 px-6">
              Explore Data Structures <Code2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container max-w-6xl mx-auto py-24 px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <Link href="/system-design">
              <CardHeader>
                <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">System Design</CardTitle>
                <CardDescription>Scalability, Reliability, and Architecture</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Load Balancing & Caching</li>
                  <li>Database Sharding & Replication</li>
                  <li>Microservices & Communication</li>
                  <li>CAP Theorem & Consistency</li>
                </ul>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
            <Link href="/data-structures">
              <CardHeader>
                <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Data Structures</CardTitle>
                <CardDescription>Algorithms and Storage Efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Arrays, Linked Lists, & Trees</li>
                  <li>Graph Traversal Algorithms</li>
                  <li>Hash Tables & Optimization</li>
                  <li>Time & Space Complexity</li>
                </ul>
              </CardContent>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
