package repo

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/Diffusity/repoSphere/internal/apis"
	"github.com/Diffusity/repoSphere/internal/storage"
	"github.com/Diffusity/repoSphere/internal/types"
	"github.com/Diffusity/repoSphere/utils"
)

func Pull(remoteName string) error {
	branchName, err := utils.GetBranch()
	if err != nil {
		return fmt.Errorf("failed to get current branch: %v", err)
	}

	remoteURL, err := GetRemoteURL(remoteName)
	if err != nil {
		return fmt.Errorf("failed to get remote %s: %v", remoteName, err)
	}

	// Resolve Remote URL to owner/repo
	parsedURL, err := url.Parse(remoteURL)
	if err != nil {
		return fmt.Errorf("invalid remote URL: %v", err)
	}
	pathParts := strings.Split(strings.Trim(parsedURL.Path, "/"), "/")
	if len(pathParts) < 2 {
		return fmt.Errorf("remote URL must contain user and repo name")
	}
	owner := pathParts[0]
	repoName := pathParts[1]

	// Get local head hash
	localHead, _ := utils.GetHeadHash()

	fmt.Printf("Fetching from %s/%s...\n", owner, repoName)
	pullData, err := apis.PullFromRemote(owner, repoName, localHead)
	if err != nil {
		return fmt.Errorf("pull failed: %v", err)
	}

	if len(pullData.Commits) == 0 {
		fmt.Println("Already up-to-date.")
		return nil
	}

	fmt.Printf("Downloading %d objects...\n", len(pullData.BlobUrls))

	// 1. Download blobs concurrently
	var wg sync.WaitGroup
	errCh := make(chan error, len(pullData.BlobUrls))
	sem := make(chan struct{}, 10) // Limit concurrency to 10

	for hash, presignedUrl := range pullData.BlobUrls {
		// Check if object already exists locally
		objPath := filepath.Join(".rs", "objects", hash[:2], hash[2:])
		if _, err := os.Stat(objPath); err == nil {
			continue // Object exists, skip
		}

		wg.Add(1)
		go func(hash, downloadUrl string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			resp, err := http.Get(downloadUrl)
			if err != nil {
				errCh <- fmt.Errorf("failed to download %s: %v", hash, err)
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				errCh <- fmt.Errorf("failed to download %s: status %d", hash, resp.StatusCode)
				return
			}

			bodyBytes, err := io.ReadAll(resp.Body)
			if err != nil {
				errCh <- fmt.Errorf("failed to read body for %s: %v", hash, err)
				return
			}

			if err := storage.WriteObject(hash, bodyBytes); err != nil {
				errCh <- fmt.Errorf("failed to save object %s: %v", hash, err)
				return
			}
		}(hash, presignedUrl)
	}

	wg.Wait()
	close(errCh)

	for err := range errCh {
		if err != nil {
			return fmt.Errorf("download error: %v", err)
		}
	}

	// 2. Store Trees
	for treeHash, entriesMap := range pullData.Trees {
		treeObj := types.Tree{
			Entries: entriesMap,
			Parent:  "",
		}
		data, err := json.Marshal(treeObj)
		if err != nil {
			return fmt.Errorf("failed to marshal tree %s: %v", treeHash, err)
		}
		if err := storage.WriteObject(treeHash, data); err != nil {
			return fmt.Errorf("failed to save tree object %s: %v", treeHash, err)
		}
	}

	// 3. Update Logs and Refs
	var existingCommits []types.Commit
	branchLogPath := filepath.Join(".rs", "logs", "refs", "heads", branchName)
	if existingData, err := os.ReadFile(branchLogPath); err == nil {
		json.Unmarshal(existingData, &existingCommits)
	}

	// Append new commits
	existingCommits = append(existingCommits, pullData.Commits...)

	// Save back to log
	newLogData, _ := json.Marshal(existingCommits)
	os.WriteFile(branchLogPath, newLogData, 0644)

	// Update HEAD ref
	latestCommit := pullData.Commits[len(pullData.Commits)-1]
	refPath := filepath.Join(".rs", "refs", "heads", branchName)
	os.WriteFile(refPath, []byte(latestCommit.Hash), 0644)

	// 4. Automatic Checkout
	fmt.Println("Updating working directory...")
	err = checkoutTree(latestCommit.Tree)
	if err != nil {
		return fmt.Errorf("failed to checkout code: %v", err)
	}

	fmt.Println("Pull completed successfully.")
	return nil
}

func checkoutTree(treeHash string) error {
	repoRoot, err := utils.FindRepoRoot()
	if err != nil {
		return err
	}

	dataStr, err := storage.LoadObject(treeHash)
	if err != nil {
		return err
	}

	var tree types.Tree
	if err := json.Unmarshal([]byte(dataStr), &tree); err != nil {
		return err
	}

	for path, blobHash := range tree.Entries {
		fullPath := filepath.Join(repoRoot, path)

		// Ensure directory exists
		if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
			return err
		}

		// Load blob content
		blobContent, err := storage.LoadObject(blobHash)
		if err != nil {
			return fmt.Errorf("failed to load blob %s for file %s: %v", blobHash, path, err)
		}

		// Write file
		if err := os.WriteFile(fullPath, []byte(blobContent), 0644); err != nil {
			return fmt.Errorf("failed to write file %s: %v", fullPath, err)
		}
	}

	// Update index.json
	indexFile := filepath.Join(repoRoot, ".rs", "index.json")
	index := types.Index{
		Entries: tree.Entries,
		Changed: false,
	}
	indexData, _ := json.Marshal(index)
	os.WriteFile(indexFile, indexData, 0644)

	return nil
}
