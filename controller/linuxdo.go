package controller

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"net/http"
	"net/url"
	"one-api/common"
	"one-api/model"
	"strconv"
	"time"
)

type LinuxDoOAuthResponse struct {
	AccessToken string `json:"access_token"`
	Scope       string `json:"scope"`
	TokenType   string `json:"token_type"`
}

type LinuxDoUser struct {
	ID         int    `json:"id"`
	Username   string `json:"username"`
	Name       string `json:"name"`
	Active     bool   `json:"active"`
	TrustLevel int    `json:"trust_level"`
	Silenced   bool   `json:"silenced"`
}

func getLinuxDoUserInfoByCode(code string) (*LinuxDoUser, error) {
	if code == "" {
		return nil, errors.New("Invalid parameter")
	}
	auth := base64.StdEncoding.EncodeToString([]byte(common.LinuxDoClientId + ":" + common.LinuxDoClientSecret))
	form := url.Values{
		"grant_type": {"authorization_code"},
		"code":       {code},
	}
	req, err := http.NewRequest("POST", "https://connect.linux.do/oauth2/token", bytes.NewBufferString(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Accept", "application/json")
	client := http.Client{
		Timeout: 5 * time.Second,
	}
	res, err := client.Do(req)
	if err != nil {
		common.SysLog(err.Error())
		return nil, errors.New("None法连接至 LINUX DO 服务器，请稍后Retry！")
	}
	defer res.Body.Close()
	var oAuthResponse LinuxDoOAuthResponse
	err = json.NewDecoder(res.Body).Decode(&oAuthResponse)
	if err != nil {
		return nil, err
	}
	req, err = http.NewRequest("GET", "https://connect.linux.do/api/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", oAuthResponse.AccessToken))
	res2, err := client.Do(req)
	if err != nil {
		common.SysLog(err.Error())
		return nil, errors.New("None法连接至 LINUX DO 服务器，请稍后Retry！")
	}
	defer res2.Body.Close()
	var linuxdoUser LinuxDoUser
	err = json.NewDecoder(res2.Body).Decode(&linuxdoUser)
	if err != nil {
		return nil, err
	}
	if linuxdoUser.ID == 0 {
		return nil, errors.New("Invalid return value, user field is empty. Please try again later!")
	}
	if linuxdoUser.TrustLevel < common.LinuxDoMinLevel {
		return nil, errors.New("User LINUX DO 信任grade不足！")
	}
	return &linuxdoUser, nil
}

func LinuxDoOAuth(c *gin.Context) {
	session := sessions.Default(c)
	state := c.Query("state")
	if state == "" || session.Get("oauth_state") == nil || state != session.Get("oauth_state").(string) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "state is empty or not same",
		})
		return
	}
	username := session.Get("username")
	if username != nil {
		LinuxDoBind(c)
		return
	}

	if !common.LinuxDoOAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Admin未open启通过 LINUX DO LoginandRegister",
		})
		return
	}
	code := c.Query("code")
	linuxdoUser, err := getLinuxDoUserInfoByCode(code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	user := model.User{
		LinuxDoId:    strconv.Itoa(linuxdoUser.ID),
		LinuxDoLevel: linuxdoUser.TrustLevel,
	}
	if model.IsLinuxDoIdAlreadyTaken(user.LinuxDoId) {
		err := user.FillUserByLinuxDoId()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}

		if user.Id == 0 {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "User已Logout",
			})
			return
		}

		user.LinuxDoLevel = linuxdoUser.TrustLevel
		err = user.Update(false)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	} else {
		if common.RegisterEnabled {
			affCode := c.Query("aff")
			user.InviterId, _ = model.GetUserIdByAffCode(affCode)

			user.Username = "linuxdo_" + strconv.Itoa(model.GetMaxUserId()+1)
			if linuxdoUser.Name != "" {
				user.DisplayName = linuxdoUser.Name
			} else {
				user.DisplayName = linuxdoUser.Username
			}
			user.Role = common.RoleCommonUser
			user.Status = common.UserStatusEnabled

			if err := user.Insert(user.InviterId); err != nil {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}
		} else {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "Administrator has disabled new user registration",
			})
			return
		}
	}

	if user.Status != common.UserStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": "User has been banned",
			"success": false,
		})
		return
	}
	setupLogin(&user, c)
}

func LinuxDoBind(c *gin.Context) {
	if !common.LinuxDoOAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Admin未open启通过 LINUX DO LoginandRegister",
		})
		return
	}
	code := c.Query("code")
	linuxdoUser, err := getLinuxDoUserInfoByCode(code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	user := model.User{
		LinuxDoId:    strconv.Itoa(linuxdoUser.ID),
		LinuxDoLevel: linuxdoUser.TrustLevel,
	}
	if model.IsLinuxDoIdAlreadyTaken(user.LinuxDoId) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该 LINUX DO Account已被Bind",
		})
		return
	}
	session := sessions.Default(c)
	id := session.Get("id")
	// id := c.GetInt("id")  // critical bug!
	user.Id = id.(int)
	err = user.FillUserById()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	user.LinuxDoId = strconv.Itoa(linuxdoUser.ID)
	user.LinuxDoLevel = linuxdoUser.TrustLevel
	err = user.Update(false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "bind",
	})
	return
}
