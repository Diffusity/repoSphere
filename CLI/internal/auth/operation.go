package auth

import (
	"fmt"
	"time"

	"github.com/Diffusity/repoSphere/internal/apis"
	"github.com/Diffusity/repoSphere/utils"
)

func Login() {
	existingSession := utils.GetSession()
	if existingSession != nil && existingSession.Email != "" && existingSession.Token != "" {
		fmt.Printf("⚠️  You are already logged in as %s.\n", existingSession.Email)
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
		fmt.Println("Error in Generating Session:", err)
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
		fmt.Print(".") // Status indicator

		data, err := apis.CheckSessionApi(sessionId)
		if err != nil {
			continue
		}

		switch data.Valid {
		case "active":
			if data.Token != "" {
				utils.SetSession(data.Email, data.Token)
				fmt.Printf("✅ Logged in successfully with email %s\n", data.Email)
				return
			} else {
				fmt.Println("⚠️ Try again later")
				return
			}
		case "expired":
			fmt.Println("⚠️ Session expired")
			return
		case "deleted":
			fmt.Println("⚠️ Session deleted")
			return
		}
	}
}

func User() {
	session := utils.GetSession()
	if session == nil || session.Email == "" || session.Token == "" {
		fmt.Println("⚠️ You are not logged in")
		return
	} else {
		fmt.Println("User:", session.Email)
	}
}

func Logout() {
	session := utils.GetSession()
	if session != nil && session.Token != "" {
		err := apis.LogoutApi(session.Token)
		if err != nil {
			fmt.Printf("⚠️  Warning: Could not invalidate session on server: %v\n", err)
		}
	}

	utils.DeleteSession()
	fmt.Println("\n✅ Logged out successfully")
}
