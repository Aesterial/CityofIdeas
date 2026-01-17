package grpcserver

import (
	"ascendant/backend/internal/domain/permissions"
	"ascendant/backend/internal/domain/rank"
	"ascendant/backend/internal/domain/sessions"
	"ascendant/backend/internal/domain/user"
	permspb "ascendant/backend/internal/gen/permissions/v1"
	userpb "ascendant/backend/internal/gen/user/v1"
	"strings"
	"time"

	"google.golang.org/protobuf/types/known/timestamppb"
)

func toProtoUserPublic(u *user.User) *userpb.UserPublic {
	if u == nil {
		return nil
	}
	return &userpb.UserPublic{
		UserID:   uint32(u.UID),
		Username: u.Username,
		Rank:     toProtoRank(u.Rank),
		Settings: toProtoUserSettings(u.Settings),
		JoinedAt: toProtoTimestamp(u.Joined),
	}
}

func toProtoUserSelf(u *user.User) *userpb.UserSelf {
	if u == nil {
		return nil
	}
	self := &userpb.UserSelf{
		Public: toProtoUserPublic(u),
	}
	if u.Email != nil {
		self.Email = &userpb.UserEmail{
			Address:  u.Email.Address,
			Verified: u.Email.Verified,
		}
	}
	return self
}

func toProtoRank(r *rank.Rank) *userpb.Rank {
	if r == nil {
		return nil
	}
	out := &userpb.Rank{
		Name: r.Name,
	}
	if r.Expires != nil {
		out.Expires = timestamppb.New(*r.Expires)
	}
	return out
}

func toProtoUserSettings(s *user.Settings) *userpb.UserPublicSettings {
	if s == nil {
		return nil
	}
	out := &userpb.UserPublicSettings{}
	if s.DisplayName != nil {
		out.DisplayName = s.DisplayName
	}
	if s.Avatar != nil {
		out.Avatar = toProtoAvatar(s.Avatar)
	}
	return out
}

func toProtoAvatar(a *user.Avatar) *userpb.Avatar {
	if a == nil {
		return nil
	}
	avatar := &userpb.Avatar{
		ContentType: a.ContentType,
	}
	if strings.TrimSpace(a.Key) != "" {
		avatar.Key = a.Key
	}
	if len(avatar.Data) == 0 && avatar.Key == "" && strings.TrimSpace(avatar.ContentType) == "" {
		return nil
	}
	return avatar
}

func fromProtoAvatar(a *userpb.Avatar) *user.Avatar {
	if a == nil {
		return nil
	}
	avatar := &user.Avatar{
		ContentType: a.ContentType,
		Key:         a.Key,
		SizeBytes:   len(a.Data),
	}
	if strings.TrimSpace(a.Key) != "" {
		avatar.Key = strings.TrimSpace(a.Key)
	}
	return avatar
}

func toProtoUserSessions(sessionsList []*sessions.Session) *userpb.UserSessions {
	resp := &userpb.UserSessions{}
	for _, s := range sessionsList {
		if s == nil {
			continue
		}
		resp.Sessions = append(resp.Sessions, &userpb.Session{
			Uuid:     s.ID.String(),
			Uid:      uint32(s.UID),
			Created:  toProtoTimestamp(s.Created),
			LastSeen: toProtoTimestamp(s.LastSeenAt),
			Expires:  toProtoTimestamp(s.Expires),
		})
	}
	return resp
}

func toProtoTimestamp(t time.Time) *timestamppb.Timestamp {
	if t.IsZero() {
		return nil
	}
	return timestamppb.New(t)
}

