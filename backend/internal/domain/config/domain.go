package config

type Database struct {
	Host     string
	Name     string
	Port     string
	User     string
	Password string
}

type TLS struct {
	Use      bool
	CertPath string
	KeyPath  string
}

type Cookies struct {
	Name     string
	Secret   string
	Domain   string
	SameSite string
	Secure   bool
}

type CORS struct {
	AllowedOrigins []string
}

type Services struct {
	IPService string
}

type Startup struct {
	Port     string
	GRPCPort string
	HTTPPort string
}

type Environment struct {
	Startup  Startup
	TLS      TLS
	Cookies  Cookies
	Services Services
	Cors     CORS
	Database Database

	load bool
}

func (e Environment) Loaded() bool {
	return e.load == true
}

func (e *Environment) MarkLoaded() {
	if e == nil {
		return
	}
	e.load = true
}
