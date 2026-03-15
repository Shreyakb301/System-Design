import { ArraysLesson } from "@/components/lessons/ArraysLesson";
import { BSTLesson } from "@/components/lessons/BSTLesson";
import { FastSlowLesson } from "@/components/lessons/FastSlowLesson";
import { GraphTraversalLesson } from "@/components/lessons/GraphTraversalLesson";
import { HashTablesLesson } from "@/components/lessons/HashTablesLesson";
import { LinkedListLesson } from "@/components/lessons/LinkedListLesson";
import { TreeTraversalLesson } from "@/components/lessons/TreeTraversalLesson";
import { TwoPointersLesson } from "@/components/lessons/TwoPointersLesson";

// Placeholder content map
const CONTENT_MAP: Record<string, { title: string; description: string; visual?: React.ReactNode }> = {
    "arrays": {
        title: "Static vs Dynamic Arrays",
        description: "Understanding how arrays are stored in memory and how they resize.",
        visual: <ArraysLesson />,
    },
    "two-pointers": {
        title: "Two Pointers Technique",
        description: "A technique that moves two positions through the same data structure with a rule, often solving the problem in O(n) time.",
        visual: <TwoPointersLesson />,
    },
    "singly-doubly": {
        title: "Singly vs Doubly Linked Lists",
        description: "A linear collection of data elements whose order is not given by their physical placement in memory.",
        visual: <LinkedListLesson />,
    },
    "fast-slow": {
        title: "Fast & Slow Pointers",
        description: "A pattern that uses two pointers moving at different speeds to solve complex linked list problems like cycle detection and finding the middle node.",
        visual: <FastSlowLesson />,
    },
    "hash-tables": {
        title: "Hash Tables",
        description: "A data structure that implements an associative array abstract data type, a structure that can map keys to values.",
        visual: <HashTablesLesson />,
    },
    "bst": {
        title: "Binary Search Tree",
        description: "A node-based binary tree data structure which has the following properties: The left subtree of a node contains only nodes with keys lesser than the node's key. The right subtree of a node contains only nodes with keys greater than the node's key.",
        visual: <BSTLesson />,
    },
    "traversals": {
        title: "Tree Traversals",
        description: "Tree traversal (also known as tree search) is a form of graph traversal and refers to the process of visiting (checking and/or updating) each node in a tree data structure, exactly once.",
        visual: <TreeTraversalLesson />,
    },
    "bfs-dfs": {
        title: "BFS vs. DFS (Graphs)",
        description: "Compare the two fundamental graph traversal algorithms: Breadth-First Search and Depth-First Search. See how they explore the same graph differently using Queues and Stacks.",
        visual: <GraphTraversalLesson />,
    },
};

export default async function DataStructureTopicPage(props: { params: Promise<{ topic: string }> }) {
    const params = await props.params;
    const topicId = params.topic;

    const content = CONTENT_MAP[topicId];

    if (!content) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight capitalize">{topicId.replace("-", " ")}</h1>
                <p className="text-muted-foreground">Visual explanation coming soon.</p>
            </div>
        );
    }

    return (
        <div className="box-border w-full min-w-0 max-w-5xl space-y-8">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">{content.title}</h1>
                <p className="text-xl text-muted-foreground">
                    {content.description}
                </p>
            </div>

            {content.visual && (
                <div className="my-8 w-full min-w-0 max-w-full">
                    {content.visual}
                </div>
            )}
        </div>
    );
}
