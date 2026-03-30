package apis

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"sync"

	"github.com/Diffusity/repoSphere/internal/types"
	"github.com/Diffusity/repoSphere/utils"
)

func UploadFile(hash string) (string, error) {
	filePath := filepath.Join(".rs", "objects", hash[:2], hash[2:])
	file, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	token := utils.GetSession().Token

	url := fmt.Sprintf(utils.BACKEND_URL+"/api/v1/repo/signed-url/%s", hash)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Terminal %s", token))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("API request failed with status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var signedUploadUrlApiBody types.SignedUploadUrlApiBody
	err = json.Unmarshal(body, &signedUploadUrlApiBody)
	if err != nil {
		return "", err
	}

	if !signedUploadUrlApiBody.Success {
		return "", fmt.Errorf("API request failed: %s", signedUploadUrlApiBody.Message)
	}

	if signedUploadUrlApiBody.Data.Exists {
		return signedUploadUrlApiBody.Data.PublicUrl, nil
	}

	req, err = http.NewRequest("PUT", signedUploadUrlApiBody.Data.SignedUrl, bytes.NewReader(file))
	if err != nil {
		return "", err
	}

	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("upload failed with status %d", resp.StatusCode)
	}

	return signedUploadUrlApiBody.Data.PublicUrl, nil
}

func UploadAllFiles() error {
	filePath := filepath.Join(".rs", "objects")
	hashRootEntries, err := os.ReadDir(filePath)
	if err != nil {
		fmt.Println("Error reading .rs/objects:", err)
		return err
	}

	fileChan := make(chan string)

	numWorkers := runtime.NumCPU() * 2
	if numWorkers < 4 {
		numWorkers = 4
	}

	var wg sync.WaitGroup

	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for hash := range fileChan {
				_, err := UploadFile(hash)
				if err != nil {
					fmt.Printf("Upload error for %s: %v\n", hash, err)
				}
			}
		}(i + 1)
	}

	go func() {
		defer close(fileChan)
		for _, entry := range hashRootEntries {
			path := filepath.Join(filePath, entry.Name())
			hashEntries, err := os.ReadDir(path)
			if err != nil {
				fmt.Println("Error reading subdir:", path, err)
				continue
			}
			for _, hashEntry := range hashEntries {
				fullHash := entry.Name() + hashEntry.Name()
				fileChan <- fullHash
			}
		}
	}()

	wg.Wait()
	fmt.Println("🚀 All uploads completed successfully.")
	return nil
}
