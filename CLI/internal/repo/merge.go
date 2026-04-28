package repo

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Diffusity/repoSphere/internal/storage"
	"github.com/Diffusity/repoSphere/internal/types"
	"github.com/Diffusity/repoSphere/utils"
)

// Merge attempts to merge targetBranch into the current branch.
func Merge(targetBranch string) {
	repoRoot, err := utils.FindRepoRoot()
	if err != nil {
		fmt.Println("Not a rs repository")
		return
	}

	currentBranch, err := utils.GetBranch()
	if err != nil {
		fmt.Printf("Error getting current branch: %v\n", err)
		return
	}

	if currentBranch == targetBranch {
		fmt.Println("Cannot merge a branch into itself.")
		return
	}

	// Check if target branch exists
	targetRefPath := filepath.Join(repoRoot, ".rs", "refs", "heads", targetBranch)
	targetHashBytes, err := os.ReadFile(targetRefPath)
	if err != nil {
		fmt.Printf("Branch '%s' does not exist.\n", targetBranch)
		return
	}
	targetHash := strings.TrimSpace(string(targetHashBytes))

	// Get current branch HEAD
	currentHash, err := utils.GetHeadHash()
	if err != nil || currentHash == "" {
		fmt.Println("Error: Current branch has no commits.")
		return
	}

	if targetHash == currentHash {
		fmt.Println("Already up to date.")
		return
	}

	// Determine merge strategy
	if isAncestor(currentHash, targetHash) {
		// Fast-forward
		fmt.Printf("Fast-forward merge: %s -> %s\n", targetBranch, currentBranch)
		fastForwardMerge(repoRoot, currentBranch, targetBranch, targetHash)
	} else if isAncestor(targetHash, currentHash) {
		// Already up to date
		fmt.Println("Already up to date.")
	} else {
		// True merge commit with conflict detection
		createMergeCommit(repoRoot, currentBranch, targetBranch, currentHash, targetHash)
	}
}

// isAncestor checks if ancestorHash is an ancestor of descendantHash.
func isAncestor(ancestorHash, descendantHash string) bool {
	visited := make(map[string]bool)
	curr := descendantHash

	for curr != "" && !visited[curr] {
		if curr == ancestorHash {
			return true
		}
		visited[curr] = true

		// Load tree object to get parent (rs design stores parent in Tree)
		tree, err := loadTreeDataObj(curr)
		if err != nil {
			break
		}
		curr = tree.Parent
		if curr != "" {
			// Handle merge commits with multiple parents: just follow primary for simple check
			parts := strings.Split(curr, ",")
			curr = parts[0]
		}
	}
	return false
}

// findMergeBase finds the latest common ancestor of two commits.
func findMergeBase(hashA, hashB string) string {
	visitedA := make(map[string]bool)
	currA := hashA

	for currA != "" {
		visitedA[currA] = true
		treeA, err := loadTreeDataObj(currA)
		if err != nil {
			break
		}
		currA = treeA.Parent
		if currA != "" {
			parts := strings.Split(currA, ",")
			currA = parts[0]
		}
	}

	currB := hashB
	for currB != "" {
		if visitedA[currB] {
			return currB
		}
		treeB, err := loadTreeDataObj(currB)
		if err != nil {
			break
		}
		currB = treeB.Parent
		if currB != "" {
			parts := strings.Split(currB, ",")
			currB = parts[0]
		}
	}

	return ""
}

// fastForwardMerge updates current branch ref, log, and working tree to match target.
func fastForwardMerge(repoRoot, currentBranch, targetBranch, targetHash string) {
	// Update ref
	refPath := filepath.Join(repoRoot, ".rs", "refs", "heads", currentBranch)
	os.WriteFile(refPath, []byte(targetHash), 0644)

	// Update log
	currentLogPath := filepath.Join(repoRoot, ".rs", "logs", "refs", "heads", currentBranch)
	targetLogPath := filepath.Join(repoRoot, ".rs", "logs", "refs", "heads", targetBranch)

	targetLogData, err := os.ReadFile(targetLogPath)
	if err == nil {
		var targetCommits []types.Commit
		json.Unmarshal(targetLogData, &targetCommits)

		var currentCommits []types.Commit
		if currentLogData, err := os.ReadFile(currentLogPath); err == nil {
			json.Unmarshal(currentLogData, &currentCommits)
		}

		// Append missing commits from target
		existingHashes := make(map[string]bool)
		for _, c := range currentCommits {
			existingHashes[c.Hash] = true
		}

		for _, c := range targetCommits {
			if !existingHashes[c.Hash] {
				currentCommits = append(currentCommits, c)
			}
		}

		newLogData, _ := json.MarshalIndent(currentCommits, "", "  ")
		os.WriteFile(currentLogPath, newLogData, 0644)
	}

	// Update working tree
	currentTreeEntries := getCurrentTreeEntries(repoRoot)
	targetTreeEntries, _ := loadTreeData(targetHash)
	cleanWorkingTree(repoRoot, currentTreeEntries, targetTreeEntries)
	restoreTree(repoRoot, targetTreeEntries)
	InitializeIndex()
}

