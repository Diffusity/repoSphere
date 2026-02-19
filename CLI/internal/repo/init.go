package repo

import (
	"fmt"
	"os"
	"path/filepath"
)

func InitRepo() error {
	//check if .rs already exists
	if _, err := os.Stat(".rs"); !os.IsNotExist(err) {
		return fmt.Errorf("repository already exists")
	}

	//create required folders
	dirs := []string{
		".rs",
		".rs/objects",
		".rs/refs/heads",
		".rs/logs/refs/heads",
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return err
		}
	}

	//create HEAD file
	headFilePath := filepath.Join(".rs", "HEAD")
	headRefFilePath := filepath.Join(".rs", "refs", "heads", "master")
	headLogRefFilePath := filepath.Join(".rs", "logs", "refs", "heads", "master")
	err := os.WriteFile(headFilePath, []byte("ref: refs/heads/master\n"), 0644)
	if err != nil {
		return err
	}
	err = os.WriteFile(headRefFilePath, []byte("0000000000000000000000000000000000000000"), 0644)
	if err != nil {
		return err
	}
	err = os.WriteFile(headLogRefFilePath, []byte("[]"), 0644)
	if err != nil {
		return err
	}
	return err
}
