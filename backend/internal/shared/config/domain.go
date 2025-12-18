package config

var ENV Environment

type Database struct {
	Host string
	Name string
	Port string
	User string
	Pass string
}

type TLS struct {
	CertPath string
	KeyPath  string
}

type Cookies struct {
	Name   string
	Secret string
}

type Boot struct {
	Port      string
	IpService string
	UseTLS    bool
}

type Environment struct {
	Boot     Boot
	Database Database
	Cookies  Cookies
	TLS      TLS
}
