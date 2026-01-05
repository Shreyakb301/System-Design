import { Scenario, COMPONENT_CATALOG } from "./types";

export const SCENARIOS: Scenario[] = [
    {
        id: "level-1",
        title: "The Startup Launch",
        description: "Your new app is gaining traction! You have a single server directly connecting to a database. But user traffic is increasing, and the server is struggling. Scale it up!",
        difficulty: "Beginner",
        initialBudget: 500,
        initialTraffic: 150, // RPS
        initialComponents: [
            {
                id: "client",
                type: "client",
                x: 50,
                y: 200,
                config: { ...COMPONENT_CATALOG.client },
            },
            {
                id: "server-1",
                type: "server",
                x: 250,
                y: 200,
                config: { ...COMPONENT_CATALOG.server },
            },
            {
                id: "db-1",
                type: "database",
                x: 450,
                y: 200,
                config: { ...COMPONENT_CATALOG.database },
            },
        ],
        initialConnections: [
            { id: "c1", sourceId: "client", targetId: "server-1" },
            { id: "c2", sourceId: "server-1", targetId: "db-1" },
        ],
        goals: {
            maxLatency: 200, // ms
            minReliability: 0.99,
            maxCost: 400,
            minThroughput: 140,
        },
    },
    {
        id: "level-2",
        title: "Global Expansion",
        description: "Users from around the world are complaining about slowness. Your single database is also getting overwhelmed with read requests. Fix it!",
        difficulty: "Intermediate",
        initialBudget: 1500,
        initialTraffic: 2000,
        initialComponents: [
            {
                id: "client",
                type: "client",
                x: 50,
                y: 200,
                config: { ...COMPONENT_CATALOG.client },
            },
            {
                id: "lb-1",
                type: "load-balancer",
                x: 200,
                y: 200,
                config: { ...COMPONENT_CATALOG["load-balancer"] },
            },
            {
                id: "server-1",
                type: "server",
                x: 400,
                y: 100,
                config: { ...COMPONENT_CATALOG.server },
            },
            {
                id: "server-2",
                type: "server",
                x: 400,
                y: 300,
                config: { ...COMPONENT_CATALOG.server },
            },
            {
                id: "db-1",
                type: "database",
                x: 600,
                y: 200,
                config: { ...COMPONENT_CATALOG.database },
            },
        ],
        initialConnections: [
            { id: "c1", sourceId: "client", targetId: "lb-1" },
            { id: "c2", sourceId: "lb-1", targetId: "server-1" },
            { id: "c3", sourceId: "lb-1", targetId: "server-2" },
            { id: "c4", sourceId: "server-1", targetId: "db-1" },
            { id: "c5", sourceId: "server-2", targetId: "db-1" },
        ],
        goals: {
            maxLatency: 100,
            minReliability: 0.999,
            maxCost: 1200,
        },
    },
];
