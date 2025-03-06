package task

import (
	"fmt"
	"github.com/robfig/cron/v3"
	"one-api/common"
)

func InitCron() {
	c := cron.New(cron.WithSeconds())

	// 添加定时任务
	_, err := c.AddFunc("0 0 * * * *", func() {
		RefreshAccessToken()
	})
	if err != nil {
		common.SysError("Scheduled task initialization failed")
	}
	c.Start()
	common.SysLog(fmt.Sprintf("Scheduled task initialization completed"))
}
