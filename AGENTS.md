# Agent Development Guidelines

## Code Style Guidelines
Use StandardJS for ts/js(x) file, no semicolon at the end of every line

### File Structure
- Domain and application should be in separate directories
- Colocate documentation (*.md) and tests with code, don't put them in different file trees

### Making changes
- Consider 3 types of artifact: code, requirements/docs and specs/tests. Try to only update one type of artifact at a time, then ask for user's confirmation to update the others.

### Checkpoints
- When asked to make a checkpoint, do not change the staged except adding a checkpoint file in the prompts directory, with the conversation dump. The name is in the format YYYY-MM-DDTHH:MM+ZZ.md.Try to preserve the original user prompts as opposed to rewriting them. Try not to duplicate information from previous checkpoint files. Try to use the same timezone on the timestamp if seen in other checkpoint file names.
- Commit, grab the commit hash, then add it as a first extension of the checkpoint file (<timestamp>.<hash>.md) and amend the last commit with it, so the checkpoint file has a hash of a commit that includes itself. Redact any secret or private information (such as home directory path).
