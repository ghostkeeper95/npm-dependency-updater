# npm-dependency-updater

CLI tool to update npm dependency versions across multiple GitHub repositories via the GitHub API.

## Features

- 🔄 Update a specific npm package version in multiple repositories
- 📦 Supports `dependencies`, `devDependencies`, and `peerDependencies`
- ✅ Validates package version exists on npm before updating
- 🌿 Creates a new branch for each update
- 🔀 Automatically opens a Pull Request
- ⏭️ Skips repositories where the version is already up to date
- 🧹 Cleans up existing branches before creating new ones

## Installation

```bash
npm install
```

## Configuration

### 1. GitHub Token

Create a `.env` file based on `.env.sample`:

```bash
cp .env.sample .env
```

Add your GitHub Personal Access Token with `repo` permissions:

```env
GITHUB_TOKEN=your_github_token_here
```

### 2. Target Repositories

Edit `repos.json` to specify which repositories to update:

```json
[
  {
    "repo": "owner/repo-1",
    "baseBranch": "main"
  },
  {
    "repo": "owner/repo-2",
    "baseBranch": "master"
  },
  {
    "repo": "owner/repo-3",
    "baseBranch": "develop"
  }
]
```

Each repository entry requires:
- `repo` - Repository in `owner/repo` format
- `baseBranch` - Branch to create PR against (defaults to `main` if omitted)

## Usage

```bash
npm run start <package-name> <version>
```

### Examples

```bash
# Update lodash to version 4.17.21
npm run start lodash 4.17.21

# Update react to version 18.2.0
npm run start react 18.2.0

# Update a scoped package
npm run start @octokit/rest 21.0.0
```

### Output

```
   → Checking if lodash@4.17.21 exists on npm...
✅ Found lodash@4.17.21 on npm
ℹ️  Updating lodash to 4.17.21 in 2 repo(s)...

📦 owner/repo-1
   → Fetching package.json...
   → Updating lodash to 4.17.21...
   → Creating branch: deps/update-lodash-4.17.21
   → Committing changes...
✅ Pull Request created: https://github.com/owner/repo-1/pull/1

📦 owner/repo-2
   → Fetching package.json...
   → Updating lodash to 4.17.21...
⚠️  lodash is already at version 4.17.21, skipping...

📦 === Summary ===
✅ Successful: 1
   owner/repo-1
⚠️  Skipped: 1
   owner/repo-2: already up to date
ℹ️  Done!
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Run the CLI tool |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run typecheck` | Type-check without emitting files |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint source files |
| `npm run lint:fix` | Lint and fix source files |
| `npm run format` | Format source files with Prettier |
| `npm run format:check` | Check formatting |

## Project Structure

```
src/
├── modules/
│   ├── github/          # GitHub API operations
│   │   ├── index.ts
│   │   ├── github.ts
│   │   └── types.ts
│   ├── npm/             # npm registry operations
│   │   ├── index.ts
│   │   └── npm.ts
│   ├── dependency/      # Dependency version logic
│   │   ├── index.ts
│   │   ├── dependency.ts
│   │   └── types.ts
│   └── logger/          # Console logging utilities
│       └── index.ts
├── types/               # Global types
│   └── index.ts
├── config.ts            # Configuration loading
└── index.ts             # CLI entry point

tests/
├── dependency.test.ts   # Dependency update tests
└── npm.test.ts          # npm registry tests
```

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **@octokit/rest** - GitHub API client
- **dotenv** - Environment variable management
- **Vitest** - Testing framework
- **ESLint + Prettier** - Code linting and formatting
- **tsx** - TypeScript execution

## License

ISC
