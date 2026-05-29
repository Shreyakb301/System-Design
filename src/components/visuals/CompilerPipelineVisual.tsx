"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TeachingSimulationFrame,
  type TeachingSimulationTab,
} from "@/components/visuals/TeachingSimulationFrame";

type CompilerTab = "success" | "syntax-error";

type PipelineStep = {
  activeStage: number;
  status: string;
  outputTitle: string;
  outputLines: string[];
  what: string;
  why: string;
};

type PipelineDemo = {
  source: string[];
  context: string[];
  steps: PipelineStep[];
};

const TABS: Array<TeachingSimulationTab<CompilerTab>> = [
  { id: "success", label: "Successful Compile" },
  { id: "syntax-error", label: "Syntax Error" },
];

const STAGES = [
  "Source",
  "Lexer",
  "Parser",
  "Semantic Analysis",
  "Codegen",
];

const DEMOS: Record<CompilerTab, PipelineDemo> = {
  success: {
    source: ["let total = price + tax;", "print(total);"],
    context: ["Tokens become syntax trees, then checked programs, then instructions"],
    steps: [
      {
        activeStage: 0,
        status: "The compiler starts with raw source text.",
        outputTitle: "Input",
        outputLines: ["let total = price + tax;", "print(total);"],
        what: "The pipeline begins with source code as plain text.",
        why: "Compilers never reason about characters all at once. They pass the program through stages that add more structure each time.",
      },
      {
        activeStage: 1,
        status: "Characters are grouped into tokens.",
        outputTitle: "Tokens",
        outputLines: ["LET", "IDENT(total)", "=", "IDENT(price)", "+", "IDENT(tax)", ";", "PRINT", "(", "IDENT(total)", ")", ";"],
        what: "The lexer converts the character stream into tokens like identifiers, operators, and punctuation.",
        why: "Tokenization strips away irrelevant character-by-character detail. The parser needs structured pieces, not a raw text stream.",
      },
      {
        activeStage: 2,
        status: "The parser organizes tokens into a tree.",
        outputTitle: "Parse shape",
        outputLines: ["Assign(total)", "  Binary(+)", "    price", "    tax", "Call(print, total)"],
        what: "The parser builds a tree showing how the tokens fit the language grammar.",
        why: "Syntax is about structure. The parser answers whether the program matches the grammar and how the parts nest together.",
      },
      {
        activeStage: 3,
        status: "Names and types are checked against the language rules.",
        outputTitle: "Annotated program",
        outputLines: ["price: number", "tax: number", "total: number", "print expects number -> OK"],
        what: "Semantic analysis annotates the tree with facts like declared names and inferred types.",
        why: "A program can be syntactically valid but still meaningless. Semantic analysis checks the rules the grammar alone cannot express.",
      },
      {
        activeStage: 4,
        status: "The checked program is lowered into executable instructions.",
        outputTitle: "Generated instructions",
        outputLines: ["LOAD price", "ADD tax", "STORE total", "PRINT total"],
        what: "Code generation turns the checked program into machine-oriented instructions.",
        why: "Once structure and meaning are verified, the compiler can safely translate the intent into something the runtime can execute quickly.",
      },
      {
        activeStage: 4,
        status: "Compilation finished successfully.",
        outputTitle: "Result",
        outputLines: ["Executable produced.", "Program is ready to run."],
        what: "The pipeline finishes because every stage accepted the program.",
        why: "Each stage is a filter. If the source survives all of them, the compiler has enough confidence to emit runnable output.",
      },
    ],
  },
  "syntax-error": {
    source: ["let total = price + ;", "print(total);"],
    context: ["The parser stops the pipeline as soon as the grammar no longer matches"],
    steps: [
      {
        activeStage: 0,
        status: "The compiler starts with malformed source text.",
        outputTitle: "Input",
        outputLines: ["let total = price + ;", "print(total);"],
        what: "The source looks close to valid code, but the expression is incomplete.",
        why: "The pipeline still starts the same way. Errors are discovered by the stage responsible for that kind of rule, not by guesswork.",
      },
      {
        activeStage: 1,
        status: "The lexer can still tokenize the input.",
        outputTitle: "Tokens",
        outputLines: ["LET", "IDENT(total)", "=", "IDENT(price)", "+", ";", "PRINT", "(", "IDENT(total)", ")", ";"],
        what: "Lexing succeeds because each character sequence is still a recognizable token.",
        why: "Lexical analysis only cares about token boundaries. It does not yet know whether those tokens form a valid expression.",
      },
      {
        activeStage: 2,
        status: "Parser error: expected an operand after + before ;",
        outputTitle: "Parser diagnostic",
        outputLines: ["Binary expression incomplete", "price + <missing operand>"],
        what: "The parser stops when it reaches + followed immediately by ;.",
        why: "Grammar rules say an operator must have an expression on both sides. Once that structure fails, later stages have nothing reliable to analyze.",
      },
      {
        activeStage: 2,
        status: "Pipeline halted before semantic analysis or code generation.",
        outputTitle: "Result",
        outputLines: ["No type checking.", "No code generated."],
        what: "Compilation ends at the parser. No later stage runs.",
        why: "Compiler stages build on one another. If syntax is broken, there is no trustworthy tree for the semantic checker or code generator to use.",
      },
    ],
  },
};

