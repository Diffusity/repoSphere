package apis

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"

	"github.com/Diffusity/repoSphere/internal/types"
	"github.com/Diffusity/repoSphere/utils"
)

func PushToRemote(owner, name string, branchName string, commits []types.Commit, trees map[string]map[string]string, blobs map[string][]byte) error {
	url := fmt.Sprintf("%s/api/v1/repo/%s/%s/push", utils.BACKEND_URL, owner, name)

	token := utils.GetSession().Token

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// metadata JSON
	metadata := map[string]interface{}{
		"branch":  branchName,
		"commits": commits,
		"trees":   trees,
	}
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return err
	}

	metadataPart, err := writer.CreateFormField("metadata")
	if err != nil {
		return err
	}
	metadataPart.Write(metadataJSON)

	// Files (blobs)
	if len(blobs) > 0 {
		for hash, data := range blobs {
			filePart, err := writer.CreateFormFile("files", hash)
			if err != nil {
				return err
			}
			filePart.Write(data)
		}
	}

	err = writer.Close()
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Terminal %s", token))
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("push failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var parsedResp map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &parsedResp); err == nil {
		if msg, ok := parsedResp["message"].(string); ok {
			fmt.Println("Server:", msg)
		}
	}

	return nil
}

func CreateRepository(name, description, visibility string) error {
	url := fmt.Sprintf("%s/api/v1/repo", utils.BACKEND_URL)
	token := utils.GetSession().Token

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("name", name)
	if description != "" {
		writer.WriteField("description", description)
	}
	writer.WriteField("visibility", visibility)

	writer.Close()

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Terminal %s", token))
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to create repository: %s", string(bodyBytes))
	}

	return nil
}
