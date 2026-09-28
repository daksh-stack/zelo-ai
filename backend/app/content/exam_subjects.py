# Keep this file growing. Each topic is exam-ready content.
# Rule-based bank. No LLM in Phase 1. Fast, cheap, exam-night reliable.



SUBJECTS = {
    "os": {
        "label": "Operating Systems",
        "topics": [
            {
                "title": "Process vs Thread",
                "unit_name": "Processes",
                "importance": "must_know",
                "notes_summary": "Process = independent execution with own address space. Thread = lightweight unit sharing process memory. Context switch of threads is cheaper. Use threads for concurrency inside one app; processes for isolation.",
                "key_formulas": ["Context switch cost: process > thread", "PCB stores process state"],
                "likely_questions": [
                    {"q": "Difference between process and thread?", "a": "Process has own memory; threads share the process address space and are cheaper to create/switch."},
                    {"q": "Why is thread context switch faster?", "a": "No address-space switch; mostly register/stack switch."},
                ],
            },
            {
                "title": "CPU Scheduling",
                "unit_name": "Scheduling",
                "importance": "must_know",
                "notes_summary": "FCFS, SJF, SRTF, Priority, Round Robin. Convoy effect in FCFS. Aging avoids starvation. RR quantum too small → overhead; too large → FCFS.",
                "key_formulas": ["Waiting time = turnaround - burst", "Avg waiting time used to compare algorithms"],
                "likely_questions": [
                    {"q": "Which algorithm can cause starvation?", "a": "SJF and priority scheduling without aging."},
                    {"q": "What is convoy effect?", "a": "Short jobs wait behind a long FCFS job."},
                ],
            },
            {
                "title": "Deadlock",
                "unit_name": "Synchronization",
                "importance": "must_know",
                "notes_summary": "Coffman: mutual exclusion, hold and wait, no preemption, circular wait. Prevention vs avoidance (Banker's) vs detection.",
                "key_formulas": ["Deadlock iff all 4 Coffman conditions hold"],
                "likely_questions": [
                    {"q": "Four necessary conditions for deadlock?", "a": "Mutual exclusion, hold and wait, no preemption, circular wait."},
                    {"q": "Banker's algorithm is?", "a": "Deadlock avoidance using max/need/available matrices."},
                ],
            },
            {
                "title": "Memory Management & Paging",
                "unit_name": "Memory",
                "importance": "must_know",
                "notes_summary": "Logical vs physical address. Page table maps VPN→PFN. TLB caches translations. Internal vs external fragmentation.",
                "key_formulas": ["Physical address = frame*page_size + offset", "Number of pages = virtual_size / page_size"],
                "likely_questions": [
                    {"q": "Internal vs external fragmentation?", "a": "Internal: unused space inside allocated block. External: holes between allocated blocks."},
                ],
            },
            {
                "title": "Page Replacement",
                "unit_name": "Memory",
                "importance": "should_know",
                "notes_summary": "FIFO, LRU, Optimal, Clock. Belady's anomaly in FIFO. Working set.",
                "key_formulas": ["Page fault if page not in memory"],
                "likely_questions": [
                    {"q": "What is Belady's anomaly?", "a": "More frames can increase FIFO page faults."},
                ],
            },
            {
                "title": "Disk Scheduling",
                "unit_name": "IO",
                "importance": "low_priority",
                "notes_summary": "FCFS, SSTF, SCAN, C-SCAN, LOOK. SCAN is elevator.",
                "key_formulas": ["Seek time dominates disk access"],
                "likely_questions": [
                    {"q": "SCAN vs C-SCAN?", "a": "SCAN goes both ways; C-SCAN jumps to start and only scans one direction."},
                ],
            },
        ],
    },
    "dbms": {
        "label": "DBMS",
        "topics": [
            {
                "title": "ER Model & Keys",
                "unit_name": "Design",
                "importance": "must_know",
                "notes_summary": "Entity, relationship, attributes. Superkey, candidate, primary, foreign. Weak entity needs identifying relationship.",
                "key_formulas": ["Primary key ⊂ candidate keys ⊂ superkeys"],
                "likely_questions": [
                    {"q": "Candidate vs primary key?", "a": "All minimal unique keys are candidates; one chosen as primary."},
                ],
            },
            {
                "title": "Normalization (1NF–BCNF)",
                "unit_name": "Design",
                "importance": "must_know",
                "notes_summary": "1NF atomic. 2NF no partial. 3NF no transitive. BCNF every determinant is candidate key. Anomalies: insert/update/delete.",
                "key_formulas": ["X→Y is partial if X is proper subset of a candidate key"],
                "likely_questions": [
                    {"q": "Why 3NF may still have anomalies?", "a": "If a determinant is not a candidate key, BCNF is needed."},
                ],
            },
            {
                "title": "Transactions & ACID",
                "unit_name": "Transactions",
                "importance": "must_know",
                "notes_summary": "Atomicity, Consistency, Isolation, Durability. Dirty/nonrepeatable/phantom reads. Isolation levels.",
                "key_formulas": ["Schedule serializable ≈ conflict/view serializable"],
                "likely_questions": [
                    {"q": "Dirty read?", "a": "Reading uncommitted data of another transaction."},
                ],
            },
            {
                "title": "Concurrency Control",
                "unit_name": "Transactions",
                "importance": "should_know",
                "notes_summary": "2PL, timestamps, MVCC. Growing then shrinking phase in 2PL. Deadlock possible in 2PL.",
                "key_formulas": ["Conflict: RW, WR, WW on same item"],
                "likely_questions": [
                    {"q": "Strict 2PL?", "a": "Hold exclusive locks until commit; avoids cascading rollback."},
                ],
            },
            {
                "title": "Indexing & B+ Trees",
                "unit_name": "Storage",
                "importance": "should_know",
                "notes_summary": "Primary vs secondary index. B+ leaves linked. Clustered vs nonclustered.",
                "key_formulas": ["Height of B+ tree ≈ log_fanout(n)"],
                "likely_questions": [
                    {"q": "Why B+ tree over binary tree for disks?", "a": "High fanout → fewer disk I/Os."},
                ],
            },
            {
                "title": "SQL Joins & Nested Queries",
                "unit_name": "SQL",
                "importance": "low_priority",
                "notes_summary": "Inner, left/right/full outer, nested vs correlated subquery.",
                "key_formulas": ["Correlated subquery executes per outer row"],
                "likely_questions": [
                    {"q": "LEFT JOIN keeps?", "a": "All left rows; unmatched right as NULL."},
                ],
            },
        ],
    },
    "cn": {
        "label": "Computer Networks",
        "topics": [
            {
                "title": "OSI vs TCP/IP",
                "unit_name": "Intro",
                "importance": "must_know",
                "notes_summary": "OSI 7 layers vs TCP/IP 4. Encapsulation. PDU names.",
                "key_formulas": ["OSI: App-Pres-Sess-Trans-Net-DataLink-Phys"],
                "likely_questions": [
                    {"q": "Which OSI layers map to TCP/IP application?", "a": "Application + Presentation + Session."},
                ],
            },
            {
                "title": "TCP vs UDP",
                "unit_name": "Transport",
                "importance": "must_know",
                "notes_summary": "TCP: connection, reliable, flow/congestion control. UDP: datagram, no handshake. 3-way handshake, 4-way teardown.",
                "key_formulas": ["MSS, RTT, RTO", "cwnd growth: slow start exponential, CA linear"],
                "likely_questions": [
                    {"q": "Why 3-way handshake?", "a": "Synchronize ISNs both ways and confirm reachability."},
                ],
            },
            {
                "title": "IP Addressing & Subnetting",
                "unit_name": "Network",
                "importance": "must_know",
                "notes_summary": "CIDR, subnet mask, network/broadcast/hosts. Classful vs classless.",
                "key_formulas": ["Hosts = 2^(32-prefix) - 2"],
                "likely_questions": [
                    {"q": "How many hosts in /26?", "a": "2^6 - 2 = 62."},
                ],
            },
            {
                "title": "Routing (DV vs LS)",
                "unit_name": "Network",
                "importance": "should_know",
                "notes_summary": "RIP distance vector, OSPF link state. Count-to-infinity. Dijkstra vs Bellman-Ford.",
                "key_formulas": ["Bellman-Ford: d(v) = min(d(u)+w(u,v))"],
                "likely_questions": [
                    {"q": "Count to infinity problem?", "a": "Slow convergence in distance vector after link failure."},
                ],
            },
            {
                "title": "Sliding Window & ARQ",
                "unit_name": "Data Link",
                "importance": "should_know",
                "notes_summary": "Stop-and-wait, GBN, SR. Utilization of stop-and-wait = 1/(1+2a).",
                "key_formulas": ["a = Tp / Tt"],
                "likely_questions": [
                    {"q": "GBN vs SR?", "a": "GBN retransmits from lost seq; SR only lost frames, needs more receiver buffer."},
                ],
            },
            {
                "title": "DNS / HTTP / Congestion",
                "unit_name": "Application",
                "importance": "low_priority",
                "notes_summary": "DNS hierarchy, HTTP/1.1 vs 2, slow start, AIMD.",
                "key_formulas": ["AIMD: additive increase, multiplicative decrease"],
                "likely_questions": [
                    {"q": "Why multiplicative decrease?", "a": "React fast to congestion to protect the network."},
                ],
            },
        ],
    },
    "dsa": {
        "label": "DSA",
        "topics": [
            {
                "title": "Time Complexity & Recurrence",
                "unit_name": "Basics",
                "importance": "must_know",
                "notes_summary": "Big-O, Ω, Θ. Master theorem cases. Binary search O(log n).",
                "key_formulas": ["T(n)=aT(n/b)+f(n) Master theorem"],
                "likely_questions": [
                    {"q": "Complexity of merge sort?", "a": "O(n log n) time, O(n) extra space."},
                ],
            },
            {
                "title": "Arrays, Hashing, Two Pointers",
                "unit_name": "Linear",
                "importance": "must_know",
                "notes_summary": "Prefix sums, hashmap frequency, sliding window.",
                "key_formulas": ["Average hashmap ops O(1)"],
                "likely_questions": [
                    {"q": "Two-sum optimal approach?", "a": "One-pass hashmap of value→index."},
                ],
            },
            {
                "title": "Trees & BST",
                "unit_name": "Trees",
                "importance": "must_know",
                "notes_summary": "Traversals, height, BST property, LCA.",
                "key_formulas": ["Max nodes height h: 2^(h+1)-1"],
                "likely_questions": [
                    {"q": "Inorder of BST?", "a": "Sorted order."},
                ],
            },
            {
                "title": "Graphs (BFS/DFS)",
                "unit_name": "Graphs",
                "importance": "should_know",
                "notes_summary": "Adj list, BFS shortest unweighted, DFS cycle detect, topo sort.",
                "key_formulas": ["BFS O(V+E)"],
                "likely_questions": [
                    {"q": "Detect cycle in directed graph?", "a": "DFS with recursion stack / colors."},
                ],
            },
            {
                "title": "DP Intro",
                "unit_name": "DP",
                "importance": "should_know",
                "notes_summary": "Overlapping subproblems + optimal substructure. 0/1 knapsack, LIS.",
                "key_formulas": ["Knapsack: dp[i][w] = max(dp[i-1][w], v+dp[i-1][w-wt])"],
                "likely_questions": [
                    {"q": "When to use DP?", "a": "Optimal substructure + overlapping subproblems."},
                ],
            },
            {
                "title": "Heaps & Sorting",
                "unit_name": "Advanced",
                "importance": "low_priority",
                "notes_summary": "Heapify O(n), heapsort O(n log n), quicksort avg O(n log n) worst O(n^2).",
                "key_formulas": ["Build heap O(n)"],
                "likely_questions": [
                    {"q": "Worst case of quicksort?", "a": "O(n^2) on already sorted if pivot is extreme."},
                ],
            },
        ],
    },
    "coa": {
        "label": "Computer Organization",
        "topics": [
            {
                "title": "Number Systems & ALU",
                "unit_name": "Basics",
                "importance": "must_know",
                "notes_summary": "2's complement, overflow, Booth, restoring division outline.",
                "key_formulas": ["Range of n-bit 2's: -2^(n-1) to 2^(n-1)-1"],
                "likely_questions": [
                    {"q": "Overflow in 2's add?", "a": "Carry into sign ≠ carry out of sign."},
                ],
            },
            {
                "title": "Pipelining & Hazards",
                "unit_name": "CPU",
                "importance": "must_know",
                "notes_summary": "IF-ID-EX-MEM-WB. Structural, data, control hazards. Forwarding, stall, branch prediction.",
                "key_formulas": ["Speedup ≈ k / (1+stalls) for k stages ideal"],
                "likely_questions": [
                    {"q": "Data hazard types?", "a": "RAW, WAR, WAW. RAW is the common pipeline one."},
                ],
            },
            {
                "title": "Cache Memory",
                "unit_name": "Memory",
                "importance": "must_know",
                "notes_summary": "Direct, associative, set-assoc. Write through/back. Hit ratio.",
                "key_formulas": ["AMAT = hit_time + miss_rate * miss_penalty"],
                "likely_questions": [
                    {"q": "What is AMAT?", "a": "Average memory access time including misses."},
                ],
            },
            {
                "title": "Instruction Formats & Addressing",
                "unit_name": "ISA",
                "importance": "should_know",
                "notes_summary": "Immediate, direct, indirect, register, relative.",
                "key_formulas": ["Effective address depends on mode"],
                "likely_questions": [
                    {"q": "Relative addressing?", "a": "EA = PC + offset. Used for branches."},
                ],
            },
            {
                "title": "I/O & Interrupts",
                "unit_name": "IO",
                "importance": "low_priority",
                "notes_summary": "Programmed I/O, interrupt-driven, DMA.",
                "key_formulas": ["DMA frees CPU during bulk transfer"],
                "likely_questions": [
                    {"q": "DMA vs interrupt I/O?", "a": "DMA transfers blocks without CPU per byte."},
                ],
            },
        ],
    },
}


def normalize_subject(raw: str) -> str:
    s = raw.strip().lower()
    aliases = {
        "operating systems": "os",
        "operating system": "os",
        "os": "os",
        "dbms": "dbms",
        "database": "dbms",
        "computer networks": "cn",
        "cn": "cn",
        "networks": "cn",
        "dsa": "dsa",
        "data structures": "dsa",
        "coa": "coa",
        "computer organization": "coa",
        "system arch": "coa",
        "computer architecture": "coa",
    }
    if s in aliases:
        return aliases[s]
    if s in SUBJECTS:
        return s
    return s