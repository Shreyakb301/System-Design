
export type DSNodeType = "array-node" | "list-node" | "tree-node";

export interface DSNode {
    id: string;
    type: DSNodeType;
    value: number | string;
    x: number;
    y: number;
    highlighted?: boolean;
    nextId?: string; // For linked lists
    leftId?: string; // For trees
    rightId?: string; // For trees
}

export interface DSLevel {
    id: string;
    title: string;
    description: string;
    target: {
        type: "array_sort" | "list_connect" | "tree_balance";
        description: string;
    };
    initialNodes: DSNode[];
}

export const DS_LEVELS: DSLevel[] = [
    {
        id: "level-1",
        title: "The Broken Chain",
        description: "The linked list is disconnected! Connect the nodes in ascending order to restore the data flow.",
        target: {
            type: "list_connect",
            description: "Connect all nodes in ascending order (1 -> 2 -> 3 -> 4).",
        },
        initialNodes: [
            { id: "n1", type: "list-node", value: 1, x: 100, y: 150 },
            { id: "n3", type: "list-node", value: 3, x: 300, y: 100 }, // Disconnected/Misplaced
            { id: "n2", type: "list-node", value: 2, x: 200, y: 200 },
            { id: "n4", type: "list-node", value: 4, x: 400, y: 150 },
        ],
    },
    {
        id: "level-2",
        title: "Array Optimization",
        description: "This array is fragmented. Rearrange the values to be contiguous and sorted.",
        target: {
            type: "array_sort",
            description: "Sort the array [5, 1, 3, 2, 4].",
        },
        initialNodes: [
            { id: "a1", type: "array-node", value: 5, x: 100, y: 150 },
            { id: "a2", type: "array-node", value: 1, x: 160, y: 150 },
            { id: "a3", type: "array-node", value: 3, x: 220, y: 150 },
            { id: "a4", type: "array-node", value: 2, x: 280, y: 150 },
            { id: "a5", type: "array-node", value: 4, x: 340, y: 150 },
        ],
    }
];
