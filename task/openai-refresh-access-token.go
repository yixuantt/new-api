package task

import (
	"fmt"
	"one-api/common"
	"one-api/model"
	"one-api/relay/channel/openai"
)

func RefreshAccessToken() {
	channels, err := model.GetOpenAIAccessTokenWillExpireChannel()
	if err != nil {
		// Query数据失败
		common.SysError(fmt.Sprintf("Querying the Channel data to be updated failed"))
		return
	}
	if len(channels) == 0 {
		common.SysError(fmt.Sprintf("The Channel data to be updated is empty"))
		return
	}
	for _, channel := range channels {
		common.SysLog(fmt.Sprintf("Start to automatically RefreshOPENAI AK, channelId: %d, RT: %s", channel.Id, channel.OpenAIRefreshToken))
		res, err := openai.RefreshAccessToken(channel.OpenAIRefreshToken)
		if err != nil {
			common.SysError(fmt.Sprintf("Automatic RefreshOPENAI AK failed, channelId: %d, error: %s", channel.Id, err.Error()))
			continue
		}
		channel.Key = res.AccessToken
		channel.OpenAIAccessTokenExpiresTime = common.GetTimestamp() + res.ExpiresIn
		err = channel.Update()
		if err != nil {
			common.SysError(fmt.Sprintf("Automatic RefreshOPENAI AK, failed to update the database, channelId: %d, error: %s", channel.Id, err.Error()))
			continue
		}
		common.SysLog(fmt.Sprintf("Automatic RefreshOPENAI AK succeeded, channelId: %d", channel.Id))
	}
}
