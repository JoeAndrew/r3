// for executing REST calls from instance spooler

package rest_send

import (
	"fmt"
	"io"
	"net/http"
	"r3/cache"
	"r3/db"
	"r3/log"
	"r3/tools"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	attemptsAllow = 5   // how many attempts for each REST call before quitting
	callLimit     = 100 // how many REST calls to retrieve per loop
)

type restCall struct {
	id                   uuid.UUID
	pgFunctionIdCallback pgtype.UUID
	method               string
	headers              map[string]string
	url                  string
	body                 pgtype.Text
	callbackValue        pgtype.Text
	skipVerify           bool
}

func DoAll() error {
	for true {
		anySuccess := false

		// collect spooled REST calls
		rows, err := db.Pool.Query(db.Ctx, `
			SELECT id, pg_function_id_callback, method, headers,
				url, body, callback_value, skip_verify
			FROM instance.rest_spool
			WHERE attempt_count < $1
			ORDER BY date_added ASC
			LIMIT $2
		`, attemptsAllow, callLimit)
		if err != nil {
			return err
		}
		defer rows.Close()

		calls := make([]restCall, 0)
		for rows.Next() {
			var c restCall
			if err := rows.Scan(&c.id, &c.pgFunctionIdCallback, &c.method, &c.headers,
				&c.url, &c.body, &c.callbackValue, &c.skipVerify); err != nil {

				return err
			}
			calls = append(calls, c)
		}

		for _, c := range calls {
			if err := callExecute(c); err != nil {
				log.Error("api", fmt.Sprintf("failed to execute REST call %s '%s'", c.method, c.url), err)

				_, err := db.Pool.Exec(db.Ctx, `
					UPDATE instance.rest_spool
					SET attempt_count = attempt_count + 1
					WHERE id = $1
				`, c.id)

				if err != nil {
					log.Error("api", "failed to update call attempt count", err)
				}
				continue
			}
			anySuccess = true
		}

		// exit if limit is not reached or no call was successful
		if len(calls) < callLimit || !anySuccess {
			break
		}
	}
	return nil
}

func callExecute(c restCall) error {
	log.Info("api", fmt.Sprintf("is calling %s '%s'", c.method, c.url))

	httpReq, err := http.NewRequest(c.method, c.url, strings.NewReader(c.body.String))
	if err != nil {
		return fmt.Errorf("could not prepare request, %s", err)
	}

	httpReq.Header.Set("User-Agent", "r3-application")
	for k, v := range c.headers {
		httpReq.Header.Set(k, v)
	}

	httpClient := tools.GetHttpClient(c.skipVerify)
	httpRes, err := httpClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer httpRes.Body.Close()

	// successfully executed
	tx, err := db.Pool.Begin(db.Ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(db.Ctx)

	// execute callback if enabled
	if c.pgFunctionIdCallback.Valid {
		bodyRaw, err := io.ReadAll(httpRes.Body)
		if err != nil {
			return fmt.Errorf("could not read response body, %s", err)
		}

		fnc, exists := cache.PgFunctionIdMap[c.pgFunctionIdCallback.Bytes]
		if !exists {
			return fmt.Errorf("unknown function '%s'", c.pgFunctionIdCallback.Bytes)
		}
		mod, exists := cache.ModuleIdMap[fnc.ModuleId]
		if !exists {
			return fmt.Errorf("unknown module '%s'", fnc.ModuleId)
		}

		if _, err := tx.Exec(db.Ctx, fmt.Sprintf(`SELECT "%s"."%s"($1,$2,$3)`,
			mod.Name, fnc.Name), httpRes.StatusCode, bodyRaw, c.callbackValue); err != nil {

			return err
		}
	}

	// delete REST call from spooler
	if _, err := tx.Exec(db.Ctx, `
		DELETE FROM instance.rest_spool
		WHERE id = $1
	`, c.id); err != nil {
		return err
	}
	return tx.Commit(db.Ctx)
}