func toProtoPermissions(p *permissions.Permissions) *permspb.Permissions {
	if p == nil {
		return nil
	}
	return &permspb.Permissions{
		ViewOtherProfile:  p.Allowed(permissions.UsersViewProfilePublic),
		PatchOtherProfile: p.Allowed(permissions.UsersSettingsChangeNameAny),
		PatchSelfProfile: p.Allowed(permissions.UsersSettingsChangeNameOwn) ||
			p.Allowed(permissions.UsersSettingsChangeDescriptionOwn) ||
			p.Allowed(permissions.UsersSettingsDeleteAvatarOwn),
		DeleteSelfProfile:    p.Allowed(permissions.UsersSettingsDeleteProfileOwn),
		BanProfile:           p.Allowed(permissions.UsersModerationBan),
		UnbanProfile:         p.Allowed(permissions.UsersModerationUnban),
		CreateIdea:           p.Allowed(permissions.ProjectsCreate),
		PatchSelfIdea:        p.Allowed(permissions.ProjectsUpdateOwn),
		DeleteSelfIdea:       p.Allowed(permissions.ProjectsDeleteOwn),
		CreateComment:        p.Allowed(permissions.TicketsMessageCreateAny),
		PatchSelfComment:     p.Allowed(permissions.TicketsMessageCreateAny),
		DeleteSelfComment:    p.Allowed(permissions.TicketsMessageCreateAny),
		DeleteOtherComment:   p.Allowed(permissions.TicketsMessageCreateAny),
		UploadIdeaMediaSelf:  p.Allowed(permissions.ProjectsUpdateOwn),
		DeleteIdeaMediaSelf:  p.Allowed(permissions.ProjectsUpdateOwn),
		DeleteIdeaMediaOther: p.Allowed(permissions.ProjectsUpdateAny),
		ModerateIdea: p.Allowed(permissions.SubmissionsAccept) ||
			p.Allowed(permissions.SubmissionsDecline),
		PatchIdeaStatus:   p.Allowed(permissions.ProjectsUpdateAny),
		ViewStatistics:    p.Allowed(permissions.StatisticsAll),
		ViewPermissions:   p.Allowed(permissions.RanksPermissionsChange),
		ManagePermissions: p.Allowed(permissions.RanksPermissionsChange),
	}
}

func mergePermissions(base *permissions.Permissions, in *permspb.Permissions) *permissions.Permissions {
	if base == nil {
		base = &permissions.Permissions{}
	}
	if in == nil {
		return base
	}
	base.Users.View.Profile.Public = in.ViewOtherProfile
	base.Users.Settings.Change.Name.Any = in.PatchOtherProfile
	base.Users.Settings.Change.Name.Own = in.PatchSelfProfile
	base.Users.Settings.Change.Description.Own = in.PatchSelfProfile
	base.Users.Settings.Delete.Avatar.Own = in.PatchSelfProfile
	base.Users.Settings.Delete.Profile.Own = in.DeleteSelfProfile
	base.Users.Moderation.Ban = in.BanProfile
	base.Users.Moderation.BanForever = in.BanProfile
	base.Users.Moderation.Unban = in.UnbanProfile

	base.Projects.Create = in.CreateIdea
	base.Projects.Update.Own = in.PatchSelfIdea
	base.Projects.Delete.Own = in.DeleteSelfIdea
	base.Projects.Update.Any = in.PatchIdeaStatus
	base.Projects.Update.Own = base.Projects.Update.Own || in.UploadIdeaMediaSelf || in.DeleteIdeaMediaSelf
	base.Projects.Update.Any = base.Projects.Update.Any || in.DeleteIdeaMediaOther

	base.Tickets.Message.Create.Any = in.CreateComment || in.PatchSelfComment || in.DeleteSelfComment || in.DeleteOtherComment

	base.Submissions.View = in.ModerateIdea
	base.Submissions.Accept = in.ModerateIdea
	base.Submissions.Decline = in.ModerateIdea

	base.Statistics.All = in.ViewStatistics
	base.Ranks.PermissionsChange = in.ViewPermissions || in.ManagePermissions
	return base
}

func errorContains(err error, req string) bool {
	return strings.Contains(strings.ToLower(strings.TrimSpace(err.Error())), req)
}
