package types

import "time"

// API response types

type HeadCommitApiBody struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    struct {
		Exists     bool `json:"exists"`
		HeadCommit *struct {
			Hash      string `json:"hash"`
			Message   string `json:"message"`
			Author    string `json:"author"`
			Timestamp string `json:"timestamp"`
		} `json:"headCommit"`
	} `json:"data"`
}

type PushResponseApiBody struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type RepoInfoApiBody struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    struct {
		ID         string `json:"id"`
		Name       string `json:"name"`
		Owner      string `json:"owner"`
		Visibility string `json:"visibility"`
	} `json:"data"`
}

type CreateSessionApiBody struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    struct {
		SessionId string `json:"sessionId"`
		Token     string `json:"token"`
	} `json:"data"`
}

type CheckSessionApiBody struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    struct {
		Valid string `json:"valid"`
		Token string `json:"token"`
		Email string `json:"email"`
	} `json:"data"`
}

type PullResponseApiBody struct {
	Success bool     `json:"success"`
	Data    PullData `json:"data"`
}

type PullData struct {
	Commits  []Commit                     `json:"commits"`
	Trees    map[string]map[string]string `json:"trees"`
	BlobUrls map[string]string            `json:"blob_urls"` // hash -> presigned URL
}

// Local data types

type Remote struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type RemoteConfig struct {
	Remotes map[string]Remote `json:"remotes"`
}

type Index struct {
	Entries map[string]string `json:"entries"` // file path -> object hash
	Changed bool              `json:"changed"`
}

type Tree struct {
	Entries map[string]string `json:"entries"` // file path -> object hash
	Parent  string            `json:"parent"`
}

type Commit struct {
	Hash      string    `json:"hash"`
	Tree      string    `json:"tree"`
	Parent    string    `json:"parent"`
	Message   string    `json:"message"`
	Author    string    `json:"author"`
	Timestamp time.Time `json:"timestamp"`
}
