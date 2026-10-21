# Feed in Claude Code

- Start the server with Bash, `run_in_background: true`.
- Arm the watcher with the Monitor tool, `timeout_ms: 1800000`, running
  `python3 feed/watch.py --loop`. `--loop` keeps it running after the first request; without it
  the Monitor ends then. Keep the watcher in the Monitor, never the server: the Monitor is
  killed when it expires.
- The Monitor expires after thirty minutes. When it does, arm it again, after finishing any
  batch in progress; the page shows the writer as not listening in between, and a request made in
  between is printed again the moment the watcher is back.
- Read files with Read, and run `python3 feed/index.py --show ...` with Bash, one call per book,
  all in the same turn. Write each batch with one Write call to the `batch` path.
- To stop, stop the Monitor and the server (TaskStop).
