# Tutor in Claude Code

- Start the server with Bash, `run_in_background: true`.
- Arm the watcher with the Monitor tool, `timeout_ms: 1800000`, running
  `python3 tutor/watch.py --loop`. `--loop` keeps it running after the first message; without it
  the Monitor ends then. Keep the watcher in the Monitor, never the server: the Monitor is
  killed when it expires.
- The Monitor expires after thirty minutes. When it does, arm it again, after finishing any
  reply in progress; the panel shows the tutor as not listening in between.
- Read files with Read, write replies and notes with Write.
- To stop, stop the Monitor and the server (TaskStop).
