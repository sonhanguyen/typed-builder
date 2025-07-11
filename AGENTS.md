# Agent Development Guidelines

## Code Style Guidelines
- Must use StandardJS for ts/js(x) file, no semicolon at the end of every line
- Make use of typescript's namespaces to avoid repetitive prefixes and suffixes

### File Structure
- Domain and application must be in separate directories
- Colocate documentation (*.md) and tests with code, don't put them in different file trees

### Planing
- Whenever you come up with a plan, or change the plan, always update ROADMAP.md, put the tasks in a hierarchical structure, id them by numbers and refer to dependencies
- Put the tasks in the order of execution and resume from the top most, unchecked task.

### Making changes
- Consider 3 types of artifact: code, requirements/docs and specs/tests. Must only update one type of artifact at a time, then ask for user's confirmation to update the others.

### Checkpoints
- When asked to make a checkpoint, do not change the staged except adding a checkpoint file in the prompts directory, with the conversation dump as markdown. The name is the current timestamp in the format YYYY-MM-DDTHH:MM+ZZ. Preserve the original user prompts as opposed to rewriting them. Do not duplicate information from previous checkpoint files. Use the same timezone on the timestamp if seen in other checkpoint file names.
- Commit, grab the commit hash, then add it as the first extension of the checkpoint file (<timestamp>.<hash>.md). Amend the last commit with it, so the checkpoint file has a hash of a commit that includes itself. Redact any secret or private information (such as home directory path).
