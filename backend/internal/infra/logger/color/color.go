package loggercolor

import (
	"fmt"
	"strconv"
	"strings"
)

func hexToRGB(hex string) (int, int, int, error) {
	hex = strings.TrimPrefix(strings.TrimSpace(hex), "#")
	if len(hex) != 6 {
		return 0, 0, 0, fmt.Errorf("hex must be 6 chars, got %q", hex)
	}
	v, err := strconv.ParseUint(hex, 16, 24)
	if err != nil {
		return 0, 0, 0, err
	}
	r := int((v >> 16) & 0xFF)
	g := int((v >> 8) & 0xFF)
	b := int(v & 0xFF)
	return r, g, b, nil
}

func ColorHEX(text, hex string) string {
	r, g, b, err := hexToRGB(hex)
	if err != nil {
		return text
	}
	return fmt.Sprintf("\x1b[38;2;%d;%d;%dm%s\x1b[0m", r, g, b, text)
}

func BgHEX(text, hex string) string {
	r, g, b, err := hexToRGB(hex)
	if err != nil {
		return text
	}
	return fmt.Sprintf("\x1b[48;2;%d;%d;%dm%s\x1b[0m", r, g, b, text)
}
