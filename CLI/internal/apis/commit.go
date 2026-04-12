package apis

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/Diffusity/repoSphere/internal/types"
	"github.com/Diffusity/repoSphere/utils"
)

func GetHeadCommitHash(owner, name, branchName string) (bool, string, error) {
	url := fmt.Sprintf("%s/api/v1/repo/%s/%s/branch/%s/head", utils.BACKEND_URL, owner, name, branchName)

	token := utils.GetSession().Token

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false, "", err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Terminal %s", token))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return false, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return false, "", fmt.Errorf("repository or branch not found on remote")
		}
		return false, "", fmt.Errorf("failed to get head commit: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, "", err
	}

	var headCommitApiBody types.HeadCommitApiBody
	err = json.Unmarshal(body, &headCommitApiBody)
	if err != nil {
		return false, "", err
	}

	if !headCommitApiBody.Success {
		return false, "", fmt.Errorf("failed to get head commit: %s", headCommitApiBody.Message)
	}

	if !headCommitApiBody.Data.Exists || headCommitApiBody.Data.HeadCommit == nil {
		return false, "", nil
	}

	return true, headCommitApiBody.Data.HeadCommit.Hash, nil
}
