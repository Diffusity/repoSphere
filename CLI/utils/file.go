package utils

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/Diffusity/repoSphere/internal/types"
)

func FindRepoRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		rsDir := filepath.Join(dir, ".rs")
		if _, err := os.Stat(rsDir); err == nil {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			// Reached filesystem root
			return "", fmt.Errorf("not in a rs repository")
		}
		dir = parent
	}
}

func GetHead() (string, error) {
	headFilePath := filepath.Join(".rs", "HEAD")

	data, err := os.ReadFile(headFilePath)
	if err != nil {
		return "", err
	}
	location := strings.TrimSpace(strings.Split(string(data), "ref: ")[1])
	return location, nil
}

func GetHeadHash() (string, error) {
	location, err := GetHead()
	if err != nil {
		return "", nil
	}

	file, _ := os.ReadFile(filepath.Join(".rs", location))
	return string(file), nil
}

func GetBranch() (string, error) {
	location, err := GetHead()
	if err != nil {
		return "", err
	}

	segments := strings.Split(location, "/")
	return segments[len(segments)-1], nil
}

func GetCurrentCommit(branch string) (string, error) {
	filePath := filepath.Join(".rs", "refs", "heads", branch)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return "", fmt.Errorf("branch %s does not exist", branch)
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func GetConfig() (*types.RemoteConfig, error) {
	filePath := filepath.Join(".rs", "config")
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("config file does not exist")
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	var config types.RemoteConfig
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
