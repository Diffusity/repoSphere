package apis

import (
	"fmt"
	"net/http"
	"time"
)

// maxRetries is the number of attempts for API calls to handle Render cold starts.
const maxRetries = 3

// httpClient is a shared client with a generous timeout for Render cold starts.
var httpClient = &http.Client{Timeout: 120 * time.Second}

// retryDo executes a request-building function with retry logic and exponential backoff
// to handle Render free tier cold starts (which cause "connection reset by peer" errors).
// The buildReq function is called on each attempt so that request bodies (e.g. multipart)
// are rebuilt fresh for each retry.
func retryDo(buildReq func() (*http.Request, error)) (*http.Response, error) {
	var resp *http.Response
	var err error

	for attempt := 1; attempt <= maxRetries; attempt++ {
		var req *http.Request
		req, err = buildReq()
		if err != nil {
			return nil, err
		}

		resp, err = httpClient.Do(req)
		if err == nil {
			return resp, nil
		}

		if attempt < maxRetries {
			backoff := time.Duration(attempt*5) * time.Second
			fmt.Printf("⏳ Server is waking up (attempt %d/%d), retrying in %v...\n", attempt, maxRetries, backoff)
			time.Sleep(backoff)
		}
	}

	return nil, fmt.Errorf("could not reach the server after %d attempts: %w\nHint: The server may be cold-starting. Please try again in a moment", maxRetries, err)
}
