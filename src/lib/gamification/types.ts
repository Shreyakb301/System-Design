import { LucideIcon, Server, Database, Layers, Network, Globe, Box, Shield, Zap } from "lucide-react";

export type ComponentType =
    | "client"
    | "server"
    | "database"
    | "load-balancer"
    | "cache"
    | "cdn"
    | "queue"
    | "firewall";

export interface SystemComponent {
    id: string;
    type: ComponentType;
    x: number;
    y: number;
    config: {
        capacity: number; // requests per second
        latency: number; // ms
        cost: number; // $ per month
        reliability: number; // 0-1
    };
    name?: string;
}

export interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
}

export interface Scenario {
    id: string;
    title: string;
    description: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";

    // Initial state
    initialBudget: number;
    initialComponents: SystemComponent[];
    initialConnections: Connection[];
    initialTraffic: number; // RPS

    // Goals to win
    goals: {
        maxLatency: number;
        minReliability: number; // 0-1 (e.g., 0.99 for 99%)
        maxCost: number;
        minThroughput?: number;
    };
}

export interface GameState {
    budget: number;
    traffic: number; // current RPS
    components: SystemComponent[];
    connections: Connection[];
    metrics: {
        latency: number;
        throughput: number;
        reliability: number;
        monthlyCost: number;
        userSatisfaction: number; // 0-100
    };
}

export const COMPONENT_CATALOG: Record<ComponentType, {
    name: string;
    icon: LucideIcon;
    cost: number;
    capacity: number;
    latency: number;
    reliability: number;
    description: string;
}> = {
    client: { name: "Client", icon: Globe, cost: 0, capacity: 0, latency: 0, reliability: 1, description: "Source of traffic" },
    server: { name: "App Server", icon: Server, cost: 50, capacity: 100, latency: 50, reliability: 0.99, description: "Processes requests" },
    database: { name: "Database", icon: Database, cost: 100, capacity: 200, latency: 20, reliability: 0.999, description: "Stores data" },
    "load-balancer": { name: "Load Balancer", icon: Layers, cost: 20, capacity: 1000, latency: 5, reliability: 0.9999, description: "Distributes traffic" },
    cache: { name: "Cache (Redis)", icon: Zap, cost: 80, capacity: 2000, latency: 2, reliability: 0.995, description: "Fast temporary storage" },
    cdn: { name: "CDN", icon: Network, cost: 150, capacity: 5000, latency: 20, reliability: 0.999, description: "Delivers static content globally" },
    queue: { name: "Message Queue", icon: Box, cost: 40, capacity: 500, latency: 10, reliability: 0.999, description: "Async processing" },
    firewall: { name: "Firewall", icon: Shield, cost: 10, capacity: 1000, latency: 5, reliability: 0.9999, description: "Security layer" },
};
