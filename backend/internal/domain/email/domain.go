package emaildomain

import (
	"bytes"
	htmltpl "html/template"
	texttpl "text/template"
	"time"
)

type UserInfo struct {
	Username string
	Address  string
}

type Public struct {
	SupportURL string
	PrivacyURL string
}

func FillPublic(domain string) Public {
	return Public{
		SupportURL: domain + "/support",
		PrivacyURL: domain + "/privacy",
	}
}

type Welcome struct {
	UserName           string
	ProfileSettingsURL string
	Public             Public
}

type LoginNotification struct {
	UserName    string
	LoginAt     string
	IPAddress   string
	Location    string
	Device      string
	Browser     string
	SecurityURL string
	Public      Public
}

type VerifyEmail struct {
	VerificationCode string
	VerifyURL        string
	Public           Public
}

type PasswordReset struct {
	ResetURL string
	Public   Public
}

type TicketCreation struct {
	Date      time.Time
	Topic     string
	TicketURL string
	Public    Public
}

type TicketReply struct {
	AdminName string
	TicketID  string
	Message   string
	ThreadURL string
	Public    Public
}

func RenderHTMLTemplate(template string, data any) (string, error) {
	tpl, err := htmltpl.ParseFS(templateFS, "templates/"+template+".html")
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err = tpl.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}

func RenderTEXTTemplate(template string, data any) (string, error) {
	tpl, err := texttpl.ParseFS(templateFS, "templates/"+template+".txt")
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err = tpl.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}

func RenderTemplates(template string, data any) (string, string, error) {
	html, err := RenderHTMLTemplate(template, data)
	if err != nil {
		return "", "", err
	}
	text, err := RenderTEXTTemplate(template, data)
	if err != nil {
		return "", "", err
	}
	return html, text, nil
}
