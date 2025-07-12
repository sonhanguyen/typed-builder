# Typed Builder

A distributed task execution system with type safety.

## Architecture

This is a bun monorepo with the following structure:

- **`types.ts`** - Shared types and interfaces
- **`queue.ts`** - Task queue implementations
- **`packages/router/`** - Router server that orchestrates task distribution
- **`packages/shell-agent/`** - Shell command executor agent

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Build all packages:
   ```bash
   bun run build
   ```

3. Start the router server:
   ```bash
   cd packages/router
   bun run start
   ```

4. Start a shell agent worker:
   ```bash
   cd packages/shell-agent
   bun run start
   ```

## Usage

### Submit a task via API

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "task-1",
    "executor": "shell",
    "params": {
      "command": "echo Hello World"
    }
  }'
```

### Check task result

```bash
curl http://localhost:3000/tasks/task-1
```

### Monitor system

```bash
# Check registered agents
curl http://localhost:3000/agents

# Check queue status
curl http://localhost:3000/queue/status
```

## Environment Variables

### Router
- `PORT` - Server port (default: 3000)

### Shell Agent
- `SERVER_URL` - Router server URL (default: http://localhost:3000)
- `AGENT_ID` - Agent identifier (default: auto-generated)

## Development

Each package can be developed independently:

```bash
# Watch mode for router
cd packages/router && bun run dev

# Watch mode for shell agent
cd packages/shell-agent && bun run dev
```