package request

import (
	"encoding/json"
	"r3/cache"
	"r3/db"
	"r3/mail"
	"r3/types"

	"github.com/jackc/pgx/v5"
)

// mails from spooler
func MailDel_tx(tx pgx.Tx, reqJson json.RawMessage) (interface{}, error) {

	var req struct {
		Ids []int64 `json:"ids"`
	}

	if err := json.Unmarshal(reqJson, &req); err != nil {
		return nil, err
	}
	return nil, mail.Del_tx(tx, req.Ids)
}

func MailGet(reqJson json.RawMessage) (interface{}, error) {

	var (
		err error
		req struct {
			Limit  int `json:"limit"`
			Offset int `json:"offset"`
		}
		res struct {
			Mails []types.Mail `json:"mails"`
			Total int64        `json:"total"`
		}
	)

	if err := json.Unmarshal(reqJson, &req); err != nil {
		return nil, err
	}

	res.Mails, res.Total, err = mail.Get(req.Limit, req.Offset)
	if err != nil {
		return nil, err
	}
	return res, nil
}

// mail accounts
func MailAccountDel_tx(tx pgx.Tx, reqJson json.RawMessage) (interface{}, error) {

	var req struct {
		Id int64 `json:"id"`
	}

	if err := json.Unmarshal(reqJson, &req); err != nil {
		return nil, err
	}
	return nil, mail.DelAccount_tx(tx, req.Id)
}

func MailAccountGet() (interface{}, error) {
	var res struct {
		Accounts map[int32]types.MailAccount `json:"accounts"`
	}
	res.Accounts = cache.GetMailAccountMap()
	return res, nil
}

func MailAccountSet_tx(tx pgx.Tx, reqJson json.RawMessage) (interface{}, error) {

	var req struct {
		Id       int32  `json:"id"`
		Name     string `json:"name"`
		Mode     string `json:"mode"`
		SendAs   string `json:"sendAs"`
		Username string `json:"username"`
		Password string `json:"password"`
		StartTls bool   `json:"startTls"`
		HostName string `json:"hostName"`
		HostPort int64  `json:"hostPort"`
	}
	if err := json.Unmarshal(reqJson, &req); err != nil {
		return nil, err
	}

	if err := mail.SetAccount_tx(tx, req.Id, req.Name, req.Mode, req.SendAs,
		req.Username, req.Password, req.StartTls, req.HostName, req.HostPort); err != nil {

		return nil, err
	}
	return nil, nil
}

func MailAccountReload() (interface{}, error) {
	return nil, cache.LoadMailAccountMap()
}

func MailAccountTest_tx(tx pgx.Tx, reqJson json.RawMessage) (interface{}, error) {

	var req struct {
		AccountName string `json:"accountName"`
		Recipient   string `json:"recipient"`
		Subject     string `json:"subject"`
	}

	if err := json.Unmarshal(reqJson, &req); err != nil {
		return nil, err
	}

	body := "If you can read this, your mail configuration appears to work."

	if _, err := tx.Exec(db.Ctx, `
		SELECT instance.mail_send($1,$2,$3,'','',$4)
	`, req.Subject, body, req.Recipient, req.AccountName); err != nil {
		return nil, err
	}
	return nil, nil
}
