package utils

import "os"

var BACKEND_URL = getBackendURL()
var FRONTEND_URL = getFrontendURL()

func getBackendURL() string {
	if url := os.Getenv("RS_BACKEND_URL"); url != "" {
		return url
	}
	return "http://localhost:6020" // dev default
}

func getFrontendURL() string {
	if url := os.Getenv("RS_FRONTEND_URL"); url != "" {
		return url
	}
	return "http://localhost:6021" // dev default
}
