package utils

import (
	"net"
	"net/http"
	"os"
	"time"
)

var BACKEND_URL = getBackendURL()
var FRONTEND_URL = getFrontendURL()

func init() {
	// Configure http.DefaultTransport to handle Render free tier cold starts
	http.DefaultTransport = &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   60 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		ForceAttemptHTTP2:     true,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   60 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}
}

func getBackendURL() string {
	if url := os.Getenv("RS_BACKEND_URL"); url != "" {
		return url
	}
	return "https://reposphere-backend-3pvn.onrender.com"
}

func getFrontendURL() string {
	if url := os.Getenv("RS_FRONTEND_URL"); url != "" {
		return url
	}
	return "https://reposphere.vercel.app"
}
