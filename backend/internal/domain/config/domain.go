package configdomain

import "strings"

type TlsMode int

const (
	TlsDisable TlsMode = iota
	TlsRequire
	TlsFullCa
)

func ParseTls(str string) TlsMode {
	switch strings.ToLower(str) {
	case "disable":
		return TlsDisable
	case "require":
		return TlsRequire
	case "full-ca", "fullca":
		return TlsFullCa
	default:
		return TlsRequire
	}
}

func (t TlsMode) String() string {
	switch t {
	case TlsDisable:
		return "disable"
	case TlsRequire:
		return "require"
	case TlsFullCa:
		return "full-ca"
	default:
		return "unknown"
	}
}

func (t TlsMode) IsValid() bool {
	return t.String() != "unknown"
}

type Database struct {
	Host     string
	Port     string
	TlsMode  TlsMode
	User     string
	Password string
}

type Config struct {
	Database Database
	Debug    bool
	Loaded   bool
}

func (c Config) IsProduction() bool {
	return c.Debug == false
}
