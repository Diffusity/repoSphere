package cmd

import (
	"github.com/Diffusity/repoSphere/internal/auth"
	"github.com/spf13/cobra"
)

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Login to RepoSphere",
	Run: func(cmd *cobra.Command, args []string) {
		auth.Login()
	},
}

func init() {
	rootCmd.AddCommand(loginCmd)
}
