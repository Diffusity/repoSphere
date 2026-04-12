package apis

import (
	"os"
	"path/filepath"
)

// PrepareBlobs reads all objects from local .rs/objects and returns them as a map
func PrepareBlobs(referencedHashes map[string]bool) (map[string][]byte, error) {
	blobs := make(map[string][]byte)
	objectsDir := filepath.Join(".rs", "objects")

	entries, err := os.ReadDir(objectsDir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if !entry.IsDir() || len(entry.Name()) != 2 {
			continue
		}

		subdir := filepath.Join(objectsDir, entry.Name())
		files, err := os.ReadDir(subdir)
		if err != nil {
			continue
		}

		for _, file := range files {
			hash := entry.Name() + file.Name()
			
			// Only include if referenced in the current push
			if !referencedHashes[hash] {
				continue
			}

			data, err := os.ReadFile(filepath.Join(subdir, file.Name()))
			if err != nil {
				continue
			}
			blobs[hash] = data
		}
	}

	return blobs, nil
}
