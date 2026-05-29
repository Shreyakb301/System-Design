import { Card, CardContent } from "@/components/ui/card";
import { HashTableVisual } from "@/components/visuals/HashTableVisual";

const whyRows = [
  {
    aspect: 'Find "apple"',
    array: "Scan every element until found",
    hash: "hash('apple') -> index 3 -> done",
  },
  {
    aspect: "Time",
    array: "O(n) - grows with size",
    hash: "O(1) average - constant regardless",
  },
  {
    aspect: "How",
    array: "Compare each element",
    hash: "Jump directly to the right bucket",
  },
  {
    aspect: "Why it matters",
    array: "Slow at scale",
    hash: "1M items or 10 items - same speed",
  },
];

const comparisonRows = [
  {
    aspect: "Collision handling",
    chaining: "Append to a list in the same bucket",
    probing: "Walk forward to the next open slot",
  },
  {
    aspect: "Lookup cost at high load",
    chaining: "O(k) - scan the chain",
    probing: "O(k) - follow the probe sequence",
  },
  {
    aspect: "Clustering",
    chaining: "No - each bucket is independent",
    probing: "Yes - nearby buckets fill together",
  },
  {
    aspect: "Delete",
    chaining: "Remove from chain directly",
    probing: "Needs tombstone markers",
  },
  {
    aspect: "Best when",
    chaining: "Load factor is unpredictable",
    probing: "Memory locality matters",
  },
];

const takeaways = [
  "A hash function converts any key into an array index - that is what makes O(1) lookup possible.",
  "Collisions are inevitable - there are infinite keys but finite buckets. The collision strategy is the design decision.",
  "Chaining keeps collided items in a list at the same bucket. Linear probing walks forward to find an open slot.",
  "Load factor = items / buckets. Above 0.75, collisions degrade O(1) toward O(n). Rehash before that happens.",
  "Rehashing is O(n) but amortized O(1) per insert - the cost is spread across all future operations.",
];

export function HashTablesLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="rounded-[1.5rem] border bg-muted/40 p-6">
          <div className="space-y-3">
            <p className="max-w-4xl leading-7 text-foreground">
              You need to look up, insert, or check existence by key in constant time.
              If you are writing a nested loop to find a match - stop. A hash table does
              it in one pass.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            The hash function is what turns scanning into direct access
          </h2>
          <p className="leading-7 text-muted-foreground">
            A hash table exists so you can jump to the right bucket instead of scanning an
            entire unsorted array. The key idea is not the array itself - it is the hash
            function that converts a key into a bucket index.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">Unsorted Array</th>
                <th className="px-4 py-3 font-semibold">Hash Table</th>
              </tr>
            </thead>
            <tbody>
              {whyRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.array}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm leading-7 text-muted-foreground">
          The hash function is the trick - it converts any key into a number, and that
          number tells you exactly where to look.
        </p>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            Watch hashing, collisions, and rehashing happen step by step
          </h2>
          <p className="leading-7 text-muted-foreground">
            The card below demonstrates all three behaviors explicitly: how a key becomes
            a bucket index, how two collision strategies react to the same clash, and why
            load factor eventually forces a rehash.
          </p>
        </div>

        <HashTableVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            Chaining and probing pay the same collision cost differently
          </h2>
          <p className="leading-7 text-muted-foreground">
            Both strategies start with the same hash result. The design difference is what
            they do next when that bucket is already occupied.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 font-semibold">Aspect</th>
                <th className="px-4 py-3 font-semibold">Chaining</th>
                <th className="px-4 py-3 font-semibold">Linear Probing</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.aspect} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.chaining}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.probing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">The short version</h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-3 text-sm text-muted-foreground">
              {takeaways.map((takeaway) => (
                <li key={takeaway} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
