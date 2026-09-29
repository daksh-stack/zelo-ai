REVISION_DECKS = {
    "dsa": [
        {"topic": "Two Sum", "front": "Optimal approach for Two Sum?", "back": "One-pass hashmap value→index. O(n) time, O(n) space.", "tag": "arrays"},
        {"topic": "Binary Search", "front": "Binary search complexity?", "back": "O(log n) on sorted array. Mid = lo + (hi-lo)//2 to avoid overflow.", "tag": "search"},
        {"topic": "BFS", "front": "When use BFS?", "back": "Shortest path in unweighted graph. Queue + visited. O(V+E).", "tag": "graphs"},
        {"topic": "DFS cycle", "front": "Detect cycle in directed graph?", "back": "DFS colors / recursion stack. Gray node edge ⇒ cycle.", "tag": "graphs"},
        {"topic": "Knapsack", "front": "0/1 knapsack recurrence?", "back": "dp[i][w] = max(dp[i-1][w], val[i]+dp[i-1][w-wt[i]]).", "tag": "dp"},
    ],
    "os": [
        {"topic": "Deadlock", "front": "Four Coffman conditions?", "back": "Mutual exclusion, hold and wait, no preemption, circular wait.", "tag": "sync"},
        {"topic": "Scheduling", "front": "What is convoy effect?", "back": "Short jobs stuck behind long FCFS job.", "tag": "cpu"},
        {"topic": "Paging", "front": "Internal vs external fragmentation?", "back": "Internal: waste inside block. External: holes between blocks.", "tag": "memory"},
    ],
    "dbms": [
        {"topic": "Normalization", "front": "3NF vs BCNF?", "back": "3NF allows non-key → non-key in some cases; BCNF requires every determinant to be a candidate key.", "tag": "design"},
        {"topic": "ACID", "front": "Dirty read?", "back": "Reading uncommitted data of another transaction.", "tag": "txn"},
        {"topic": "Index", "front": "Why B+ tree for DB indexes?", "back": "High fanout → fewer disk I/Os; leaves linked for range scans.", "tag": "storage"},
    ],
    "system_design": [
        {"topic": "Caching", "front": "Cache-aside pattern?", "back": "App reads cache; on miss loads DB and fills cache. App owns invalidation.", "tag": "cache"},
        {"topic": "Load balancer", "front": "L4 vs L7 LB?", "back": "L4: IP/port. L7: HTTP path/headers; smarter routing.", "tag": "traffic"},
        {"topic": "Consistency", "front": "Eventual consistency meaning?", "back": "Replicas converge over time if no new updates; may serve stale reads briefly.", "tag": "data"},
    ],
}

INTERVIEW_QUESTIONS = {
    "dsa": [
        {"q": "Explain time and space complexity of merge sort.", "a": "O(n log n) time always; O(n) auxiliary space for merging."},
        {"q": "How does a hash map handle collisions?", "a": "Chaining (lists/buckets) or open addressing (probing). Average O(1), worst O(n)."},
        {"q": "Detect a cycle in a linked list.", "a": "Floyd’s tortoise-hare: slow/fast pointers meet if cycle exists."},
        {"q": "Difference between BFS and DFS.", "a": "BFS uses queue, level-order, shortest unweighted path. DFS uses stack/recursion, path exploration."},
        {"q": "What is a stable sorting algorithm? Examples?", "a": "Preserves order of equal keys. Merge sort and insertion sort are stable; heapsort is not."},
    ],
    "backend": [
        {"q": "What is REST? Name constraints.", "a": "Stateless client-server over HTTP resources. Uniform interface, cacheable, layered system."},
        {"q": "Idempotent HTTP methods?", "a": "GET, PUT, DELETE are idempotent. POST is not. PATCH may or may not be."},
        {"q": "JWT vs session cookies?", "a": "JWT: self-contained, scalable, harder revoke. Sessions: server store, easy revoke, sticky/stateful."},
        {"q": "How do you prevent SQL injection?", "a": "Parameterized queries / ORM binds. Never string-concat user input into SQL."},
        {"q": "What is connection pooling?", "a": "Reuse DB connections to avoid handshake cost per request."},
    ],
    "frontend": [
        {"q": "Virtual DOM purpose?", "a": "Diff virtual trees and patch real DOM minimally for performance and declarative UI."},
        {"q": "Controlled vs uncontrolled inputs in React?", "a": "Controlled: value driven by state. Uncontrolled: DOM holds value via refs."},
        {"q": "What causes React re-renders?", "a": "State/props/context change. Memoization (memo, useMemo, useCallback) can reduce work."},
        {"q": "CORS in simple terms?", "a": "Browser blocks cross-origin responses unless server sends allowed origin headers."},
        {"q": "LocalStorage vs sessionStorage?", "a": "Local persists across tabs/sessions; session clears when tab closes. Both sync and size-limited."},
    ],
    "sde": [
        {"q": "Explain OOP pillars.", "a": "Encapsulation, abstraction, inheritance, polymorphism."},
        {"q": "Process vs thread.", "a": "Process: isolated address space. Thread: shared memory, lighter context switch."},
        {"q": "What is a race condition?", "a": "Outcome depends on timing of concurrent accesses to shared state without proper sync."},
        {"q": "Git rebase vs merge?", "a": "Merge preserves history with merge commit. Rebase replays commits for linear history; rewrite public branches carefully."},
        {"q": "Big-O of binary search.", "a": "O(log n) time, O(1) space iterative."},
    ],
    "system_design": [
        {"q": "How would you design a URL shortener?", "a": "API to create/redirect; base62 IDs; key-value store; cache hot links; analytics async."},
        {"q": "Horizontal vs vertical scaling?", "a": "Vertical: bigger machine. Horizontal: more nodes + load balancing; needs stateless app/shared data."},
        {"q": "What is a message queue for?", "a": "Decouple producers/consumers, buffer spikes, retry, async work (emails, indexing)."},
        {"q": "CDN role?", "a": "Edge cache static assets closer to users; lower latency and origin load."},
        {"q": "Single point of failure — how to avoid?", "a": "Redundancy, multi-AZ, replicas, health checks, no single broker/DB without failover."},
    ],
}