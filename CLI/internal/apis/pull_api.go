package apis

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/Diffusity/repoSphere/internal/types"
	"github.com/Diffusity/repoSphere/utils"
)

func PullFromRemote(owner, name, localHead string) (*types.PullData, error) {
	url := fmt.Sprintf("%s/api/v1/repo/%s/%s/pull", utils.BACKEND_URL, owner, name)
	if localHead != "" {
		url += "?local_head=" + localHead
	}

	// Read token if it exists for optional authentication (e.g. for private repos)
	session := utils.GetSession()

	resp, err := retryDo(func() (*http.Request, error) {
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, err
		}
		if session.Token != "" {
			req.Header.Set("Authorization", "Terminal "+session.Token)
		}
		return req, nil
	})
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to pull: status %d, body: %s", resp.StatusCode, string(bodyBytes))
	}

	var apiResp types.PullResponseApiBody
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	if !apiResp.Success {
		return nil, fmt.Errorf("API error: pull failed")
	}

	return &apiResp.Data, nil
}
