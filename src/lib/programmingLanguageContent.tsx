import type { ReactNode } from "react";
import { CompilerPipelineVisual } from "@/components/visuals/CompilerPipelineVisual";
import { ConcurrencyVisual } from "@/components/visuals/ConcurrencyVisual";
import { ExpressionsPrecedenceVisual } from "@/components/visuals/ExpressionsPrecedenceVisual";
import { ParameterPassingVisual } from "@/components/visuals/ParameterPassingVisual";
import { TypeSystemsVisual } from "@/components/visuals/TypeSystemsVisual";
import { LanguageCriteriaLesson } from "@/components/lessons/LanguageCriteriaLesson";
import { ProgrammingConceptLesson } from "@/components/lessons/ProgrammingConceptLesson";
import { ScopeLifetimeLesson } from "@/components/lessons/ScopeLifetimeLesson";
import { SyntaxSemanticsLesson } from "@/components/lessons/SyntaxSemanticsLesson";
import { VariableAttributesLesson } from "@/components/lessons/VariableAttributesLesson";

export type ProgrammingLanguageContent = {
  title: string;
  description: string;
  status?: string;
  visual: ReactNode;
};

type LessonBuilder = Omit<ProgrammingLanguageContent, "status"> & {
  status?: string;
};

function conceptLesson(config: {
  title: string;
  description: string;
  summaryTitle: string;
  summaryBody: string;
  whenToReach: string;
  whyThisMatters: string;
  cards?: Array<{ title: string; body: string }>;
  comparison?: {
    title: string;
    columns: string[];
    rows: Array<{ label: string; values: string[] }>;
  };
  takeaways: string[];
}): LessonBuilder {
  return {
    title: config.title,
    description: config.description,
    status: "Concept walkthrough",
    visual: (
      <ProgrammingConceptLesson
        summaryTitle={config.summaryTitle}
        summaryBody={config.summaryBody}
        whenToReach={config.whenToReach}
        whyThisMatters={config.whyThisMatters}
        cards={config.cards}
        comparison={config.comparison}
        takeaways={config.takeaways}
      />
    ),
  };
}

function interactiveLesson(config: {
  title: string;
  description: string;
  summaryTitle: string;
  summaryBody: string;
  whenToReach: string;
  whyThisMatters: string;
  cards?: Array<{ title: string; body: string }>;
  comparison?: {
    title: string;
    columns: string[];
    rows: Array<{ label: string; values: string[] }>;
  };
  takeaways: string[];
  watchList: string[];
  simulation: ReactNode;
}): LessonBuilder {
  return {
    title: config.title,
    description: config.description,
    status: "Interactive lesson",
    visual: (
      <ProgrammingConceptLesson
        summaryTitle={config.summaryTitle}
        summaryBody={config.summaryBody}
        whenToReach={config.whenToReach}
        whyThisMatters={config.whyThisMatters}
        cards={config.cards}
        visual={config.simulation}
        watchList={config.watchList}
        comparison={config.comparison}
        takeaways={config.takeaways}
      />
    ),
  };
}

export const PROGRAMMING_LANGUAGE_CONTENT: Record<
  string,
  ProgrammingLanguageContent
