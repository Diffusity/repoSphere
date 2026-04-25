package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/Diffusity/repoSphere/internal/repo"
	"github.com/spf13/cobra"
)

var cloneCmd = &cobra.Command{
	Use:   "clone <url> [directory]",
	Short: "Clone a repository into a new directory",
	Args:  cobra.MinimumNArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		remoteURL := args[0]
		
		// Determine target directory
		var targetDir string
		if len(args) > 1 {
			targetDir = args[1]
		} else {
			// Extract repo name from URL
			// Example: https://reposphere.vercel.app/user/repo -> repo
			trimmedURL := strings.Trim(remoteURL, "/")
			parts := strings.Split(trimmedURL, "/")
			if len(parts) > 0 {
				targetDir = parts[len(parts)-1]
			} else {
				fmt.Println("Error: Could not determine target directory from URL")
				os.Exit(1)
			}
		}

		// 1. Check if directory exists
		if _, err := os.Stat(targetDir); !os.IsNotExist(err) {
			fmt.Printf("Error: Directory '%s' already exists\n", targetDir)
			os.Exit(1)
		}

		// 2. Create directory
		if err := os.MkdirAll(targetDir, 0755); err != nil {
			fmt.Printf("Error: Could not create directory '%s': %v\n", targetDir, err)
			os.Exit(1)
		}

		// 3. Save original directory and change to target
		originalDir, _ := os.Getwd()
		if err := os.Chdir(targetDir); err != nil {
			fmt.Printf("Error: Could not change to directory '%s': %v\n", targetDir, err)
			os.Exit(1)
		}

		// 4. Execute Clone logic
		fmt.Printf("Cloning into '%s'...\n", targetDir)
		err := repo.Clone(remoteURL)
		if err != nil {
			fmt.Printf("Error: %v\n", err)

			// Cleanup: remove the partially-created directory so user can retry
			os.Chdir(originalDir)
			os.RemoveAll(targetDir)
			os.Exit(1)
		}

		fmt.Printf("Successfully cloned %s into %s\n", remoteURL, targetDir)
	},
}

func init() {
	rootCmd.AddCommand(cloneCmd)
}