const CODE = `tokens = lex(source)
tree = parse(tokens)
checked = analyze(tree)
output = generate(checked)`;

export function CompilerPipelineVisual() {
  const [activeTab, setActiveTab] = useState<CompilerTab>("success");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demo = DEMOS[activeTab];
  const step = demo.steps[currentStep];
  const isAtLastStep = currentStep === demo.steps.length - 1;
  const isAutoRunning = isPlaying && !isAtLastStep;

  useEffect(() => {
    if (!isAutoRunning) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentStep((previousStep) =>
        previousStep < demo.steps.length - 1 ? previousStep + 1 : previousStep
      );
    }, 1500);

    return () => window.clearInterval(timer);
  }, [demo.steps.length, isAutoRunning]);

  function selectTab(tab: CompilerTab) {
    setActiveTab(tab);
    setCurrentStep(0);
    setIsPlaying(false);
  }

  function reset() {
    setCurrentStep(0);
    setIsPlaying(false);
  }

  function togglePlay() {
    if (isAutoRunning) {
      setIsPlaying(false);
      return;
    }

    if (isAtLastStep) {
      setCurrentStep(0);
    }

    setIsPlaying(true);
  }

  return (
    <TeachingSimulationFrame
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={selectTab}
      badges={[
        {
          label: "Compiler pipeline",
          className: "border-blue-500/20 bg-blue-500/10 text-blue-200",
        },
        {
          label:
            activeTab === "success"
              ? "Every stage succeeds"
              : "Parser stops the build",
          className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        },
      ]}
      contextRow={
        <div className="flex flex-wrap gap-2">
          {demo.context.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-400"
            >
              {item}
            </Badge>
          ))}
        </div>
      }
      currentStep={currentStep}
      totalSteps={demo.steps.length}
      isPlaying={isPlaying}
      onReset={reset}
      onTogglePlay={togglePlay}
      onStep={() =>
        setCurrentStep((previousStep) =>
          previousStep < demo.steps.length - 1 ? previousStep + 1 : previousStep
        )
      }
      what={step.what}
      why={step.why}
      code={CODE}
      codeLabel="Compiler skeleton"
      stage={
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Pipeline stages
              </div>
              <div className="mt-4 grid gap-2">
                {STAGES.map((stage, index) => (
                  <div
                    key={stage}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm transition-colors",
                      index === step.activeStage
                        ? "border-blue-400/40 bg-blue-500/10 text-blue-100"
                        : index < step.activeStage
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                          : "border-slate-800 bg-slate-950/60 text-slate-400"
                    )}
                  >
                    {stage}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Source program
              </div>
              <div className="mt-4 space-y-1 font-mono text-sm text-slate-200">
                {demo.source.map((line, index) => (
                  <div key={line} className="grid grid-cols-[1.5rem_1fr] gap-3 rounded-xl px-3 py-2">
                    <span className="text-slate-600">{index + 1}</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {step.outputTitle}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{step.status}</p>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="space-y-2 font-mono text-sm text-slate-100">
                {step.outputLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
