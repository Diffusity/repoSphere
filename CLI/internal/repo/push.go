package repo

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/Diffusity/repoSphere/internal/apis"
	"github.com/Diffusity/repoSphere/internal/storage"
	"github.com/Diffusity/repoSphere/internal/types"
	"github.com/Diffusity/repoSphere/utils"
)

func Push(remote string, branchName string) {
	// 1. Resolve Remote URL to owner/repo
	parsedURL, err := url.Parse(remote)
	if err != nil {
		fmt.Printf("Error: invalid remote URL: %v\n", err)
		return
	}
	pathParts := strings.Split(strings.Trim(parsedURL.Path, "/"), "/")
	if len(pathParts) < 2 {
		fmt.Printf("Error: remote URL must contain user and repo name (e.g., %s/user/repo)\n", utils.FRONTEND_URL)
		return
	}
	owner := pathParts[0]
	repoName := pathParts[1]

	// 2. Get Head Commit from Remote
	exists, remoteHeadHash, err := apis.GetHeadCommitHash(owner, repoName, branchName)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// 3. Get local commits to push
	localCommits, err := GetCommitsFromHead(branchName)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	var commitsToPush []types.Commit
	foundRemoteHead := !exists || (remoteHeadHash == "")

	for i := len(localCommits) - 1; i >= 0; i-- {
		commit := localCommits[i]
		if !foundRemoteHead {
			if commit.Tree == remoteHeadHash {
				foundRemoteHead = true
				continue
			}
			continue
		}
		commitsToPush = append(commitsToPush, commit)
	}

	if len(commitsToPush) == 0 {
		fmt.Println("Everything up-to-date")
		return
	}

	fmt.Printf("Pushing %d commits to %s/%s [%s]...\n", len(commitsToPush), owner, repoName, branchName)

	// 4. Collect referenced blobs and trees
	referencedBlobs := make(map[string]bool)
	treesToPush := make(map[string]map[string]string)

	for _, commit := range commitsToPush {
		treeEntries, err := GetTreeFromHash(commit.Tree)
		if err != nil {
			fmt.Printf("Error getting tree %s: %v\n", commit.Tree, err)
			return
		}
		
		for _, blobHash := range treeEntries {
			referencedBlobs[blobHash] = true
		}
		treesToPush[commit.Tree] = treeEntries
	}

	// 5. Prepare blobs
	blobs, err := apis.PrepareBlobs(referencedBlobs)
	if err != nil {
		fmt.Printf("Error preparing blobs: %v\n", err)
		return
	}

	// 6. Unified Push call
	err = apis.PushToRemote(owner, repoName, branchName, commitsToPush, treesToPush, blobs)
	if err != nil {
		fmt.Printf("Push failed: %v\n", err)
		return
	}

	fmt.Println("Done.")
}

// GetCommitsFromHead reads the commit log for the given branch
func GetCommitsFromHead(branchName string) ([]types.Commit, error) {
	branchLogPath := filepath.Join(".rs", "logs", "refs", "heads", branchName)
	data, err := os.ReadFile(branchLogPath)
	if err != nil {
		return nil, fmt.Errorf("could not read branch log: %v", err)
	}
	var commits []types.Commit
	if err := json.Unmarshal(data, &commits); err != nil {
		return nil, fmt.Errorf("could not parse branch log: %v", err)
	}
	return commits, nil
}

// GetTreeFromHash reads a tree object and returns its entries
func GetTreeFromHash(hash string) (map[string]string, error) {
	dataStr, err := storage.LoadObject(hash)
	if err != nil {
		return nil, fmt.Errorf("could not read tree object %s: %v", hash, err)
	}
	var tree types.Tree
	if err := json.Unmarshal([]byte(dataStr), &tree); err != nil {
		return nil, fmt.Errorf("could not parse tree object %s: %v", hash, err)
	}
	return tree.Entries, nil
}
