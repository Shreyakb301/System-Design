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
    const hasQueue = components.some(c => c.type === "queue");
    const hasFirewall = components.some(c => c.type === "firewall");
    const dbCount = components.filter(c => c.type === "database").length;

    let baseLatency = 300; // Unoptimized base

    // Improvements
    if (hasLB && serverCount > 1) baseLatency *= 0.6; // LB helps distribution
    if (hasCache) baseLatency *= 0.5; // Cache creates huge win
    if (hasCDN) baseLatency *= 0.8; // CDN helps static assets
    if (hasQueue && traffic > serverCount * COMPONENT_CATALOG.server.capacity * 0.8) {
        baseLatency *= 0.85; // absorbs spikes when traffic surges
    }
    if (hasFirewall) baseLatency *= 1.03; // small inspection overhead

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
    if (hasFirewall) reliability = Math.min(0.9999, reliability + 0.004);
    if (hasQueue) reliability = Math.min(0.9999, reliability + 0.003);

    // If overloaded, reliability drops
    if (finalLatency > 1000) reliability = Math.max(0.5, reliability - 0.2);

    let throughputCapacity = serverCount * 120;
    if (hasLB) throughputCapacity += 160;
    if (hasCache) throughputCapacity += 220;
    if (hasCDN) throughputCapacity += 180;
    if (hasQueue) throughputCapacity += 140;
    const throughput = Math.min(traffic, throughputCapacity);

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
