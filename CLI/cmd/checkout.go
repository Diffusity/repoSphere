package cmd

import (
	"github.com/Diffusity/repoSphere/internal/repo"
	"github.com/spf13/cobra"
)

var checkoutCmd = &cobra.Command{
	Use:   "checkout <branch>",
	Short: "Switch to another branch",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		repo.Checkout(args[0])
	},
}

func init() {
	rootCmd.AddCommand(checkoutCmd)
}
