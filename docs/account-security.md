# 账户安全（Account Security）

入口：个人中心（`/personal?tab=security`）→ 账户安全 Tab。
对应组件：`src/pages/user/SecurityTab.tsx`。

## 认证约定

- 认证使用服务端 Session + HttpOnly `SESSIONID` Cookie。
- 前端不读取、不保存 token；所有请求由 `HttpClient` 统一携带 Cookie。
- 会话失效时后端返回 `errno=1101`，前端清理用户态并跳转 `/auth`。

## 登录会话

### GET /api/v1/user/device/list

获取当前用户的登录会话列表。响应 `data`：

```json
{
  "total": 1,
  "list": [
    {
      "id": "<session hash>",
      "device_id": "<session hash>",
      "device_name": "Chrome · macOS",
      "platform": "macOS",
      "ip": "203.0.113.10",
      "is_current": true,
      "login_time": 1790000000,
      "last_active_time": 1790000000
    }
  ]
}
```

### POST /api/v1/user/device/kick

强制下线指定会话。表单字段：

| 字段        | 必填 | 说明                            |
| ----------- | ---- | ------------------------------- |
| `device_id` | 是   | 列表中的会话 hash，不是旧设备表 ID |

当前设备不显示下线按钮；后端仍会校验会话归属。

## Passkey（WebAuthn）

### POST /api/v1/auth/passkey/list

列出当前用户的 Passkey。响应 `data`：

```json
{
  "total": 1,
  "list": [
    {
      "id": 1,
      "name": "MacBook Touch ID",
      "alg": -7,
      "aaguid": "...",
      "transports": "internal,hybrid",
      "backup_eligible": 1,
      "backup_state": 0,
      "created_at": 1790000000,
      "last_used_at": 1790000000
    }
  ]
}
```

### POST /api/v1/auth/passkey/register/begin

表单字段 `name` 可选；返回 WebAuthn `PublicKeyCredentialCreationOptions`。

### POST /api/v1/auth/passkey/register/finish

请求体为 `PublicKeyCredential.toJSON()`，并附带 `name`：

```json
{
  "id": "...",
  "rawId": "...",
  "type": "public-key",
  "response": {
    "clientDataJSON": "...",
    "attestationObject": "...",
    "transports": ["internal", "hybrid"]
  },
  "name": "MacBook Touch ID"
}
```

### POST /api/v1/auth/passkey/delete

表单字段 `id`（Passkey 记录 ID）软删除当前用户的凭据。

## 两步验证（2FA）

后端已有接口：

| 接口                        | 说明                                   |
| --------------------------- | -------------------------------------- |
| `POST /user/2fa/enable`     | 生成 TOTP secret 和 `otp_uri`          |
| `POST /user/2fa/confirm`    | 校验动态码并返回一次性恢复码           |
| `POST /user/2fa/disable`    | 校验动态码后关闭 2FA                   |
| `POST /user/2fa/verify`     | 登录第二步验证                         |
| `POST /user/2fa/recovery`   | 使用一次性恢复码完成登录               |

> 当前 `/user/info` 尚未返回 `totp_enabled`，安全页暂不提供 2FA 开关；登录页已支持 2FA 验证步骤。

## 备注

- 修改密码由认证服务单独处理；修改成功后后端会撤销全部旧会话。
- 邮箱验证码恢复登录会撤销全部旧会话，并签发新的 `SESSIONID`。
- 所有写操作依赖同源 Cookie 中的有效会话；前端权限判断仅用于界面控制。
