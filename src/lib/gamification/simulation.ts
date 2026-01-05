import { GameState, SystemComponent, Connection, COMPONENT_CATALOG } from "./types";

export function calculateSystemMetrics(
    components: SystemComponent[],
    connections: Connection[],
    traffic: number
): GameState["metrics"] {
    // 1. Calculate Latency
    // Simplified path analysis: calculate max latency of any path from client to db
    // Real DFS/BFS would be better, but for now we sum up latency of all active components in the chain
    // This is a heuristic simulation

    const serverCount = components.filter(c => c.type === "server").length;
    const hasLB = components.some(c => c.type === "load-balancer");
    const hasCache = components.some(c => c.type === "cache");
    const hasCDN = components.some(c => c.type === "cdn");
    const dbCount = components.filter(c => c.type === "database").length;

    let baseLatency = 300; // Unoptimized base

    // Improvements
    if (hasLB && serverCount > 1) baseLatency *= 0.6; // LB helps distribution
    if (hasCache) baseLatency *= 0.5; // Cache creates huge win
    if (hasCDN) baseLatency *= 0.8; // CDN helps static assets

    // Bottlenecks
    if (serverCount === 0) baseLatency = 10000; // Broken system
    else if (traffic > serverCount * COMPONENT_CATALOG.server.capacity) {
        // Overloaded servers
        const overloadFactor = traffic / (serverCount * COMPONENT_CATALOG.server.capacity);
        baseLatency *= (overloadFactor * 2);
    }

    if (dbCount > 0 && traffic > dbCount * COMPONENT_CATALOG.database.capacity) {
        // Overloaded DB
        const dbOverload = traffic / (dbCount * COMPONENT_CATALOG.database.capacity);
        baseLatency *= (dbOverload * 1.5);
    }

    // Floor latency
    const finalLatency = Math.max(10, Math.round(baseLatency));

    // 2. Throughput & Reliability
    let reliability = 0.95;
    if (serverCount > 1 && hasLB) reliability = 0.99;
    if (serverCount > 2 && dbCount > 1) reliability = 0.999;

    // If overloaded, reliability drops
    if (finalLatency > 1000) reliability = Math.max(0.5, reliability - 0.2);

    const throughput = Math.min(traffic, serverCount * 120); // Simplified throughput cap

    // 3. User Satisfaction (0-100)
    // 100ms = 100, 1000ms = 0
    let sat = 100 - (finalLatency / 10);
    if (reliability < 0.99) sat -= 20;
    sat = Math.max(0, Math.min(100, sat));

    // 4. Cost
    const totalCost = components.reduce((sum, c) => sum + c.config.cost, 0);

    return {
        latency: finalLatency,
        throughput: Math.round(throughput),
        reliability,
        monthlyCost: totalCost,
        userSatisfaction: Math.round(sat),
    };
}
