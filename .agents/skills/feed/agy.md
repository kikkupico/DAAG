# Feed in Antigravity

- Start the server with `run_command` and `IsDaemon: true`.
- Launch `python3 feed/watch.py` (no `--loop`) with `run_command` as an asynchronous background
  task. It prints the first open request and exits, which wakes you.
- After writing a batch, launch the watcher again; the page shows the writer as not listening until you do.
- Run `python3 feed/index.py --show ...` with `run_command`, one call per book. Read files with
  `view_file`; write each batch with one `write_to_file` call to the `batch` path.
- To stop, use `manage_task` on the watcher and the server.
