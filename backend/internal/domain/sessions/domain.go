package sessionsdomain

import (
	"time"

	sessionpb "github.com/aesterial/cityideas/backend/internal/api/v1/sessions/v1"
	"github.com/aesterial/cityideas/backend/internal/domain"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Session struct {
	ID      domain.UUID
	Owner   domain.UUID
	MFA     bool
	Device  domain.Device
	Hash    string
	At      time.Time
	Seen    time.Time
	Expires time.Time
	Expired bool
}

func (s *Session) Protobuf() *sessionpb.Session {
	if s == nil {
		return nil
	}
	var expired = s.Expired
	if !expired {
		expired = s.Expires.After(time.Now())
	}
	var out = &sessionpb.Session{}
	out.SetId(s.ID.String())
	out.SetAt(timestamppb.New(s.At))
	out.SetDevice(s.Device.Protobuf())
	out.SetExpired(expired)
	out.SetHash(s.Hash)
	out.SetMfa(s.MFA)
	out.SetSeen(timestamppb.New(s.Seen))
	return out
}

type Sessions []*Session

func (s Sessions) Protobuf() []*sessionpb.Session {
	if s == nil {
		return nil
	}
	var out = make([]*sessionpb.Session, len(s))
	for i, e := range s {
		out[i] = e.Protobuf()
	}
	return out
}
