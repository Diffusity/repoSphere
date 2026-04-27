package cmd

import (
	"github.com/Diffusity/repoSphere/internal/repo"
	"github.com/spf13/cobra"
)

var deleteBranch string

var branchCmd = &cobra.Command{
	Use:   "branch [name]",
	Short: "List, create, or delete branches",
	Args:  cobra.MaximumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		if deleteBranch != "" {
			repo.DeleteBranch(deleteBranch)
			return
		}
		if len(args) == 0 {
			repo.ListBranches()
			return
		}
		repo.CreateBranch(args[0])
	},
}

func init() {
	branchCmd.Flags().StringVarP(&deleteBranch, "delete", "d", "", "Delete a branch")
	rootCmd.AddCommand(branchCmd)
}
