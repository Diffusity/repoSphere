package cmd

import (
	"github.com/Diffusity/repoSphere/internal/repo"
	"github.com/spf13/cobra"
)

var mergeCmd = &cobra.Command{
	Use:   "merge [branch]",
	Short: "Join two or more development histories together",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		repo.Merge(args[0])
	},
}

func init() {
	rootCmd.AddCommand(mergeCmd)
}
