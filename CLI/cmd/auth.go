package cmd

import (
	"github.com/Diffusity/repoSphere/internal/auth"
	"github.com/spf13/cobra"
)

var authCmd = &cobra.Command{
	Use:   "auth [token]",
	Short: "Authenticate the CLI with a one-time token generated in the web app",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		auth.Auth(args[0])
	},
}

func init() {
	rootCmd.AddCommand(authCmd)
}
