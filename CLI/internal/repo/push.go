package repo

import (
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/Diffusity/repoSphere/internal/apis"
	"github.com/Diffusity/repoSphere/internal/types"
	"github.com/Diffusity/repoSphere/utils"
)

func Push(remoteName, branchName string) error {
	err := apis.UploadAllFiles()
	if err != nil {
		return err
	}

	config, err := utils.GetConfig()
	if err != nil {
		return err
	}

	remote := config.Remotes[remoteName].URL

	headExists, currentCommit, err := apis.GetHeadCommitHash(remote, branchName)
	if err != nil {
		return err
	}

	commits := []types.Commit{}
	branchLogPath := filepath.Join(".rs", "logs", "refs", "heads", branchName)
	branchLogFile, _ := os.ReadFile(branchLogPath)
	err = json.Unmarshal(branchLogFile, &commits)
	if err != nil {
		return err
	}

	apiCommits := []types.Commit{}

	if headExists {
		for i, commit := range commits {
			if commit.Tree == currentCommit {
				apiCommits = commits[i+1:]
				break
			}
		}
	} else {
		apiCommits = commits
	}

	err = apis.CreateCommit(remote, branchName, apiCommits)
	if err != nil {
		return err
	}

	remoteBranchDirPath := filepath.Join(".rs", "refs", "remotes", remoteName)
	err = os.MkdirAll(remoteBranchDirPath, 0755)
	if err != nil {
		return err
	}
	remoteBranchPath := filepath.Join(remoteBranchDirPath, branchName)
	err = os.WriteFile(remoteBranchPath, []byte(currentCommit), 0644)
	if err != nil {
		return err
	}

	remoteBranchLogDirPath := filepath.Join(".rs", "logs", "refs", "remotes", remoteName)
	err = os.MkdirAll(remoteBranchLogDirPath, 0755)
	if err != nil {
		return err
	}
	remoteBranchLogPath := filepath.Join(remoteBranchLogDirPath, branchName)
	remoteBranchLogData, err := json.Marshal(commits)
	if err != nil {
		return err
	}
	err = os.WriteFile(remoteBranchLogPath, remoteBranchLogData, 0644)
	if err != nil {
		return err
	}

	return nil
}
