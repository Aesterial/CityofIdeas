package emaildomain

import "context"

type Repository interface {
	Send(ctx context.Context, userName string, userAddress string, subject string, plainText string, htmlText string) (int, error)
}
