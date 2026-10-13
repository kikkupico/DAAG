# Tutor in Antigravity

- Start the server with `run_command` and `IsDaemon: true`.
- Launch `python3 tutor/watch.py` (no `--loop`) with `run_command` as an asynchronous background
  task. It prints the first unanswered message and exits, which wakes you.
- After replying, launch the watcher again; the panel shows the tutor as not listening until you do.
- Read files with `view_file`, write replies and notes with `write_to_file`.
- To stop, use `manage_task` on the watcher and the server.
