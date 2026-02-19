package storage

import (
	"compress/zlib"
	"io"
	"os"
	"path/filepath"

	"github.com/Diffusity/repoSphere/utils"
)

// compresses and stores object in .rs/objects
func WriteObject(hash string, content []byte) error {
	dir := filepath.Join(".rs", "objects", hash[:2])
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	filePath := filepath.Join(dir, hash[2:])
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := zlib.NewWriter(file)
	defer writer.Close()

	_, err = writer.Write(content)
	if err != nil {
		return err
	}

	return nil
}

func LoadObject(hash string) (string, error) {
	_, _, filePath, err := utils.HashInfo(hash)
	if err != nil {
		return "", err
	}

	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	//create zlib reader directly from the file
	reader, err := zlib.NewReader(file)
	if err != nil {
		return "", err
	}
	defer reader.Close()

	//read and decompress the content
	decompressed, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}

	return string(decompressed), nil
}