> = {
  "language-evaluation": {
    title: "Language Evaluation Criteria",
    description:
      "Programming languages are evaluated through tradeoffs in readability, writability, reliability, and cost rather than by syntax style alone.",
    status: "Interactive lesson",
    visual: <LanguageCriteriaLesson />,
  },
  "syntax-semantics": {
    title: "Syntax vs Semantics",
    description:
      "Syntax describes how code is structured, while semantics explains what that code means when it runs.",
    status: "Interactive lesson",
    visual: <SyntaxSemanticsLesson />,
  },
  "variable-attributes": {
    title: "Attributes of a Variable",
    description:
      "Variables are defined by attributes such as name, type, value, address, scope, and lifetime rather than by a label alone.",
    status: "Interactive lesson",
    visual: <VariableAttributesLesson />,
  },
  "scope-lifetime": {
    title: "Scope and Lifetime",
    description:
      "Scope determines where a variable can be used, while lifetime determines how long it exists during execution.",
    status: "Interactive lesson",
    visual: <ScopeLifetimeLesson />,
  },
  "static-dynamic-types": interactiveLesson({
    title: "Static and Dynamic Type Systems",
    description:
      "Static systems check type consistency before execution, while dynamic systems attach types to values and check them as the program runs.",
    summaryTitle: "The question is not whether types exist. It is when the language enforces them.",
    summaryBody:
      "Sebesta treats type systems as a design choice about when errors surface and how much flexibility a language keeps during execution. Static typing pushes more checking into the compiler. Dynamic typing delays more checking until runtime values appear.",
    whenToReach:
      "Reach for this concept whenever you are comparing languages, reading a compiler diagnostic, or deciding whether a bug should be prevented before execution or caught at runtime.",
    whyThisMatters:
      "The timing of type enforcement changes tooling, reliability, refactoring, and debugging. It affects whether a mistake is rejected before shipping or only after a path executes in production.",
    cards: [
      {
        title: "Static typing front-loads certainty",
        body: "The compiler reasons about declarations and operations before the program runs. That enables earlier feedback and stronger editor tooling.",
      },
      {
        title: "Dynamic typing front-loads flexibility",
        body: "Values carry runtime tags, so the program can evolve shape as it executes. That flexibility is useful, but incompatible values can travel farther before failing.",
      },
    ],
    watchList: [
      "Step through the same idea under compile-time checking and runtime checking.",
      "Watch when the error appears: before execution starts versus when the bad line actually runs.",
      "Notice that the code is similar, but the language decides when to say no.",
    ],
    comparison: {
      title: "The difference is when the language commits to the types",
      columns: ["Static typing", "Dynamic typing"],
      rows: [
        {
          label: "Error timing",
          values: ["Before execution", "During execution"],
        },
        {
          label: "Types belong to",
          values: ["Variables and declarations", "Runtime values"],
        },
        {
          label: "Big strength",
          values: ["Earlier guarantees", "More flexibility while prototyping"],
        },
        {
          label: "Typical cost",
          values: ["More up-front constraints", "More runtime uncertainty"],
        },
      ],
    },
    takeaways: [
      "Every language has to manage types somehow. The key design question is when those checks happen.",
      "Static typing rejects incompatible operations before execution starts.",
      "Dynamic typing lets more programs begin execution, then checks compatibility when values are used.",
      "Earlier feedback improves reliability; later feedback improves flexibility.",
    ],
    simulation: <TypeSystemsVisual />,
  }),
  "primitive-aggregate-types": conceptLesson({
    title: "Primitive and Aggregate Data Types",
    description:
      "Primitive types model single values, while aggregate types combine multiple values into arrays, records, tuples, or objects.",
    summaryTitle: "Primitive values are atomic. Aggregate values package structure.",
    summaryBody:
      "Programming languages need a way to represent both one piece of data and collections of related data. Primitive types are the simplest building blocks. Aggregate types add composition, layout, and richer operations.",
    whenToReach:
      "Reach for this concept when deciding whether a value should stand alone or be grouped with related state in an array, record, tuple, or object.",
    whyThisMatters:
      "Data modeling determines what operations feel natural in a language. Primitive values are easy to reason about, but real programs need aggregate shapes to express relationships.",
    cards: [
      {
        title: "Primitive types answer one question",
        body: "A primitive value usually fits one conceptual slot: one number, one character, one Boolean, one reference.",
      },
      {
        title: "Aggregate types answer composition",
        body: "Arrays, records, tuples, and objects package several values together so one variable can represent a larger concept.",
      },
    ],
    takeaways: [
      "Primitive types model one value at a time.",
      "Aggregate types group several values into one larger unit.",
      "Language design choices decide whether aggregates are fixed-size, named, indexed, or object-based.",
      "Most real-world data models need both primitive and aggregate layers.",
    ],
  }),
  "expressions-precedence": interactiveLesson({
    title: "Expressions and Precedence",
    description:
      "Expressions combine operands and operators, while precedence and associativity decide how the language groups them.",
    summaryTitle: "Grouping controls expression meaning.",
    summaryBody:
      "Languages must decide how to parse and evaluate dense expressions like a + b * c or a - b - c. Precedence ranks operators. Associativity breaks ties between operators at the same level.",
    whenToReach:
      "Reach for this concept whenever an expression mixes several operators or whenever you are designing a parser, reading dense code, or deciding whether parentheses are necessary.",
    whyThisMatters:
      "Without explicit rules, expressions become ambiguous. Those rules shape both the parse tree and the meaning of the program.",
    cards: [
      {
        title: "Precedence sets priority",
        body: "Multiplication usually groups before addition, so a + b * c becomes a + (b * c) unless parentheses say otherwise.",
      },
      {
        title: "Association breaks ties",
        body: "For operators with the same precedence, the language decides whether grouping happens left to right or right to left.",
      },
    ],
    watchList: [
      "Watch multiplication group before addition.",
      "Compare equal-precedence subtraction operators.",
      "See parentheses override default grouping.",
    ],
    comparison: {
      title: "Three grouping rules",
      columns: ["Rule", "Effect"],
      rows: [
        {
          label: "Precedence",
          values: ["Ranks operators", "Higher rank groups first"],
        },
        {
          label: "Association",
          values: ["Breaks equal-rank ties", "Chooses left or right"],
        },
        {
          label: "Parentheses",
          values: ["Creates explicit groups", "Overrides default rules"],
        },
      ],
    },
    takeaways: [
      "Precedence answers which operator groups first.",
      "Associativity answers how equal-precedence operators group.",
      "Parentheses override both and improve readability when the expression is not obvious.",
      "These rules affect meaning, not just style.",
    ],
    simulation: <ExpressionsPrecedenceVisual />,
  }),
  "assignment-statements": conceptLesson({
    title: "Assignment Statements",
    description:
      "Assignment changes program state by copying, coercing, or rebinding a value into a storage location.",
    summaryTitle: "Assignment is where values become state.",
    summaryBody:
      "Expressions compute values, but assignment updates the program's memory model. Different languages attach different rules to assignment, including whether the target is mutable, whether coercions happen, and what counts as an assignable location.",
    whenToReach:
      "Reach for this concept whenever a line updates a variable, field, array cell, or reference target rather than just computing a temporary expression.",
    whyThisMatters:
      "Assignment is the moment where side effects happen. Understanding the target, the source value, and any coercion rules explains a large share of imperative program behavior.",
    cards: [
      {
        title: "Targets matter",
        body: "Assignments need an l-value or assignable location, such as a variable, field, or indexed element.",
      },
      {
        title: "Assignments may transform data",
        body: "Languages can copy values directly, coerce them to another type, or even trigger setter methods and property hooks.",
      },
    ],
    takeaways: [
      "Assignment is about updating state, not just computing a value.",
      "The target must be an assignable location.",
      "Language rules decide whether coercions, copies, or side effects happen during assignment.",
      "Clear assignment semantics make stateful code easier to reason about.",
    ],
  }),
  "selection-statements": conceptLesson({
    title: "Selection Statements",
    description:
      "Selection constructs choose one control-flow path based on a condition or matched value.",
    summaryTitle: "Selection is how languages turn data into branches.",
    summaryBody:
      "If, else-if, switch, and pattern matching constructs let a program choose among alternatives. Their design affects readability, exhaustiveness checking, and how many mistakes the compiler can catch.",
    whenToReach:
      "Reach for this concept when a program must choose one path among several based on a Boolean condition or the shape of a value.",
    whyThisMatters:
      "Selection constructs are where control flow begins to branch. A language can make those branches concise and safe or leave the programmer to manage fallthrough and missed cases manually.",
    cards: [
      {
        title: "Simple selection asks yes or no",
        body: "A basic if statement chooses between two paths depending on a condition.",
      },
      {
        title: "Multi-way selection asks which case",
        body: "Switches and pattern matching scale selection to many alternatives and can sometimes enforce exhaustiveness.",
      },
    ],
    takeaways: [
      "Selection statements choose among alternative paths.",
      "Language design affects whether cases are explicit, exhaustive, or fall through implicitly.",
      "Pattern matching is a richer selection form because it can branch on value shape, not just equality.",
      "Readable control flow reduces logic bugs.",
    ],
  }),
  "iterative-statements": conceptLesson({
    title: "Iterative Statements",
    description:
      "Iterative statements repeat work while a condition holds, for a fixed range, or until a collection is exhausted.",
    summaryTitle: "Iteration is controlled repetition with a clear progress rule.",
    summaryBody:
      "Loops give languages a way to repeat computation without duplicating source code. Different loop forms emphasize different mental models: counter control, sentinel control, collection traversal, or indefinite repetition.",
    whenToReach:
      "Reach for this concept when a task needs repeated execution and the key design question is what drives progress toward termination.",
    whyThisMatters:
      "Loop design changes readability and safety. A language that makes the progress rule obvious makes infinite loops, off-by-one bugs, and hidden mutation easier to catch.",
    cards: [
      {
        title: "Counter-controlled loops make progress explicit",
        body: "for loops show initialization, condition, and update in one place, which makes bounds easier to inspect.",
      },
      {
        title: "Condition-controlled loops emphasize a stopping rule",
        body: "while and repeat-until loops express repetition when the exact number of iterations is not known in advance.",
      },
    ],
    takeaways: [
      "Every loop needs a progress rule and a stopping rule.",
      "Different loop forms exist because different problems make those rules easier or harder to see.",
      "Collection loops trade control for readability by handling indexes internally.",
      "Termination and invariants matter more than syntax alone.",
    ],
  }),
  "procedures-functions": conceptLesson({
    title: "Procedures vs Functions",
    description:
      "Procedures emphasize actions and side effects, while functions emphasize computed results returned to the caller.",
    summaryTitle: "Subprograms package behavior, but not all subprograms communicate the same way.",
    summaryBody:
      "A language can distinguish between subprograms that primarily perform actions and those that primarily compute values. Even when the syntax looks similar, the design intent affects composition and readability.",
    whenToReach:
      "Reach for this concept whenever you are deciding whether a routine should mainly return a value, mainly perform an effect, or mix both responsibilities.",
    whyThisMatters:
      "Clear boundaries between result-producing code and effect-producing code make larger programs easier to compose, test, and reason about.",
    cards: [
      {
        title: "Functions compose through returned values",
        body: "A function can be nested inside expressions because its main contract is to compute and return a result.",
      },
      {
        title: "Procedures compose through effects",
        body: "A procedure is often called for what it changes: I/O, mutation, communication, or state updates.",
      },
    ],
    takeaways: [
      "Functions emphasize returned values.",
      "Procedures emphasize effects on the world or on program state.",
      "Many modern languages blur the line, but the mental distinction is still useful.",
      "The clearer the contract, the easier the code is to compose.",
    ],
  }),
  "parameter-passing": interactiveLesson({
    title: "Parameter-Passing Methods",
    description:
      "Parameter-passing semantics decide whether a callee receives a copy, an alias, or a copy-in/copy-out proxy for the caller's data.",
    summaryTitle: "The key question is what exactly crosses the call boundary.",
    summaryBody:
      "Sebesta treats parameter passing as one of the deepest subprogram design decisions because it controls aliasing, side effects, and how much a callee can change the caller's state.",
    whenToReach:
      "Reach for this concept when you want to predict whether a subprogram can mutate caller data, whether two parameter names can alias the same storage, or why one language's function call behaves differently from another's.",
    whyThisMatters:
      "A function call can look innocent in source code while hiding important memory behavior. Understanding pass-by-value, pass-by-reference, and value-result semantics explains many surprising bugs.",
    cards: [
      {
        title: "Copies isolate the callee",
        body: "If the callee receives its own slot, local changes do not automatically leak back to the caller.",
      },
      {
        title: "Aliases couple caller and callee",
        body: "If the callee receives another name for the same storage, side effects become immediate and visible outside the routine.",
      },
    ],
    comparison: {
      title: "Each passing strategy answers the aliasing question differently",
      columns: ["Pass by value", "Pass by reference", "Value-result"],
      rows: [
        {
          label: "What enters the callee",
          values: ["A copied value", "An alias to caller storage", "A copied value"],
        },
        {
          label: "When caller sees changes",
          values: ["Never", "Immediately", "At return"],
        },
        {
          label: "Main benefit",
          values: ["Isolation", "Direct mutation", "Isolation during call, update after"],
        },
        {
          label: "Main risk",
          values: ["Extra copying", "Aliasing surprises", "Copy-out surprises with shared targets"],
        },
      ],
    },
    takeaways: [
      "Parameter passing is a memory model decision, not just a syntax choice.",
      "Pass by value protects the caller by isolating the callee in a copied slot.",
      "Pass by reference exposes the caller slot directly, so side effects are immediate.",
      "Value-result copies in first and copies out later, which changes when the caller sees updates.",
    ],
    watchList: [
      "Keep the caller value in view and compare it to the callee parameter on every step.",
      "Notice which tabs create a copy and which create an alias.",
      "Watch for the copy-out step because it is the entire point of value-result semantics.",
    ],
    simulation: <ParameterPassingVisual />,
  }),
  "local-referencing": conceptLesson({
    title: "Local Referencing",
    description:
      "Local referencing describes how a running subprogram finds the right local variable or nonlocal name at execution time.",
    summaryTitle: "A name is only useful if the runtime can locate the storage behind it.",
    summaryBody:
      "When a subprogram executes, the language implementation needs a strategy for resolving names to actual storage locations. Activation records, static links, displays, and symbol information all support that lookup.",
    whenToReach:
      "Reach for this concept when you are asking how nested scopes, local variables, and nonlocal variables are located at runtime.",
    whyThisMatters:
      "Name lookup feels abstract at the source level, but the runtime must turn that abstraction into concrete memory addresses quickly and correctly.",
    cards: [
      {
        title: "Local names are usually direct",
        body: "A variable in the current activation record can often be found by a fixed offset from the frame pointer.",
      },
      {
        title: "Nonlocal names need extra structure",
        body: "Nested subprograms require static links, displays, or another mechanism to reach the right surrounding scope.",
      },
    ],
    takeaways: [
      "Local referencing is the runtime side of scope rules.",
      "Current-frame variables are usually cheapest to access.",
      "Nested scopes need extra metadata to reach outer variables correctly.",
      "Implementation strategy affects performance and language flexibility.",
    ],
  }),
  "calls-returns": conceptLesson({
    title: "The Semantics of Calls and Returns",
    description:
      "Calls create new execution contexts, and returns tear them down while restoring control to the previous context.",
    summaryTitle: "Every call changes control flow and memory state together.",
    summaryBody:
      "Calling a subprogram is not just a jump to another line. The runtime has to save a return point, create a fresh activation record, bind parameters, and eventually unwind all of that on return.",
    whenToReach:
      "Reach for this concept when debugging recursion, stack traces, local-variable lifetime, or any behavior that depends on nested calls.",
    whyThisMatters:
      "The call stack is one of the most important runtime structures in programming languages. If you understand calls and returns, you understand a large share of function behavior, recursion, and memory lifetime.",
    cards: [
      {
        title: "A call creates a frame",
        body: "Parameters, locals, temporaries, and bookkeeping metadata all live in the new activation record.",
      },
      {
        title: "A return restores the caller",
        body: "Returning destroys the current frame, restores the return address, and hands control back to the suspended caller.",
      },
    ],
    takeaways: [
      "Function calls allocate a fresh execution context.",
      "Returns restore the previous context and destroy locals tied to the current frame.",
      "Recursion works because each call gets its own frame.",
      "Stack discipline makes call/return behavior predictable and fast.",
    ],
  }),
  "data-abstraction": conceptLesson({
    title: "Data Abstraction",
    description:
      "Data abstraction separates what a structure does from how it is represented internally.",
    summaryTitle: "Good abstractions hide representation but expose a stable interface.",
    summaryBody:
      "Abstract data types, modules, and classes let a language package state with the operations that are allowed on that state. Clients depend on the contract, not the concrete storage layout.",
    whenToReach:
      "Reach for this concept when you want callers to use a type safely without depending on how its internals are stored.",
    whyThisMatters:
      "Hiding representation reduces coupling. It lets the implementation change without forcing every caller to be rewritten.",
    cards: [
      {
        title: "The interface says what",
        body: "The exposed operations tell clients what they may do with the data.",
      },
      {
        title: "The representation says how",
        body: "Internal fields, layouts, and helper logic stay hidden so the abstraction can evolve.",
      },
    ],
    takeaways: [
      "Abstraction means clients depend on behavior, not storage details.",
      "Encapsulation protects invariants by limiting direct access.",
      "Abstract data types and classes are both tools for controlled access.",
      "Representation hiding improves maintainability.",
    ],
  }),
  "object-allocation": conceptLesson({
    title: "Object Allocation and Deallocation",
    description:
      "Object lifetime depends on where the object lives, how it is created, and who is responsible for freeing it.",
    summaryTitle: "Object lifetime is a runtime policy, not just a type declaration.",
    summaryBody:
      "Languages differ sharply in how objects are allocated and reclaimed. Stack allocation ties lifetime to scope. Heap allocation decouples lifetime from scope and requires garbage collection, reference counting, or explicit deallocation.",
    whenToReach:
      "Reach for this concept when you are deciding whether an object should live briefly inside one call or outlive that call through references on the heap.",
    whyThisMatters:
      "Allocation strategy affects performance, memory safety, ownership, and how easily programs leak or dangle references.",
    cards: [
      {
        title: "Stack allocation is simple and fast",
        body: "Objects disappear automatically when their scope ends, but they cannot outlive the call frame that owns them.",
      },
      {
        title: "Heap allocation is flexible",
        body: "Objects can outlive the creating scope, but the language runtime must decide how and when they get reclaimed.",
      },
    ],
    takeaways: [
      "Lifetime and allocation strategy are tightly connected.",
      "Stack objects are cheap but short-lived.",
      "Heap objects are flexible but need an ownership or reclamation policy.",
      "Memory safety bugs often come from misunderstanding object lifetime.",
    ],
  }),
  "inheritance-polymorphism": conceptLesson({
    title: "Inheritance and Polymorphism",
    description:
      "Inheritance reuses and extends behavior across types, while polymorphism lets one interface work over many concrete implementations.",
    summaryTitle: "Inheritance is about structure. Polymorphism is about substitutability.",
    summaryBody:
      "Object-oriented languages often let a derived type reuse or refine the behavior of a base type. Polymorphism then lets callers treat many concrete objects through one shared interface.",
    whenToReach:
      "Reach for this concept when several types share behavior but still need specialized implementations behind a common contract.",
    whyThisMatters:
      "Good polymorphism lowers coupling because callers depend on capabilities rather than concrete types. Poor inheritance hierarchies do the opposite and make systems brittle.",
    cards: [
      {
        title: "Inheritance shares structure and behavior",
        body: "A subtype can reuse base fields or methods and then refine them.",
      },
      {
        title: "Polymorphism shares the call site",
        body: "One piece of code can operate on many implementations as long as they satisfy the same interface contract.",
      },
    ],
    takeaways: [
      "Inheritance and polymorphism are related but not identical concepts.",
      "Inheritance organizes reuse across types.",
      "Polymorphism lets the same call site work across many concrete implementations.",
      "Interfaces often give cleaner polymorphism than deep inheritance trees.",
    ],
  }),
  "dynamic-binding": conceptLesson({
    title: "Dynamic Method Call Binding",
    description:
      "Dynamic binding chooses which method body to run at runtime based on the actual object's type.",
    summaryTitle: "The call site stays the same, but the runtime target changes.",
    summaryBody:
      "When a language supports dynamic dispatch, a method call is not fully resolved by the static type alone. The runtime examines the actual receiver object and chooses the appropriate overridden method.",
    whenToReach:
      "Reach for this concept when one interface method can trigger different behavior depending on the object's actual runtime type.",
    whyThisMatters:
      "Dynamic binding is what makes polymorphism feel real. Without it, inheritance is mostly code reuse. With it, behavior can vary behind one stable interface.",
    cards: [
      {
        title: "Static type constrains the call shape",
        body: "The compiler checks that the method exists on the declared interface or base type.",
      },
      {
        title: "Runtime type chooses the body",
        body: "The dispatch table or method lookup mechanism selects the most specific implementation for the actual object.",
      },
    ],
    takeaways: [
      "Dynamic binding resolves behavior at runtime, not just at compile time.",
      "It is the mechanism behind method overriding and subtype polymorphism.",
      "The interface controls what can be called; the runtime object controls which body runs.",
      "Dispatch flexibility comes with some runtime indirection cost.",
    ],
  }),
  "predicate-calculus": conceptLesson({
    title: "Predicate Calculus",
    description:
      "Predicate calculus expresses facts and relationships as logical propositions with variables and quantifiers.",
    summaryTitle: "Logic programming starts from meaning, not from step-by-step control flow.",
    summaryBody:
      "Imperative programming tells the machine how to proceed. Logic programming starts from facts, predicates, and rules, then asks an engine to infer answers that satisfy a goal.",
    whenToReach:
      "Reach for this concept when a problem is easier to express as relationships and constraints than as explicit control flow.",
    whyThisMatters:
      "Predicate logic is the mathematical foundation under languages like Prolog. Without that foundation, logic programming feels magical instead of systematic.",
    cards: [
      {
        title: "Predicates describe relationships",
        body: "A predicate like parent(alice, bob) states a relation, not a command to execute.",
      },
      {
        title: "Goals ask whether something can be proven",
        body: "A query turns computation into proof search: can the engine derive the requested relation from the known facts and rules?",
      },
    ],
    takeaways: [
      "Predicate calculus represents meaning as facts and relations.",
      "Logic programming computes by proving goals against those facts and rules.",
      "The programmer states what is true, not step-by-step control flow.",
      "That shift is the core conceptual leap into logic programming.",
    ],
  }),
  "rules-goals": conceptLesson({
    title: "Rules and Goal Statements",
    description:
      "Rules derive new facts, and goal statements ask the inference engine to prove whether a relation holds.",
    summaryTitle: "Rules are the program. Goals are the questions you ask the program.",
    summaryBody:
      "Logic programs are built from facts and rules. A rule says when one relation follows from other relations. A goal or query asks the engine to search for substitutions that make the requested statement true.",
    whenToReach:
      "Reach for this concept when you need to understand how Prolog-style programs derive answers instead of executing explicit loops and conditionals.",
    whyThisMatters:
      "Rules and goals explain the control model of logic programming. The programmer declares implications; the engine handles the search.",
    cards: [
      {
        title: "Rules encode implication",
        body: "A rule says the head is true if the body conditions can all be proven.",
      },
      {
        title: "Goals trigger search",
        body: "A query asks the engine to find substitutions and rule expansions that make the requested predicate true.",
      },
    ],
    takeaways: [
      "Rules define how new truths can be derived.",
      "Goals are questions posed to the inference engine.",
      "Execution becomes proof search plus backtracking.",
      "The control strategy is implicit in the inference engine, not hand-written by the programmer.",
    ],
  }),
  "inferencing-process": conceptLesson({
    title: "The Inferencing Process",
    description:
      "Inference in logic programming depends on unification, rule expansion, and backtracking through alternatives.",
    summaryTitle: "The engine solves goals by matching patterns and exploring alternatives.",
    summaryBody:
      "Given a goal, a logic engine repeatedly tries to unify it with a fact or a rule head. If one path fails, it backtracks and tries another. That search behavior is the real execution model of logic programming.",
    whenToReach:
      "Reach for this concept when you want to know why a logic query succeeds, fails, or returns multiple answers.",
    whyThisMatters:
      "Without understanding inference, logic programming feels opaque. With it, you can predict which facts unify, where the engine backtracks, and why some queries explode combinatorially.",
    cards: [
      {
        title: "Unification is structured matching",
        body: "The engine finds substitutions that make two logical expressions identical.",
      },
      {
        title: "Backtracking searches alternatives",
        body: "If one rule or substitution path fails, the engine returns to the last choice point and tries another branch.",
      },
    ],
    takeaways: [
      "Logic execution is proof search driven by unification.",
      "Backtracking is what makes the engine exhaustive over alternatives.",
      "Success means a consistent substitution was found for the goal.",
      "Performance depends heavily on rule order and search space size.",
    ],
  }),
  "formal-syntax": conceptLesson({
    title: "Formal Syntax and Analysis",
    description:
      "Formal syntax uses grammars such as BNF to define exactly which sequences of tokens form valid programs.",
    summaryTitle: "Grammars turn vague language rules into precise, machine-checkable structure.",
    summaryBody:
      "Natural-language descriptions of syntax are too ambiguous for compiler work. Formal syntax gives a language exact production rules, which then support parsing, tooling, and language comparison.",
    whenToReach:
      "Reach for this concept when you want to know how a language definition becomes precise enough for a parser to enforce.",
    whyThisMatters:
      "Without a formal grammar, a compiler would have no authoritative way to decide whether a program is structurally valid.",
    cards: [
      {
        title: "BNF describes structure",
        body: "Nonterminals expand into terminals and other nonterminals according to production rules.",
      },
      {
        title: "Parsing consumes that grammar",
        body: "A parser uses the grammar to decide whether tokens fit a valid program structure and how they nest.",
      },
    ],
    takeaways: [
      "Formal syntax replaces informal prose with exact production rules.",
      "Parsers depend on these rules to recognize valid programs.",
      "Grammar design influences ambiguity and parser complexity.",
      "Syntax describes structure, not full meaning.",
    ],
  }),
  "attribute-grammars": conceptLesson({
    title: "Attribute Grammars",
    description:
      "Attribute grammars attach semantic information to syntax trees so the compiler can carry meaning alongside structure.",
    summaryTitle: "A parse tree becomes far more useful once facts can flow through it.",
    summaryBody:
      "A plain grammar can say whether a structure is valid. Attribute grammars enrich the tree with inherited and synthesized attributes so information like types, scopes, and declarations can move through the syntax tree.",
    whenToReach:
      "Reach for this concept when you need syntax plus semantic information, such as type propagation or declaration checking.",
    whyThisMatters:
      "Compilers need more than a shape. They need a disciplined way to attach and propagate meaning through that shape.",
    cards: [
      {
        title: "Synthesized attributes flow upward",
        body: "A subtree can compute facts such as resulting expression type and pass them to its parent.",
      },
      {
        title: "Inherited attributes flow downward",
        body: "A parent context can pass facts like expected type or environment information into a child subtree.",
      },
    ],
    takeaways: [
      "Attribute grammars extend syntax with semantic information flow.",
      "They help explain static semantics like type checking and declaration use.",
      "Inherited and synthesized attributes move information in opposite directions.",
      "They bridge the gap between grammar and meaning.",
    ],
  }),
  "translation-pipeline": interactiveLesson({
    title: "The Language Translation Pipeline",
    description:
      "Compilers translate source text through lexical analysis, parsing, semantic analysis, and code generation before a program can run.",
    summaryTitle: "A compiler is not one giant pass. It is a staged translation pipeline.",
    summaryBody:
      "Sebesta frames the compiler as a series of transformations, each responsible for a different class of questions. Characters become tokens, tokens become structure, structure becomes checked meaning, and meaning becomes executable instructions.",
    whenToReach:
      "Reach for this concept when you want to understand where syntax errors, semantic errors, and generated code each come from inside a compiler.",
    whyThisMatters:
      "Once you see the compiler as a pipeline, error messages, tooling, and language implementation stop feeling mysterious. You can place each kind of bug in the stage that actually owns it.",
    cards: [
      {
        title: "Each stage adds structure",
        body: "The compiler never jumps straight from characters to machine code. Every stage makes the program representation richer and more checkable.",
      },
      {
        title: "Each stage can halt the build",
        body: "A malformed program does not need to reach later stages. Syntax failure stops before semantic checking. Semantic failure stops before code generation.",
      },
    ],
    watchList: [
      "Compare the successful pipeline to the syntax-error pipeline so you can see exactly where the build stops.",
      "Track how the representation changes: source text, tokens, parse tree, semantic facts, instructions.",
      "Notice that each stage answers a different class of question.",
    ],
    comparison: {
      title: "Different compiler stages solve different problems",
      columns: ["Primary question", "Typical output"],
      rows: [
        {
          label: "Lexer",
          values: ["What are the tokens?", "Token stream"],
        },
        {
          label: "Parser",
          values: ["Do the tokens fit the grammar?", "Syntax tree"],
        },
        {
          label: "Semantic analysis",
          values: ["Does the program make sense?", "Annotated tree / diagnostics"],
        },
        {
          label: "Code generation",
          values: ["How do we execute it?", "Instructions or target code"],
        },
      ],
    },
    takeaways: [
      "The compiler is a sequence of stages, not one monolithic operation.",
      "Lexing, parsing, semantic analysis, and code generation each answer a different question.",
      "Errors stop the pipeline at the stage responsible for them.",
      "Understanding the pipeline makes compiler diagnostics much easier to interpret.",
    ],
    simulation: <CompilerPipelineVisual />,
  }),
  "lexical-analysis": conceptLesson({
    title: "Lexical Analysis",
    description:
      "Lexical analysis converts raw characters into tokens such as identifiers, keywords, operators, and punctuation.",
    summaryTitle: "Lexing is the step that teaches the compiler where the words are.",
    summaryBody:
      "Before a parser can work with grammar rules, the compiler needs to carve the raw text into meaningful units. The lexer handles whitespace, keywords, literals, operators, and delimiters to produce a token stream.",
    whenToReach:
      "Reach for this concept when you want to know why a compiler can distinguish identifiers from keywords or why malformed literals fail before parsing.",
    whyThisMatters:
      "Lexing creates the vocabulary that every later compiler phase depends on. If the token stream is wrong, everything built on top of it is wrong too.",
    cards: [
      {
        title: "Characters become categories",
        body: "The lexer decides whether a sequence is a keyword, identifier, operator, literal, or punctuation mark.",
      },
      {
        title: "The parser needs tokens, not text",
        body: "Grammar rules operate on a structured token stream, so lexing removes low-level textual noise first.",
      },
    ],
    takeaways: [
      "Lexical analysis is the first structural pass over source code.",
      "It groups characters into tokens that later stages can reason about.",
      "Some errors are lexical, such as malformed numbers or illegal characters.",
      "Tokens are the bridge from text to grammar.",
    ],
  }),
  "shared-memory": conceptLesson({
    title: "Shared Memory Architectures",
    description:
      "In shared-memory systems, multiple threads can see and mutate the same address space at the same time.",
    summaryTitle: "Shared memory makes communication cheap, but coordination expensive.",
    summaryBody:
      "When several threads share the same memory, communication is as simple as reading and writing the same variables. The difficulty moves to synchronization, visibility, and avoiding races.",
    whenToReach:
      "Reach for this concept when a program has multiple threads operating on the same data structures inside one process.",
    whyThisMatters:
      "Shared memory is fast and convenient, but it creates correctness hazards whenever multiple threads access the same mutable state concurrently.",
    cards: [
      {
        title: "Communication is implicit",
        body: "Threads do not need explicit messages when they already share the same variables.",
      },
      {
        title: "Coordination is explicit",
        body: "Locks, atomics, barriers, and condition variables exist because shared access needs ordering rules.",
      },
    ],
    takeaways: [
      "Shared memory lowers communication overhead between threads.",
      "It raises the risk of races and visibility bugs if updates are not synchronized.",
      "Coordination primitives exist to control who can access shared state and when.",
      "Correctness depends on both data sharing and execution ordering.",
    ],
  }),
  "data-race-synchronization": interactiveLesson({
    title: "Data Race and Synchronization",
    description:
      "A data race appears when multiple threads update shared state without coordination, and synchronization primitives prevent those lost updates.",
    summaryTitle: "Concurrency bugs are often hidden inside one innocent-looking line of code.",
    summaryBody:
      "The statement count = count + 1 feels atomic at the source level, but the runtime performs it as separate read, compute, and write steps. In shared memory, those substeps can interleave unless a synchronization primitive prevents it.",
    whenToReach:
      "Reach for this concept when multiple threads read and write the same variable or when a program behaves nondeterministically under load.",
    whyThisMatters:
      "Data races are some of the hardest bugs to reproduce because timing changes the result. Synchronization exists to turn timing-sensitive behavior back into deterministic behavior.",
    cards: [
      {
        title: "Races are about interleaving",
        body: "A race appears when one thread observes or overwrites state in the middle of another thread's update sequence.",
      },
      {
        title: "Synchronization protects critical sections",
        body: "Locks and similar primitives make a vulnerable read-modify-write sequence behave as one serialized unit.",
      },
    ],
    watchList: [
      "Run the race tab first and watch both threads read the same stale value.",
      "Then run the lock tab and notice how waiting is what restores correctness.",
      "Focus on the read-modify-write sequence because that is the real unit that must be protected.",
    ],
    comparison: {
      title: "The shared counter behaves differently only because the interleaving changes",
      columns: ["Unsynchronized", "Synchronized"],
      rows: [
        {
          label: "Access pattern",
          values: ["Threads interleave freely", "Critical section is serialized"],
        },
        {
          label: "Correctness",
          values: ["Lost updates possible", "Each increment preserved"],
        },
        {
          label: "Main tradeoff",
          values: ["More parallelism, less safety", "More safety, less concurrency in the critical section"],
        },
      ],
    },
    takeaways: [
      "count = count + 1 is not atomic unless the language or hardware makes it atomic.",
      "Data races happen because threads interleave the read, compute, and write steps.",
      "Synchronization protects the critical section by forcing a safe order.",
      "Correct concurrent code is mostly about controlling timing and shared access.",
    ],
    simulation: <ConcurrencyVisual />,
  }),
  "work-sharing-scheduling": conceptLesson({
    title: "Work Sharing and Scheduling",
    description:
      "Parallel programs need both a way to divide work and a policy for deciding which worker runs which task and when.",
    summaryTitle: "Concurrency scales only if the work is divided well and scheduled fairly.",
    summaryBody:
      "Creating threads is not enough. Real concurrent systems need a strategy for splitting work into units, balancing those units across workers, and avoiding idle threads or overloaded queues.",
    whenToReach:
      "Reach for this concept when designing thread pools, task queues, fork-join loops, or any parallel program that should keep workers busy without overwhelming one core.",
    whyThisMatters:
      "Poor scheduling can erase the benefits of parallelism. Good scheduling keeps cores busy, reduces waiting, and prevents one task from starving everything else.",
    cards: [
      {
        title: "Work sharing decides task granularity",
        body: "Tasks that are too large limit parallelism; tasks that are too small drown the program in overhead.",
      },
      {
        title: "Scheduling decides who runs next",
        body: "Queues, work stealing, and priorities all exist to keep workers productive while respecting fairness and responsiveness.",
      },
    ],
    takeaways: [
      "Parallel speedup depends on both task decomposition and scheduling policy.",
      "Balanced work keeps workers productive and reduces idle time.",
      "Too much scheduling overhead can cancel out the benefit of extra threads.",
      "Task granularity is a central design decision in concurrent systems.",
    ],
  }),
};
