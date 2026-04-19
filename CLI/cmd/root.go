package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

// Version is set via ldflags at build time:
//
//	go build -ldflags "-X github.com/Diffusity/repoSphere/cmd.Version=v1.0"
var Version = "dev"

var rootCmd = &cobra.Command{
	Use:     "rs",
	Short:   "rs - a fast, minimal version control system",
	Long:    `RS is a lightweight version control system built in Go, inspired by Git.`,
	Version: Version,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		println(err)
		os.Exit(1)
	}
}
