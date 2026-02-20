package geocode

import (
	geodomain "Aesterial/backend/internal/domain/geocode"

	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

type Service struct {
	BaseURL   string
	HTTP      *http.Client
	UserAgent string
	Email     string
	RatePause time.Duration
	lastReqAt time.Time
}

func New(baseURL, userAgent, email string, rateLimit int) *Service {
	return &Service{
		BaseURL:   baseURL,
		HTTP:      &http.Client{Timeout: 10 * time.Second},
		UserAgent: userAgent,
		Email:     email,
		RatePause: time.Duration(rateLimit) * time.Millisecond,
	}
}

func (c *Service) Reverse(ctx context.Context, lat, lon float64) (*geodomain.ReverseResponse, error) {
	u, _ := url.Parse(c.BaseURL)
	u.Path = "/reverse"
	q := u.Query()
	q.Set("format", "jsonv2")
	q.Set("lat", strconv.FormatFloat(lat, 'f', 7, 64))
	q.Set("lon", strconv.FormatFloat(lon, 'f', 7, 64))
	q.Set("addressdetails", "1")
	if c.Email != "" {
		q.Set("email", c.Email)
	}
	u.RawQuery = q.Encode()

	var out geodomain.ReverseResponse
	if err := c.do(ctx, u.String(), &out); err != nil {
		return nil, err
	}
	if out.DisplayName == "" {
		return nil, errors.New("empty reverse result")
	}
	return &out, nil
}

func (c *Service) Forward(ctx context.Context, query string) (*geodomain.SearchItem, error) {
	u, _ := url.Parse(c.BaseURL)
	u.Path = "/search"
	q := u.Query()
	q.Set("format", "jsonv2")
	q.Set("q", query)
	q.Set("limit", "1")
	q.Set("addressdetails", "1")
	q.Set("countrycodes", "ru")
	if c.Email != "" {
		q.Set("email", c.Email)
	}
	u.RawQuery = q.Encode()

	var arr []geodomain.SearchItem
	if err := c.do(ctx, u.String(), &arr); err != nil {
		return nil, err
	}
	if len(arr) == 0 {
		return nil, errors.New("no results")
	}
	return &arr[0], nil
}

func (c *Service) do(ctx context.Context, fullURL string, out any) error {
	if c.RatePause > 0 {
		now := time.Now()
		sleep := c.RatePause - now.Sub(c.lastReqAt)
		if sleep > 0 {
			time.Sleep(sleep)
		}
		c.lastReqAt = time.Now()
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fullURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", c.UserAgent)

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("nominatim http %d", resp.StatusCode)
	}
	return json.NewDecoder(resp.Body).Decode(out)
}
