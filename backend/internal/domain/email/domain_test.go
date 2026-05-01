package emaildomain

import (
	"testing"

	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
)

func TestRenderTemplatesLanguages(t *testing.T) {
	tests := []struct {
		name string
		data any
	}{
		{
			name: "welcome",
			data: Welcome{
				UserName:           "aesterial",
				ProfileSettingsURL: "https://aesterial.xyz/profile",
				Public:             FillPublic("https://aesterial.xyz"),
			},
		},
		{
			name: "login_notification",
			data: LoginNotification{
				UserName:    "aesterial",
				LoginAt:     "Thu, 30 Apr 2026 12:00:00 +0700",
				IPAddress:   "127.0.0.1",
				Location:    "Novosibirsk",
				Device:      "Desktop",
				Browser:     "Chrome",
				SecurityURL: "https://aesterial.xyz/profile",
				Public:      FillPublic("https://aesterial.xyz"),
			},
		},
		{
			name: "password_reset",
			data: PasswordReset{
				ResetURL: "https://aesterial.xyz/reset",
				Public:   FillPublic("https://aesterial.xyz"),
			},
		},
		{
			name: "verify_email",
			data: VerifyEmail{
				VerificationCode: "123456",
				VerifyURL:        "https://aesterial.xyz/verify",
				Public:           FillPublic("https://aesterial.xyz"),
			},
		},
		{
			name: "support_ticket_created",
			data: TicketCreation{
				Date:      "Thu, 30 Apr 2026 12:00:00 +0700",
				Topic:     "Account",
				TicketURL: "https://aesterial.xyz/support/tickets/1",
				Public:    FillPublic("https://aesterial.xyz"),
			},
		},
		{
			name: "support_ticket_reply",
			data: TicketReply{
				AdminName: "Admin",
				TicketID:  "1",
				Message:   "Message",
				ThreadURL: "https://aesterial.xyz/support/tickets/1",
				Public:    FillPublic("https://aesterial.xyz"),
			},
		},
		{
			name: "project_accepted",
			data: ProjectAccepted{
				ProjectID: "018f6f4d-6c4b-7c9a-9b42-2b0a7f21f001",
				Date:      "Thu, 30 Apr 2026 12:00:00 +0700",
				Public:    FillPublic("https://aesterial.xyz"),
			},
		},
		{
			name: "project_declined",
			data: ProjectDeclined{
				ProjectID: "018f6f4d-6c4b-7c9a-9b42-2b0a7f21f001",
				Date:      "Thu, 30 Apr 2026 12:00:00 +0700",
				Reason:    "The initiative needs a more detailed description.",
				Public:    FillPublic("https://aesterial.xyz"),
			},
		},
	}

	for _, tt := range tests {
		for _, language := range []userdomain.Languages{userdomain.RussianLang, userdomain.EnglishLang} {
			t.Run(tt.name+"_"+language.String(), func(t *testing.T) {
				html, text, err := RenderTemplates(tt.name, tt.data, language)
				if err != nil {
					t.Fatal(err)
				}
				if html == "" || text == "" {
					t.Fatal("expected non-empty rendered templates")
				}
			})
		}
	}
}
