import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HashTableVisual } from "@/components/visuals/HashTableVisual";

const comparisonRows = [
  {
    aspect: "Collision handling",
    chaining: "Store multiple keys in the same bucket as a short linked list or array.",
    probing: "Search for another open bucket by following a probe sequence.",
  },
  {
    aspect: "What you see in the demo",
    chaining: "A crowded bucket grows a visible chain.",
    probing: "The highlighted path steps across buckets until it finds an open slot.",
  },
  {
    aspect: "Delete behavior",
    chaining: "Delete the matching item from its bucket chain.",
    probing: "Delete from the probed slot, while remembering real implementations often need tombstones.",
  },
  {
    aspect: "Tradeoff",
    chaining: "Simpler collision handling, but buckets can become uneven.",
    probing: "Keeps data inside the table itself, but clustering can slow lookups.",
  },
];

const takeaways = [
  "A hash table turns a key into an array index with a hash function.",
  "Different keys can still land on the same index, which creates a collision.",
  "Chaining and linear probing solve the same collision problem in different ways.",
  "Good hashing plus low load factor keeps insert, search, and delete close to O(1) on average.",
];

export function HashTablesLesson() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-12">
      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Associative Lookup</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Hash tables turn keys into bucket positions
          </h2>
          <p className="leading-7 text-muted-foreground">
            A hash table uses a hash function to convert a key like{" "}
            <code className="rounded bg-muted px-1 py-0.5">&quot;apple&quot;</code> into an array
            index. That lets lookups jump to a small part of the table instead of scanning
            every stored item. The main design challenge is handling collisions, where two
            different keys map to the same bucket.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>How to read the demo</CardTitle>
              <CardDescription>
                Watch the hash result first, then watch what the collision strategy does.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The key is hashed into one bucket index. The highlighted path shows where
                the algorithm is looking or inserting.
              </p>
              <p>
                In <strong>Chaining</strong>, collisions collect inside the same bucket. In{" "}
                <strong>Linear Probing</strong>, the algorithm walks through later buckets
                until it finds space.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to try in the demo</CardTitle>
              <CardDescription>
                Use the same key operations and compare how each strategy reacts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Insert a few keys, then search for one that exists and one that does not.
              </p>
              <p>
                Switch between <strong>Chaining</strong> and{" "}
                <strong>Linear Probing</strong> to see how collision handling changes the
                table layout.
              </p>
              <p>
                Press <strong>Delete</strong> and <strong>Reset</strong> to replay the same
                ideas from a clean table.
              </p>
            </CardContent>
          </Card>
        </div>

        <HashTableVisual />
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <Badge variant="outline">Collision Strategies</Badge>
          <h2 className="text-2xl font-bold tracking-tight">
            Chaining and probing handle collisions differently
          </h2>
          <p className="leading-7 text-muted-foreground">
            Both strategies start from the same hash result. The difference is what
            happens next when that bucket is already occupied.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Chaining</CardTitle>
              <CardDescription>
                Keep collided items together in the same bucket.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Easy to reason about because the bucket index never changes.</p>
              <p>Search may need to scan the short chain inside one bucket.</p>
              <p>Works well when the load factor stays moderate.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linear probing</CardTitle>
              <CardDescription>
                Keep moving through the table until an open slot appears.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Stores everything directly in the table array.</p>
              <p>Clusters can form when many nearby buckets are occupied.</p>
              <p>The probe path becomes part of the search cost.</p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
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
          <Badge variant="outline">Key Takeaways</Badge>
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
