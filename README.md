# RepoSphere

RepoSphere is a lightweight, Git-inspired version control system built from scratch.
It comes with its own CLI (`rs`), a FastAPI backend, and a web-based dashboard — giving you a complete, self-hosted platform for tracking, pushing, and pulling code.

---

## Installation

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/Diffusity/repoSphere/master/CLI/install.ps1 | iex
```

### macOS / Linux

```bash
curl -sSfL https://raw.githubusercontent.com/Diffusity/repoSphere/master/CLI/install.sh | bash
```

After installation, restart your terminal and verify:

```bash
rs --version
```

---

## Getting Started

### 1. Login

Authenticate with your RepoSphere account. This opens your browser and saves a session token locally.

```bash
rs login
```

> You can check who you're logged in as at any time with `rs user`, and sign out with `rs logout`.

### 2. Create a New Repository

Navigate to your project folder and initialize a new RS repository:

```bash
mkdir my-project && cd my-project
rs init
```

This creates a `.rs/` directory that holds all version control data for your project.

---

## Pushing to RepoSphere

### Step 1 — Add a Remote

Point your local repo to a remote repository on RepoSphere:

```bash
rs remote add origin <owner>/<repo>
```

For example:

```bash
rs remote add origin https://reposphere.vercel.app/john/my-project
```

> Use `rs remote` to list configured remotes, or `rs remote remove <name>` to remove one.

### Step 2 — Stage Your Files

Add files to the staging area. You can stage everything or pick specific files:

```bash
# Stage all files
rs add .

# Stage a specific file
rs add index.html

# Stage an entire directory
rs add src/
```

### Step 3 — Commit

Create a commit with a descriptive message:

```bash
rs commit -m "initial commit"
```

### Step 4 — Push

Push your committed changes to the `master` branch on the remote:

```bash
# Push to origin
rs push
```

> **Note:** Currently, RepoSphere only supports the `master` branch.

---

## Pulling from RepoSphere

Fetch and integrate changes from the remote `master` branch into your local repo:

```bash
# Pull from origin (default)
rs pull

# Pull from a specific remote
rs pull upstream
```

---

## Other Useful Commands

| Command | Description |
| --- | --- |
| `rs log` | View the commit history |
| `rs show <commit>` | Inspect a specific commit |
| `rs show -e <commit>` | Show per-file diffs for a commit |
| `rs diff` | Show unstaged changes (working tree vs index) |
| `rs diff --staged` | Show staged changes (index vs HEAD) |
| `rs reset <file>` | Unstage a file |
| `rs reset .` | Unstage all files |
| `rs user` | Display the currently logged-in user |
| `rs logout` | Sign out of RepoSphere |
