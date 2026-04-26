package statisticsdomain

import "context"

type Repository interface {
	Global(ctx context.Context) (*Global, error)
	Votes(ctx context.Context, req Request) (Graph, error)
	Creation(ctx context.Context, req Request) (Graph, error)
	Questions(ctx context.Context, req Request) (Graph, error)
	Discussion(ctx context.Context, req Request) (Graph, error)
}
