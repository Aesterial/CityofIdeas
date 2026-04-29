package emaildomain

import "embed"

//go:embed templates/*.html templates/*.txt
var templateFS embed.FS
