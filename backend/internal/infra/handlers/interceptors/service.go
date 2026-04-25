package interceptors

import maintenanceservice "github.com/aesterial/cityideas/backend/internal/app/maintenance"

type Service struct {
	mt *maintenanceservice.Service
}

func NewService(mt *maintenanceservice.Service) *Service {
	return &Service{mt: mt}
}
