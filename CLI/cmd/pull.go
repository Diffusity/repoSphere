package cmd

import (
	"fmt"
	"os"

	"github.com/Diffusity/repoSphere/internal/repo"
	"github.com/spf13/cobra"
)

var pullCmd = &cobra.Command{
	Use:   "pull [remote]",
	Short: "Fetch from and integrate with another repository or a local branch",
	Args:  cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		remote := "origin"
		if len(args) > 0 {
			remote = args[0]
		}

		err := repo.Pull(remote)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.AddCommand(pullCmd)
}
