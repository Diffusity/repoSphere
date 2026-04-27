package auth

import (
	"fmt"
	"strings"
	"time"

	"github.com/Diffusity/repoSphere/internal/apis"
	"github.com/Diffusity/repoSphere/utils"
)

func Login() {
	existingSession := utils.GetSession()
	if existingSession != nil && existingSession.Email != "" && existingSession.Token != "" {
		fmt.Printf("Warning: you are already logged in as %s.\n", existingSession.Email)
		fmt.Print("Do you want to log in again? (y/N): ")
		var response string
		fmt.Scanln(&response)
		if response != "y" && response != "Y" {
			fmt.Println("Aborted.")
			return
		}
	}

	session, err := apis.CreateSessionApi()
	if err != nil {
		fmt.Println("Error in generating session:", err)
		return
	}

	url := fmt.Sprintf("%s/terminal?token=%s", utils.FRONTEND_URL, session.Token)
	fmt.Println("Opening browser:", url)
	utils.OpenBrowser(url)

	timeout := 5 * time.Minute
	endTime := time.Now().Add(timeout)
	sessionId := session.SessionId

	fmt.Println("Waiting for authentication...")
	for time.Now().Before(endTime) {
		time.Sleep(3 * time.Second)
		fmt.Print(".")

		data, err := apis.CheckSessionApi(sessionId)
		if err != nil {
			continue
		}

		switch data.Valid {
		case "active":
			if data.Token != "" {
				utils.SetSession(data.Email, data.Token)
				fmt.Printf("Logged in successfully with email %s\n", data.Email)
				return
			}

			fmt.Println("Try again later")
			return
		case "expired":
			fmt.Println("Session expired")
			return
		case "deleted":
			fmt.Println("Session deleted")
			return
		}
	}
}

func User() {
	session := utils.GetSession()
	if session == nil || session.Email == "" || session.Token == "" {
		fmt.Println("You are not logged in")
		return
	}

	fmt.Println("User:", session.Email)
}

func Logout() {
	session := utils.GetSession()
	if session != nil && session.Token != "" {
		err := apis.LogoutApi(session.Token)
		if err != nil {
			fmt.Printf("Warning: could not invalidate session on server: %v\n", err)
		}
	}

	utils.DeleteSession()
	fmt.Println("\nLogged out successfully")
}

func Auth(token string) {
	existingSession := utils.GetSession()
	if existingSession != nil && existingSession.Email != "" && existingSession.Token != "" {
		fmt.Printf("Warning: you are already logged in as %s.\n", existingSession.Email)
		fmt.Print("Do you want to replace the current session? (y/N): ")
		var response string
		fmt.Scanln(&response)
		if response != "y" && response != "Y" {
			fmt.Println("Aborted.")
			return
		}
	}

	data, err := apis.ActivateTerminalSessionApi(token)
	if err != nil {
		if strings.Contains(err.Error(), "status 404") {
			fmt.Println("This server does not support 'rs auth' yet.")
			fmt.Println("Deploy the updated backend from packages/server, or point RS_BACKEND_URL to a server with /api/v1/auth/session/cli/{token}.")
			fmt.Println("You can still use 'rs login' against the currently deployed server.")
			return
		}
		fmt.Println("Error in authenticating CLI token:", err)
		return
	}

	utils.SetSession(data.Email, data.Token)
	fmt.Printf("CLI authenticated successfully with email %s\n", data.Email)
}
