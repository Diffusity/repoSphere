package types

import "time"

// API response types

type HeadCommitApiBody struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    struct {
		Exists     bool `json:"exists"`
		HeadCommit struct {
			ID        string `json:"_id"`
			Message   string `json:"message"`
			Author    string `json:"author"`
			Timestamp string `json:"timestamp"`
			Hash      string `json:"hash"`
			Parent    string `json:"parent"`
		} `json:"headCommit"`
	} `json:"data"`
}

type SignedUploadUrlApiBody struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    struct {
		SignedUrl string `json:"signedUrl"`
		PublicUrl string `json:"publicUrl"`
		Exists    bool   `json:"exists"`
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
	Tree      string    `json:"tree"`
	Parent    string    `json:"parent"`
	Message   string    `json:"message"`
	Author    string    `json:"author"`
	Timestamp time.Time `json:"timestamp"`
}
