package cmd

import (
	"github.com/airbornharsh/hit/internal/repo"

	"github.com/spf13/cobra"
)

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize a new RS repository",
	Run: func(cmd *cobra.Command, args []string) {
		err := repo.InitRepo()
		if err != nil {
			println("Error:", err)
			return
		}
		println("Initialized empty RS repository in .rs/")
	},
}

func init() {
	rootCmd.AddCommand(initCmd)
}
