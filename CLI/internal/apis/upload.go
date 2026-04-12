package apis

import (
	"os"
	"path/filepath"
)

// PrepareBlobs reads referenced objects from local .rs/objects and returns them as a map
func PrepareBlobs(referencedHashes map[string]bool) (map[string][]byte, error) {
	blobs := make(map[string][]byte)
	objectsDir := filepath.Join(".rs", "objects")

	for hash := range referencedHashes {
		if len(hash) < 2 {
			continue
		}
		
		subdir := hash[:2]
		fileName := hash[2:]
		filePath := filepath.Join(objectsDir, subdir, fileName)

		data, err := os.ReadFile(filePath)
		if err != nil {
			// Skip if file doesn't exist
			continue
		}
		blobs[hash] = data
	}

	return blobs, nil
}
