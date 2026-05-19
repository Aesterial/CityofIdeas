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
	Name     string
	TlsMode  TlsMode
	User     string
	Password string
}

type Cookie struct {
	Name   string
	Secret string
	Issuer string
}

type Email struct {
	Enabled bool
	API     string
	Name    string
	Domain  string
}

type S3 struct {
	Enabled   bool
	Endpoint  string
	Region    string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
}

type Security struct {
	ActionsDuration int // minutes
}

type VK struct {
	Enabled     bool
	ID          string
	Secret      string
	RedirectURL string
}

type Telegram struct {
	Enabled     bool
	BotToken    string
	BotUsername string
}

type Oauth struct {
	Key string
	Vk  VK
	Tg  Telegram
}

type Config struct {
	Database       Database
	Cookie         Cookie
	Email          Email
	S3             S3
	Security       Security
	Oauth          Oauth
	AllowedOrigins []string
	Domain         string
	Host           string
	Port           string
	Debug          bool
	Loaded         bool
}

func (c Config) IsProduction() bool {
	return !c.Debug
}
