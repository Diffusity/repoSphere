package repo

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/Diffusity/repoSphere/internal/storage"
	"github.com/Diffusity/repoSphere/utils"
)

// ListBranches lists all local branches, marking the current one with *.
func ListBranches() {
	repoRoot, err := utils.FindRepoRoot()
	if err != nil {
		fmt.Println("Not a rs repository")
		return
	}

	currentBranch, _ := utils.GetBranch()
	refsDir := filepath.Join(repoRoot, ".rs", "refs", "heads")

	entries, err := os.ReadDir(refsDir)
	if err != nil {
		fmt.Println("Error reading branches:", err)
		return
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if name == currentBranch {
			fmt.Printf("* %s\n", name)
		} else {
			fmt.Printf("  %s\n", name)
		}
	}
}

// CreateBranch creates a new branch pointing to the current HEAD commit.
func CreateBranch(name string) {
	repoRoot, err := utils.FindRepoRoot()
	if err != nil {
		fmt.Println("Not a rs repository")
		return
	}

	// Validate branch name (Git-like rules)
	if strings.ContainsAny(name, " \t\n/\\") || strings.Contains(name, "..") || name == "" {
		fmt.Println("Error: Invalid branch name")
		return
	}

	// Check if branch already exists
	refPath := filepath.Join(repoRoot, ".rs", "refs", "heads", name)
	if _, err := os.Stat(refPath); err == nil {
		fmt.Printf("Error: Branch '%s' already exists\n", name)
		return
	}

	// Get current HEAD hash
	headHash, err := utils.GetHeadHash()
	if err != nil || headHash == "" || headHash == "0000000000000000000000000000000000000000" {
		fmt.Println("Error: No commits yet. Commit first before creating branches.")
		return
	}

	// Create branch ref pointing to current HEAD
	if err := os.WriteFile(refPath, []byte(headHash), 0644); err != nil {
		fmt.Printf("Error creating branch: %v\n", err)
		return
	}

	// Create branch log (copy current branch's log)
	currentBranch, _ := utils.GetBranch()
	currentLogPath := filepath.Join(repoRoot, ".rs", "logs", "refs", "heads", currentBranch)
	newLogPath := filepath.Join(repoRoot, ".rs", "logs", "refs", "heads", name)

	if logData, err := os.ReadFile(currentLogPath); err == nil {
		os.WriteFile(newLogPath, logData, 0644)
	} else {
		os.WriteFile(newLogPath, []byte("[]"), 0644)
	}

	fmt.Printf("Created branch '%s' at %s\n", name, headHash[:8])
}

// DeleteBranch deletes a local branch by name.
func DeleteBranch(name string) {
	repoRoot, err := utils.FindRepoRoot()
	if err != nil {
		fmt.Println("Not a rs repository")
		return
	}

	currentBranch, _ := utils.GetBranch()
	if name == currentBranch {
		fmt.Printf("Error: Cannot delete current branch '%s'\n", name)
		return
	}

	refPath := filepath.Join(repoRoot, ".rs", "refs", "heads", name)
	if _, err := os.Stat(refPath); os.IsNotExist(err) {
		fmt.Printf("Error: Branch '%s' does not exist\n", name)
		return
	}

	os.Remove(refPath)
	logPath := filepath.Join(repoRoot, ".rs", "logs", "refs", "heads", name)
	os.Remove(logPath)

	fmt.Printf("Deleted branch '%s'\n", name)
}

