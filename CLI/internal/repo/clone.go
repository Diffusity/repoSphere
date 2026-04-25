package repo

import (
	"fmt"
)

// Clone orchestrates the clone process: init -> remote add -> pull
func Clone(remoteURL string) error {
	// 1. Initialize empty repo
	if err := InitRepo(); err != nil {
		return fmt.Errorf("failed to initialize repository: %v", err)
	}

	// 2. Add remote origin
	if err := AddRemote("origin", remoteURL); err != nil {
		return fmt.Errorf("failed to add remote: %v", err)
	}

	// 3. Pull from origin
	if err := Pull("origin"); err != nil {
		return fmt.Errorf("failed to pull from remote: %v", err)
	}

	return nil
}