// createMergeCommit implements 3-way merge conflict detection and creates a merge commit.
func createMergeCommit(repoRoot, currentBranch, targetBranch, currentHash, targetHash string) {
	baseHash := findMergeBase(currentHash, targetHash)
	
	baseTreeEntries := make(map[string]string)
	if baseHash != "" {
		baseTreeEntries, _ = loadTreeData(baseHash)
	}
	currentTreeEntries, _ := loadTreeData(currentHash)
	targetTreeEntries, err := loadTreeData(targetHash)

	if err != nil {
		fmt.Printf("Error: Could not load target tree: %v\n", err)
		return
	}

	mergedEntries := make(map[string]string)
	var conflicts []string

	// Check for conflicts and build merged entries
	allPaths := make(map[string]bool)
	for p := range currentTreeEntries { allPaths[p] = true }
	for p := range targetTreeEntries { allPaths[p] = true }

	for path := range allPaths {
		baseVal := baseTreeEntries[path]
		currVal := currentTreeEntries[path]
		targetVal := targetTreeEntries[path]

		if currVal != baseVal && targetVal != baseVal && currVal != targetVal {
			// Both modified differently
			conflicts = append(conflicts, path)
		} else if currVal != baseVal {
			// Only current changed
			if currVal != "" {
				mergedEntries[path] = currVal
			}
		} else if targetVal != baseVal {
			// Only target changed
			if targetVal != "" {
				mergedEntries[path] = targetVal
			}
		} else {
			// No change
			if baseVal != "" {
				mergedEntries[path] = baseVal
			}
		}
	}

	if len(conflicts) > 0 {
		fmt.Println("Error: Merge conflict detected in the following files:")
		for _, f := range conflicts {
			fmt.Printf(" - %s\n", f)
		}
		fmt.Println("Merge aborted. Please resolve manually.")
		return
	}

	// Create merged tree object
	mergedTree := &types.Tree{
		Entries: mergedEntries,
		Parent:  currentHash, // Primary parent is current branch
	}
	mergedTreeHash, err := storeTreeObj(mergedTree)
	if err != nil {
		fmt.Printf("Error creating merge tree: %v\n", err)
		return
	}

	// Create merge commit with two parents
	author := os.Getenv("USER")
	if author == "" {
		author = os.Getenv("USERNAME")
	}

	mergeParent := currentHash + "," + targetHash
	commitHash := storage.Hash([]byte(mergedTreeHash + mergeParent + author + time.Now().String()))

	mergeMessage := fmt.Sprintf("Merge branch '%s' into %s", targetBranch, currentBranch)

	commit := types.Commit{
		Hash:      commitHash,
		Tree:      mergedTreeHash,
		Parent:    mergeParent,
		Message:   mergeMessage,
		Author:    author,
		Timestamp: time.Now(),
	}

	// Update branch log
	logPath := filepath.Join(repoRoot, ".rs", "logs", "refs", "heads", currentBranch)
	var commits []types.Commit
	if logData, err := os.ReadFile(logPath); err == nil {
		json.Unmarshal(logData, &commits)
	}

	// Append target branch commits first
	targetLogPath := filepath.Join(repoRoot, ".rs", "logs", "refs", "heads", targetBranch)
	if targetLogData, err := os.ReadFile(targetLogPath); err == nil {
		var targetCommits []types.Commit
		json.Unmarshal(targetLogData, &targetCommits)

		existingHashes := make(map[string]bool)
		for _, c := range commits {
			existingHashes[c.Hash] = true
		}

		for _, c := range targetCommits {
			if !existingHashes[c.Hash] {
				commits = append(commits, c)
			}
		}
	}

	commits = append(commits, commit)
	newLogData, _ := json.MarshalIndent(commits, "", "  ")
	os.WriteFile(logPath, newLogData, 0644)

	// Also store the commit object itself in the object store
	commitObjDelta, _ := json.MarshalIndent(commit, "", "  ")
	if err := storage.StoreObject(commitHash, string(commitObjDelta)); err != nil {
		fmt.Printf("Error storing merge commit object: %v\n", err)
	}

	// Update HEAD
	refPath := filepath.Join(repoRoot, ".rs", "refs", "heads", currentBranch)
	os.WriteFile(refPath, []byte(commitHash), 0644)

	// Update working tree
	cleanWorkingTree(repoRoot, currentTreeEntries, mergedEntries)
	restoreTree(repoRoot, mergedEntries)
	InitializeIndex()

	fmt.Println("Merge made by the 3-way merge strategy.")
}

func storeTreeObj(tree *types.Tree) (string, error) {
	data, err := json.MarshalIndent(tree, "", "  ")
	if err != nil {
		return "", err
	}
	hash := storage.Hash(data)
	err = storage.StoreObject(hash, string(data))
	return hash, err
}