// Checkout switches to a different branch, restoring the working tree.
func Checkout(name string) {
	repoRoot, err := utils.FindRepoRoot()
	if err != nil {
		fmt.Println("Not a rs repository")
		return
	}

	// Check branch exists
	refPath := filepath.Join(repoRoot, ".rs", "refs", "heads", name)
	if _, err := os.Stat(refPath); os.IsNotExist(err) {
		fmt.Printf("Error: Branch '%s' does not exist\n", name)
		return
	}

	currentBranch, _ := utils.GetBranch()
	if name == currentBranch {
		fmt.Printf("Already on '%s'\n", name)
		return
	}

	// Load current branch's tree entries (to know what to clean)
	currentTreeEntries := getCurrentTreeEntries(repoRoot)

	// Update HEAD to point to new branch
	headPath := filepath.Join(repoRoot, ".rs", "HEAD")
	headContent := fmt.Sprintf("ref: refs/heads/%s\n", name)
	if err := os.WriteFile(headPath, []byte(headContent), 0644); err != nil {
		fmt.Printf("Error: Could not switch branch: %v\n", err)
		return
	}

	// Read target branch's commit hash
	branchHash, _ := os.ReadFile(refPath)
	targetHash := strings.TrimSpace(string(branchHash))

	if targetHash != "" && targetHash != "0000000000000000000000000000000000000000" {
		// Load the target commit's tree
		targetTreeEntries, err := loadTreeData(targetHash)
		if err != nil {
			fmt.Printf("Warning: Could not load target tree: %v\n", err)
		} else {
			// Git-like cleanup: remove files from old branch that don't exist in target
			cleanWorkingTree(repoRoot, currentTreeEntries, targetTreeEntries)

			// Restore files from target branch's tree
			err = restoreTree(repoRoot, targetTreeEntries)
			if err != nil {
				fmt.Printf("Warning: Could not restore working tree: %v\n", err)
			}
		}
	} else {
		// Target branch has no commits — clean tracked files
		cleanWorkingTree(repoRoot, currentTreeEntries, map[string]string{})
	}

	// Re-initialize the index to match the new branch state
	InitializeIndex()

	fmt.Printf("Switched to branch '%s'\n", name)
}

// getCurrentTreeEntries loads the current HEAD commit's tree entries.
func getCurrentTreeEntries(repoRoot string) map[string]string {
	headHash, err := utils.GetHeadHash()
	if err != nil || headHash == "" || headHash == "0000000000000000000000000000000000000000" {
		return map[string]string{}
	}

	entries, err := loadTreeData(headHash)
	if err != nil {
		return map[string]string{}
	}
	return entries
}

// loadTreeData loads a commit's tree object and returns file_path -> blob_hash.
// The commit hash points to a tree object stored in .rs/objects/.
func loadTreeData(commitTreeHash string) (map[string]string, error) {
	dataStr, err := storage.LoadObject(commitTreeHash)
	if err != nil {
		return nil, fmt.Errorf("could not load tree object %s: %v", commitTreeHash, err)
	}

	var tree Tree
	if err := json.Unmarshal([]byte(dataStr), &tree); err != nil {
		return nil, fmt.Errorf("could not parse tree object %s: %v", commitTreeHash, err)
	}

	return tree.Entries, nil
}

// loadBlobContent reads blob content from the object store.
func loadBlobContent(blobHash string) ([]byte, error) {
	dataStr, err := storage.LoadObject(blobHash)
	if err != nil {
		return nil, fmt.Errorf("could not load blob %s: %v", blobHash, err)
	}
	return []byte(dataStr), nil
}

// cleanWorkingTree removes files that are in oldEntries but not in newEntries.
// This matches Git's checkout behavior — files unique to the old branch are deleted.
func cleanWorkingTree(repoRoot string, oldEntries, newEntries map[string]string) {
	for filePath := range oldEntries {
		if _, exists := newEntries[filePath]; !exists {
			absPath := filepath.Join(repoRoot, filepath.FromSlash(filePath))
			if err := os.Remove(absPath); err == nil {
				// Clean up empty parent directories
				cleanEmptyParents(filepath.Dir(absPath), repoRoot)
			}
		}
	}
}

// cleanEmptyParents removes empty directories up to repoRoot.
func cleanEmptyParents(dir string, repoRoot string) {
	for dir != repoRoot {
		entries, err := os.ReadDir(dir)
		if err != nil || len(entries) > 0 {
			return
		}
		os.Remove(dir)
		dir = filepath.Dir(dir)
	}
}

// restoreTree writes files from tree entries to the working directory.
func restoreTree(repoRoot string, entries map[string]string) error {
	for filePath, blobHash := range entries {
		absPath := filepath.Join(repoRoot, filepath.FromSlash(filePath))

		// Create parent directories
		dir := filepath.Dir(absPath)
		os.MkdirAll(dir, 0755)

		// Read blob from object store
		content, err := loadBlobContent(blobHash)
		if err != nil {
			fmt.Printf("  Warning: Could not restore %s: %v\n", filePath, err)
			continue
		}

		os.WriteFile(absPath, content, 0644)
	}
	return nil
}
