# Repository instructions

## Code Review Rules

Apply these checks to every reviewed code change, including code produced by Claude or another coding agent. Review the changed code and relevant callers, queries, and configuration before reporting a finding.

### Security

- Flag exposed credentials, sensitive data in logs or responses, missing server-side authentication or authorization, broken tenant isolation, injection, unsafe handling of untrusted input, and insecure session or token handling.
- Explain the concrete attack path or data exposure and recommend the least-privilege fix. Never copy a secret's value into a review comment.

### N+1 queries and requests

- Flag database queries or remote requests executed once per item in loops, mapping callbacks, serializers, or component rendering when the call count grows with the collection size. Trace helper calls as well as direct calls.
- Recommend joins, eager loading, batching, bulk operations, or request-scoped deduplication while preserving authorization, tenant isolation, ordering, and pagination. Parallelizing per-item calls with Promise.all does not remove an N+1 pattern. Do not flag an intentional, documented, bounded per-item operation without explaining a material impact.

### Magic numbers

- Flag unexplained numeric literals used for business rules, timeouts, retries, limits, thresholds, prices, percentages, or unit conversions when their meaning or units are unclear or duplicated values could drift.
- Recommend a named constant with explicit units, or existing validated configuration when the value varies by tenant or environment. Preserve documented domain formulas and standard protocol values; do not flag obvious 0/1 values, ordinary indexes, or self-explanatory test fixtures merely for being literals.

### Findings

- Report actionable findings with the file and line, the triggering scenario, concrete impact, and a suggested fix. Assign severity based on actual impact; do not inflate a maintainability issue to a security or correctness defect.
- Keep these checks in scope for every review, even when the review's reporting threshold means a lower-severity finding is not posted.
