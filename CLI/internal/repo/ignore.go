package repo

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

// IgnoreRules holds compiled ignore patterns
type IgnoreRules struct {
	patterns []ignorePattern
}

type ignorePattern struct {
	pattern string
	isDir   bool // pattern ends with /
	negate  bool // pattern starts with !
}

// LoadIgnoreRules reads .rsignore from the repository root
func LoadIgnoreRules(repoRoot string) *IgnoreRules {
	rules := &IgnoreRules{}

	ignorePath := filepath.Join(repoRoot, ".rsignore")
	file, err := os.Open(ignorePath)
	if err != nil {
		return rules // No .rsignore file, nothing to ignore
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		p := ignorePattern{}

		// Check for negation
		if strings.HasPrefix(line, "!") {
			p.negate = true
			line = line[1:]
		}

		// Check if it's a directory pattern
		if strings.HasSuffix(line, "/") {
			p.isDir = true
			line = strings.TrimSuffix(line, "/")
		}

		p.pattern = line
		rules.patterns = append(rules.patterns, p)
	}

	return rules
}

// ShouldIgnore checks if a relative path should be ignored.
// relPath should use forward slashes.
// isDir indicates whether the path is a directory.
func (r *IgnoreRules) ShouldIgnore(relPath string, isDir bool) bool {
	if r == nil || len(r.patterns) == 0 {
		return false
	}

	// Always ignore .rs directory
	if relPath == ".rs" || strings.HasPrefix(relPath, ".rs/") {
		return true
	}

	ignored := false

	for _, p := range r.patterns {
		// Directory patterns only match directories
		if p.isDir && !isDir {
			continue
		}

		matched := matchPattern(p.pattern, relPath, isDir)

		if matched {
			if p.negate {
				ignored = false
			} else {
				ignored = true
			}
		}
	}

	return ignored
}

// matchPattern checks if a path matches an ignore pattern
func matchPattern(pattern, relPath string, isDir bool) bool {
	// Normalize
	pattern = filepath.ToSlash(pattern)
	relPath = filepath.ToSlash(relPath)

	// If pattern contains a slash, it's a path-specific match
	if strings.Contains(pattern, "/") {
		matched, _ := filepath.Match(pattern, relPath)
		return matched
	}

	// Otherwise, match against the basename and any path segment
	basename := filepath.Base(relPath)

	// Direct basename match (e.g., "*.log" matches "debug.log" and "src/debug.log")
	matched, _ := filepath.Match(pattern, basename)
	if matched {
		return true
	}

	// Also try matching against each path component for directory patterns
	parts := strings.Split(relPath, "/")
	for _, part := range parts {
		if m, _ := filepath.Match(pattern, part); m {
			return true
		}
	}

	return false
}
