package cmd

import (
	"fmt"
	"os"

	"github.com/Diffusity/repoSphere/internal/repo"
	"github.com/Diffusity/repoSphere/utils"

	"github.com/spf13/cobra"
)

var pushCmd = &cobra.Command{
	Use:   "push",
	Short: "Push commits to a remote repository",
	Long:  `Push commits to a remote repository. Use 'rs push' to push the current branch to origin, 'rs push [branch]' to push a specific branch to origin, or 'rs push -u [REMOTENAME] [BRANCH]' to push and set upstream tracking.`,
	Run: func(cmd *cobra.Command, args []string) {
		if _, err := os.Stat(".rs"); os.IsNotExist(err) {
			fmt.Println("Error: Not a RS repository")
			return
		}

		var remoteName, branchName string

		if len(args) == 0 {
			remoteName = "origin"
			branchName = ""
		} else if len(args) >= 1 && args[0] == "-u" {
			if len(args) < 3 {
				fmt.Println("Usage: rs push -u [REMOTENAME] [BRANCH]")
				return
			}
			remoteName = args[1]
			branchName = args[2]
		} else if len(args) == 1 {
			remoteName = "origin"
			branchName = args[0]
		} else {
			fmt.Println("Usage: rs push | rs push [branch] | rs push -u [REMOTENAME] [BRANCH]")
			return
		}

		if branchName == "" {
			currentBranch, err := utils.GetBranch()
			if err != nil {
				fmt.Printf("Error getting current branch: %v\n", err)
				return
			}
			branchName = currentBranch
		}

		config, err := utils.GetConfig()
		if err != nil {
			fmt.Printf("Error loading config: %v\n", err)
			return
		}

		remoteObj, ok := config.Remotes[remoteName]
		if !ok {
			fmt.Printf("Error: remote '%s' not found\n", remoteName)
			return
		}

		repo.Push(remoteObj.URL, branchName)
	},
}

func init() {
	rootCmd.AddCommand(pushCmd)
}
