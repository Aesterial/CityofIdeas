package mailer

var Welcome template = template{
	Ru: `<!doctype html>
		<html lang="ru">
		    <head>
		        <meta charset="utf-8" />
		        <meta name="viewport" content="width=device-width,initial-scale=1" />
		        <meta name="x-apple-disable-message-reformatting" />
		        <title>Aesterial — Добро пожаловать</title>
		    </head>
		    <body style="margin: 0; padding: 0; background: #f3f3f3">
		        <table
		            role="presentation"
		            cellpadding="0"
		            cellspacing="0"
		            border="0"
		            width="100%"
		            style="background: #f3f3f3"
		        >
		            <tr>
		                <td align="center" style="padding: 28px 16px 10px 16px">
		                    <table
		                        role="presentation"
		                        cellpadding="0"
		                        cellspacing="0"
		                        border="0"
		                        width="640"
		                        style="max-width: 640px"
		                    >
		                        <tr>
		                            <td align="center" style="padding: 0 0 18px 0">
		                                <table
		                                    role="presentation"
		                                    cellpadding="0"
		                                    cellspacing="0"
		                                    border="0"
		                                    width="100%"
		                                >
		                                    <tr>
		                                        <td valign="middle" style="padding: 0">
		                                            <div
		                                                style="
		                                                    border-top: 2px solid
		                                                        #3a3a3a;
		                                                    line-height: 1px;
		                                                    font-size: 1px;
		                                                "
		                                            >
		                                                &nbsp;
		                                            </div>
		                                        </td>
		                                        <td
		                                            width="180"
		                                            valign="middle"
		                                            align="center"
		                                            style="
		                                                width: 180px;
		                                                padding: 0 14px;
		                                                font-family:
		                                                    Arial, Helvetica, sans-serif;
		                                                font-size: 24px;
		                                                letter-spacing: 3px;
		                                                font-weight: 700;
		                                                color: #1f1f1f;
		                                                white-space: nowrap;
		                                            "
		                                        >
		                                            AESTERIAL
		                                        </td>
		                                        <td valign="middle" style="padding: 0">
		                                            <div
		                                                style="
		                                                    border-top: 2px solid
		                                                        #3a3a3a;
		                                                    line-height: 1px;
		                                                    font-size: 1px;
		                                                "
		                                            >
		                                                &nbsp;
		                                            </div>
		                                        </td>
		                                    </tr>
		                                </table>
		                            </td>
		                        </tr>
		                    </table>
		                    <table
		                        role="presentation"
		                        cellpadding="0"
		                        cellspacing="0"
		                        border="0"
		                        width="640"
		                        style="
		                            max-width: 640px;
		                            background: #f8f8f8;
		                            border: 1px solid #d8d8d8;
		                            border-radius: 14px;
		                        "
		                    >
		                        <tr>
		                            <td style="padding: 18px 22px 24px 22px">
		                                <table
		                                    role="presentation"
		                                    cellpadding="0"
		                                    cellspacing="0"
		                                    border="0"
		                                    width="100%"
		                                >
		                                    <tr>
		                                        <td
		                                            style="
		                                                border-top: 1px solid #bdbdbd;
		                                                height: 1px;
		                                                font-size: 1px;
		                                                line-height: 1px;
		                                            "
		                                        >
		                                            &nbsp;
		                                        </td>
		                                        <td
		                                            width="74"
		                                            align="center"
		                                            style="padding: 0 10px"
		                                        >
		                                            <table
		                                                role="presentation"
		                                                cellpadding="0"
		                                                cellspacing="0"
		                                                border="0"
		                                            >
		                                                <tr>
		                                                    <td
		                                                        align="center"
		                                                        width="56"
		                                                        height="56"
		                                                        style="
		                                                            width: 56px;
		                                                            height: 56px;
		                                                            background: #2a2a2a;
		                                                            border-radius: 50%;
		                                                            border: 4px solid
		                                                                #ededed;
		                                                        "
		                                                    >
		                                                        <svg
		                                                            width="26"
		                                                            height="26"
		                                                            viewBox="0 0 24 24"
		                                                            aria-hidden="true"
		                                                            style="
		                                                                display: block;
		                                                            "
		                                                        >
		                                                            <path
		                                                                fill="#ffffff"
		                                                                d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2zm8 10l.9 2.6L23 16l-2.1.4L20 19l-.9-2.6L17 16l2.1-.4L20 12zM4 12l.9 2.6L7 16l-2.1.4L4 19l-.9-2.6L1 16l2.1-.4L4 12z"
		                                                            />
		                                                        </svg>
		                                                    </td>
		                                                </tr>
		                                            </table>
		                                        </td>
		                                        <td
		                                            style="
		                                                border-top: 1px solid #bdbdbd;
		                                                height: 1px;
		                                                font-size: 1px;
		                                                line-height: 1px;
		                                            "
		                                        >
		                                            &nbsp;
		                                        </td>
		                                    </tr>
		                                </table>

		                                <div
		                                    style="
		                                        height: 14px;
		                                        line-height: 14px;
		                                        font-size: 14px;
		                                    "
		                                >
		                                    &nbsp;
		                                </div>

		                                <table
		                                    role="presentation"
		                                    width="100%"
		                                    cellpadding="0"
		                                    cellspacing="0"
		                                    border="0"
		                                >
		                                    <tr>
		                                        <td
		                                            align="center"
		                                            style="
		                                                font-family:
		                                                    Arial, Helvetica, sans-serif;
		                                                font-size: 30px;
		                                                line-height: 36px;
		                                                font-weight: 800;
		                                                color: #1f1f1f;
		                                                padding: 8px 0 12px 0;
		                                            "
		                                        >
		                                            Добро пожаловать в Aesterial!
		                                        </td>
		                                    </tr>

		                                    <tr>
		                                        <td
		                                            align="center"
		                                            style="
		                                                font-family:
		                                                    Arial, Helvetica, sans-serif;
		                                                font-size: 14px;
		                                                line-height: 22px;
		                                                color: #4a4a4a;
		                                                padding: 0 18px 14px 18px;
		                                            "
		                                        >
		                                            Спасибо за регистрацию, {{username}}!<br />
		                                            Ваш аккаунт создан — можно начинать
		                                            пользоваться сервисом.
		                                        </td>
		                                    </tr>

		                                    <tr>
		                                        <td style="padding: 0 18px 10px 18px">
		                                            <div
		                                                style="
		                                                    border-top: 1px solid
		                                                        #d0d0d0;
		                                                    line-height: 1px;
		                                                    font-size: 1px;
		                                                "
		                                            >
		                                                &nbsp;
		                                            </div>
		                                        </td>
		                                    </tr>

		                                    <tr>
		                                        <td
		                                            align="center"
		                                            style="
		                                                font-family:
		                                                    Arial, Helvetica, sans-serif;
		                                                font-size: 14px;
		                                                line-height: 22px;
		                                                color: #4a4a4a;
		                                                padding: 0 18px 14px 18px;
		                                            "
		                                        >
		                                            Для быстрого старта нажмите кнопку
		                                            ниже:
		                                        </td>
		                                    </tr>

		                                    <tr>
		                                        <td
		                                            align="center"
		                                            style="padding: 0 18px 14px 18px"
		                                        >
		                                            <table
		                                                role="presentation"
		                                                cellpadding="0"
		                                                cellspacing="0"
		                                                border="0"
		                                            >
		                                                <tr>
		                                                    <td
		                                                        align="center"
		                                                        bgcolor="#2b2b2b"
		                                                        style="
		                                                            border-radius: 10px;
		                                                        "
		                                                    >
		                                                        <a
		                                                            href="{{redirect_url}}"
		                                                            style="
		                                                                display: inline-block;
		                                                                font-family:
		                                                                    Arial,
		                                                                    Helvetica,
		                                                                    sans-serif;
		                                                                font-size: 14px;
		                                                                letter-spacing: 1px;
		                                                                font-weight: 700;
		                                                                color: #ffffff;
		                                                                text-decoration: none;
		                                                                padding: 14px
		                                                                    42px;
		                                                                border-radius: 10px;
		                                                            "
		                                                        >
		                                                            ПЕРЕЙТИ НА САЙТ
		                                                        </a>
		                                                    </td>
		                                                </tr>
		                                            </table>
		                                        </td>
		                                    </tr>

		                                    <tr>
		                                        <td
		                                            align="center"
		                                            style="
		                                                font-family:
		                                                    Arial, Helvetica, sans-serif;
		                                                font-size: 13px;
		                                                line-height: 20px;
		                                                color: #6a6a6a;
		                                                padding: 0 18px 10px 18px;
		                                            "
		                                        >
		                                            Если это были не вы — просто
		                                            проигнорируйте письмо или обратитесь
		                                            в поддержку.
		                                        </td>
		                                    </tr>

		                                    <tr>
		                                        <td style="padding: 0 18px">
		                                            <div
		                                                style="
		                                                    border-top: 1px solid
		                                                        #d0d0d0;
		                                                    line-height: 1px;
		                                                    font-size: 1px;
		                                                "
		                                            >
		                                                &nbsp;
		                                            </div>
		                                        </td>
		                                    </tr>

		                                    <tr>
		                                        <td
		                                            align="center"
		                                            style="
		                                                font-family:
		                                                    Arial, Helvetica, sans-serif;
		                                                font-size: 14px;
		                                                line-height: 22px;
		                                                color: #444;
		                                                padding: 14px 18px 6px 18px;
		                                            "
		                                        >
		                                            Нужна помощь?
		                                            <a
		                                                href="{{support_url}}"
		                                                style="
		                                                    color: #2b2b2b;
		                                                    text-decoration: underline;
		                                                "
		                                                >Свяжитесь со службой
		                                                поддержки</a
		                                            >
		                                        </td>
		                                    </tr>
		                                </table>
		                            </td>
		                        </tr>
		                    </table>
		                    <table
		                        role="presentation"
		                        cellpadding="0"
		                        cellspacing="0"
		                        border="0"
		                        width="640"
		                        style="max-width: 640px"
		                    >
		                        <tr>
		                            <td align="center" style="padding: 18px 0 6px 0">
		                                <table
		                                    role="presentation"
		                                    cellpadding="0"
		                                    cellspacing="0"
		                                    border="0"
		                                    width="100%"
		                                >
		                                    <tr>
		                                        <td
		                                            valign="middle"
		                                            style="padding: 18px 0 6px 0"
		                                        >
		                                            <div
		                                                style="
		                                                    border-top: 1px solid
		                                                        #d0d0d0;
		                                                    line-height: 1px;
		                                                    font-size: 1px;
		                                                "
		                                            >
		                                                &nbsp;
		                                            </div>
		                                        </td>
		                                        <td
		                                            width="60"
		                                            valign="middle"
		                                            align="center"
		                                            style="
		                                                padding: 18px 12px 6px 12px;
		                                                width: 60px;
		                                            "
		                                        >
		                                            <svg
		                                                viewBox="0 0 64 48"
		                                                width="34"
		                                                height="26"
		                                                role="presentation"
		                                                style="
		                                                    display: block;
		                                                    color: #1f1f1f;
		                                                "
		                                            >
		                                                <path
		                                                    fill="currentColor"
		                                                    d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"
		                                                />
		                                            </svg>
		                                        </td>
		                                        <td
		                                            valign="middle"
		                                            style="padding: 18px 0 6px 0"
		                                        >
		                                            <div
		                                                style="
		                                                    border-top: 1px solid
		                                                        #d0d0d0;
		                                                    line-height: 1px;
		                                                    font-size: 1px;
		                                                "
		                                            >
		                                                &nbsp;
		                                            </div>
		                                        </td>
		                                    </tr>
		                                </table>
		                            </td>
		                        </tr>

		                        <tr>
		                            <td
		                                align="center"
		                                style="
		                                    font-family: Arial, Helvetica, sans-serif;
		                                    font-size: 12px;
		                                    line-height: 18px;
		                                    color: #8a8a8a;
		                                    padding: 10px 18px 2px 18px;
		                                "
		                            >
		                                Copyright © 2026
		                                <span style="color: #2b2b2b">Aesterial</span>
		                            </td>
		                        </tr>

		                        <tr>
		                            <td
		                                align="center"
		                                style="
		                                    font-family: Arial, Helvetica, sans-serif;
		                                    font-size: 12px;
		                                    line-height: 18px;
		                                    color: #8a8a8a;
		                                    padding: 0 18px 28px 18px;
		                                "
		                            >
		                                <a
		                                    href="{{privacy_url}}"
		                                    style="
		                                        color: #8a8a8a;
		                                        text-decoration: underline;
		                                    "
		                                    >Политика конфиденциальности</a
		                                >
		                            </td>
		                        </tr>
		                    </table>
		                </td>
		            </tr>
		        </table>
		    </body>
		</html>
		`,
	En: `<!doctype html>
		<html lang="en">
		  <head>
		    <meta charset="utf-8" />
		    <meta name="viewport" content="width=device-width,initial-scale=1" />
		    <meta name="x-apple-disable-message-reformatting" />
		    <title>Aesterial — Welcome</title>
		  </head>
		  <body style="margin: 0; padding: 0; background: #f3f3f3">
		    <table
		      role="presentation"
		      cellpadding="0"
		      cellspacing="0"
		      border="0"
		      width="100%"
		      style="background: #f3f3f3"
		    >
		      <tr>
		        <td align="center" style="padding: 28px 16px 10px 16px">
		          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width: 640px">
		            <tr>
		              <td align="center" style="padding: 0 0 18px 0">
		                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
		                  <tr>
		                    <td valign="middle" style="padding: 0">
		                      <div style="border-top: 2px solid #3a3a3a; line-height: 1px; font-size: 1px">&nbsp;</div>
		                    </td>
		                    <td
		                      width="180"
		                      valign="middle"
		                      align="center"
		                      style="
		                        width: 180px;
		                        padding: 0 14px;
		                        font-family: Arial, Helvetica, sans-serif;
		                        font-size: 24px;
		                        letter-spacing: 3px;
		                        font-weight: 700;
		                        color: #1f1f1f;
		                        white-space: nowrap;
		                      "
		                    >
		                      AESTERIAL
		                    </td>
		                    <td valign="middle" style="padding: 0">
		                      <div style="border-top: 2px solid #3a3a3a; line-height: 1px; font-size: 1px">&nbsp;</div>
		                    </td>
		                  </tr>
		                </table>
		              </td>
		            </tr>
		          </table>
		          <table
		            role="presentation"
		            cellpadding="0"
		            cellspacing="0"
		            border="0"
		            width="640"
		            style="
		              max-width: 640px;
		              background: #f8f8f8;
		              border: 1px solid #d8d8d8;
		              border-radius: 14px;
		            "
		          >
		            <tr>
		              <td style="padding: 18px 22px 24px 22px">
		                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
		                  <tr>
		                    <td
		                      style="
		                        border-top: 1px solid #bdbdbd;
		                        height: 1px;
		                        font-size: 1px;
		                        line-height: 1px;
		                      "
		                    >
		                      &nbsp;
		                    </td>
		                    <td width="74" align="center" style="padding: 0 10px">
		                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
		                        <tr>
		                          <td
		                            align="center"
		                            width="56"
		                            height="56"
		                            style="
		                              width: 56px;
		                              height: 56px;
		                              background: #2a2a2a;
		                              border-radius: 50%;
		                              border: 4px solid #ededed;
		                            "
		                          >
		                            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" style="display: block">
		                              <path
		                                fill="#ffffff"
		                                d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2zm8 10l.9 2.6L23 16l-2.1.4L20 19l-.9-2.6L17 16l2.1-.4L20 12zM4 12l.9 2.6L7 16l-2.1.4L4 19l-.9-2.6L1 16l2.1-.4L4 12z"
		                              />
		                            </svg>
		                          </td>
		                        </tr>
		                      </table>
		                    </td>
		                    <td
		                      style="
		                        border-top: 1px solid #bdbdbd;
		                        height: 1px;
		                        font-size: 1px;
		                        line-height: 1px;
		                      "
		                    >
		                      &nbsp;
		                    </td>
		                  </tr>
		                </table>

		                <div style="height: 14px; line-height: 14px; font-size: 14px">&nbsp;</div>

		                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
		                  <tr>
		                    <td
		                      align="center"
		                      style="
		                        font-family: Arial, Helvetica, sans-serif;
		                        font-size: 30px;
		                        line-height: 36px;
		                        font-weight: 800;
		                        color: #1f1f1f;
		                        padding: 8px 0 12px 0;
		                      "
		                    >
		                      Welcome to Aesterial!
		                    </td>
		                  </tr>

		                  <tr>
		                    <td
		                      align="center"
		                      style="
		                        font-family: Arial, Helvetica, sans-serif;
		                        font-size: 14px;
		                        line-height: 22px;
		                        color: #4a4a4a;
		                        padding: 0 18px 14px 18px;
		                      "
		                    >
		                      Thanks for signing up, {{username}}<br />
		                      Your account is ready — you can start using the service now.
		                    </td>
		                  </tr>

		                  <tr>
		                    <td style="padding: 0 18px 10px 18px">
		                      <div style="border-top: 1px solid #d0d0d0; line-height: 1px; font-size: 1px">&nbsp;</div>
		                    </td>
		                  </tr>

		                  <tr>
		                    <td
		                      align="center"
		                      style="
		                        font-family: Arial, Helvetica, sans-serif;
		                        font-size: 14px;
		                        line-height: 22px;
		                        color: #4a4a4a;
		                        padding: 0 18px 14px 18px;
		                      "
		                    >
		                      To get started, click the button below:
		                    </td>
		                  </tr>

		                  <tr>
		                    <td align="center" style="padding: 0 18px 14px 18px">
		                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
		                        <tr>
		                          <td align="center" bgcolor="#2b2b2b" style="border-radius: 10px">
		                            <a
		                              href="{{redirect_url}}"
		                              style="
		                                display: inline-block;
		                                font-family: Arial, Helvetica, sans-serif;
		                                font-size: 14px;
		                                letter-spacing: 1px;
		                                font-weight: 700;
		                                color: #ffffff;
		                                text-decoration: none;
		                                padding: 14px 42px;
		                                border-radius: 10px;
		                              "
		                            >
		                              GO TO MY ACCOUNT
		                            </a>
		                          </td>
		                        </tr>
		                      </table>
		                    </td>
		                  </tr>

		                  <tr>
		                    <td
		                      align="center"
		                      style="
		                        font-family: Arial, Helvetica, sans-serif;
		                        font-size: 13px;
		                        line-height: 20px;
		                        color: #6a6a6a;
		                        padding: 0 18px 10px 18px;
		                      "
		                    >
		                      If this wasn’t you, you can safely ignore this email or contact support.
		                    </td>
		                  </tr>

		                  <tr>
		                    <td style="padding: 0 18px">
		                      <div style="border-top: 1px solid #d0d0d0; line-height: 1px; font-size: 1px">&nbsp;</div>
		                    </td>
		                  </tr>

		                  <tr>
		                    <td
		                      align="center"
		                      style="
		                        font-family: Arial, Helvetica, sans-serif;
		                        font-size: 14px;
		                        line-height: 22px;
		                        color: #444;
		                        padding: 14px 18px 6px 18px;
		                      "
		                    >
		                      Need help?
		                      <a href="{{support_url}}" style="color: #2b2b2b; text-decoration: underline">Contact support</a>
		                    </td>
		                  </tr>
		                </table>
		              </td>
		            </tr>
		          </table>
		          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width: 640px">
		            <tr>
		              <td align="center" style="padding: 18px 0 6px 0">
		                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
		                  <tr>
		                    <td valign="middle" style="padding: 18px 0 6px 0">
		                      <div style="border-top: 1px solid #d0d0d0; line-height: 1px; font-size: 1px">&nbsp;</div>
		                    </td>
		                    <td width="60" valign="middle" align="center" style="padding: 18px 12px 6px 12px; width: 60px">
		                      <svg viewBox="0 0 64 48" width="34" height="26" role="presentation" style="display: block; color: #1f1f1f">
		                        <path
		                          fill="currentColor"
		                          d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"
		                        />
		                      </svg>
		                    </td>
		                    <td valign="middle" style="padding: 18px 0 6px 0">
		                      <div style="border-top: 1px solid #d0d0d0; line-height: 1px; font-size: 1px">&nbsp;</div>
		                    </td>
		                  </tr>
		                </table>
		              </td>
		            </tr>

		            <tr>
		              <td
		                align="center"
		                style="
		                  font-family: Arial, Helvetica, sans-serif;
		                  font-size: 12px;
		                  line-height: 18px;
		                  color: #8a8a8a;
		                  padding: 10px 18px 2px 18px;
		                "
		              >
		                Copyright © 2026 <span style="color: #2b2b2b">Aesterial</span>
		              </td>
		            </tr>

		            <tr>
		              <td
		                align="center"
		                style="
		                  font-family: Arial, Helvetica, sans-serif;
		                  font-size: 12px;
		                  line-height: 18px;
		                  color: #8a8a8a;
		                  padding: 0 18px 28px 18px;
		                "
		              >
		                <a href="{{privacy_url}}" style="color: #8a8a8a; text-decoration: underline">Privacy Policy</a>
		              </td>
		            </tr>
		          </table>

		        </td>
		      </tr>
		    </table>
		  </body>
		</html>
	`,
}

var VerifyEmail template = template{
	Ru: `<!doctype html>
	<html lang="ru">
	  <head>
	    <meta charset="utf-8" />
	    <meta name="viewport" content="width=device-width,initial-scale=1" />
	    <meta name="x-apple-disable-message-reformatting" />
	    <title>Aesterial — Подтверждение аккаунта</title>
	  </head>
	  <body style="margin: 0; padding: 0; background: #f3f3f3">
	    <table
	      role="presentation"
	      cellpadding="0"
	      cellspacing="0"
	      border="0"
	      width="100%"
	      style="background: #f3f3f3"
	    >
	      <tr>
	        <td align="center" style="padding: 28px 16px 10px 16px">
	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="max-width: 640px"
	          >
	            <tr>
	              <td align="center" style="padding: 0 0 18px 0">
	                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                  <tr>
	                    <td valign="middle" style="padding: 0">
	                      <div style="border-top: 2px solid #3a3a3a; line-height: 1px; font-size: 1px">
	                        &nbsp;
	                      </div>
	                    </td>
	                    <td
	                      width="180"
	                      valign="middle"
	                      align="center"
	                      style="
	                        width: 180px;
	                        padding: 0 14px;
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 24px;
	                        letter-spacing: 3px;
	                        font-weight: 700;
	                        color: #1f1f1f;
	                        white-space: nowrap;
	                      "
	                    >
	                      AESTERIAL
	                    </td>
	                    <td valign="middle" style="padding: 0">
	                      <div style="border-top: 2px solid #3a3a3a; line-height: 1px; font-size: 1px">
	                        &nbsp;
	                      </div>
	                    </td>
	                  </tr>
	                </table>
	              </td>
	            </tr>
	          </table>
	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="
	              max-width: 640px;
	              background: #f8f8f8;
	              border: 1px solid #d8d8d8;
	              border-radius: 14px;
	            "
	          >
	            <tr>
	              <td style="padding: 18px 22px 24px 22px">
	                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                  <tr>
	                    <td
	                      style="
	                        border-top: 1px solid #bdbdbd;
	                        height: 1px;
	                        font-size: 1px;
	                        line-height: 1px;
	                      "
	                    >
	                      &nbsp;
	                    </td>
	                    <td width="74" align="center" style="padding: 0 10px">
	                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                        <tr>
	                          <td
	                            align="center"
	                            width="56"
	                            height="56"
	                            style="
	                              width: 56px;
	                              height: 56px;
	                              background: #2a2a2a;
	                              border-radius: 50%;
	                              border: 4px solid #ededed;
	                            "
	                          >
	                            <svg
	                              width="26"
	                              height="26"
	                              viewBox="0 0 24 24"
	                              aria-hidden="true"
	                              style="display: block"
	                            >
	                              <path
	                                fill="#ffffff"
	                                d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V7Z"
	                              />
	                            </svg>
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                    <td
	                      style="
	                        border-top: 1px solid #bdbdbd;
	                        height: 1px;
	                        font-size: 1px;
	                        line-height: 1px;
	                      "
	                    >
	                      &nbsp;
	                    </td>
	                  </tr>
	                </table>
	
	                <div style="height: 14px; line-height: 14px; font-size: 14px">&nbsp;</div>
	
	                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 34px;
	                        line-height: 40px;
	                        font-weight: 800;
	                        color: #1f1f1f;
	                        padding: 8px 0 10px 0;
	                      "
	                    >
	                      Подтвердите аккаунт
	                    </td>
	                  </tr>
	
	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #4a4a4a;
	                        padding: 0 18px 16px 18px;
	                      "
	                    >
	                      Вы запросили подтверждение email для аккаунта Aesterial.<br />
	                      Чтобы подтвердить адрес, нажмите кнопку ниже.
	                    </td>
	                  </tr>
	
	                  <tr>
	                    <td align="center" style="padding: 0 18px 14px 18px">
	                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                        <tr>
	                          <td align="center" bgcolor="#2b2b2b" style="border-radius: 10px">
	                            <a
	                              href="{{redirect_url}}"
	                              style="
	                                display: inline-block;
	                                font-family: Arial, Helvetica, sans-serif;
	                                font-size: 14px;
	                                letter-spacing: 1px;
	                                font-weight: 700;
	                                color: #ffffff;
	                                text-decoration: none;
	                                padding: 14px 42px;
	                                border-radius: 10px;
	                              "
	                            >
	                              ПОДТВЕРДИТЬ АККАУНТ
	                            </a>
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                  </tr>
	
	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #4a4a4a;
	                        padding: 0 18px 6px 18px;
	                      "
	                    >
	                      Возникли проблемы?
	                      <a href="{{support_url}}" style="color: #2b2b2b; text-decoration: underline"
	                        >Свяжитесь со службой поддержки</a
	                      >
	                    </td>
	                  </tr>
	
	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #4a4a4a;
	                        padding: 0 18px 6px 18px;
	                      "
	                    >
	                      Если вы не запрашивали подтверждение — просто проигнорируйте это письмо.
	                    </td>
	                  </tr>
	                </table>
	              </td>
	            </tr>
	          </table>
	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="max-width: 640px"
	          >
	            <tr>
	              <td align="center" style="padding: 18px 0 6px 0">
	                <div style="display: inline-block; width: 34px">
	                  <svg viewBox="0 0 64 48" role="presentation">
	                    <path
	                      fill="currentColor"
	                      d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"
	                    />
	                  </svg>
	                </div>
	              </td>
	            </tr>
	
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 13px;
	                  line-height: 20px;
	                  color: #8a8a8a;
	                  padding: 0 18px 12px 18px;
	                "
	              >
	                Ссылка будет действительна в течение 24 часов.<br />
	                Если у вас есть вопросы или нужна помощь — мы рядом.
	              </td>
	            </tr>
	
	            <tr>
	              <td align="center" style="padding: 8px 18px 10px 18px">
	                <div
	                  style="
	                    border-top: 1px solid #d0d0d0;
	                    max-width: 520px;
	                    margin: 0 auto;
	                    line-height: 1px;
	                    font-size: 1px;
	                  "
	                >
	                  &nbsp;
	                </div>
	              </td>
	            </tr>
	
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 12px;
	                  line-height: 18px;
	                  color: #8a8a8a;
	                  padding: 0 18px 2px 18px;
	                "
	              >
	                Copyright © 2026 <span style="color: #2b2b2b">Aesterial</span>
	              </td>
	            </tr>
	
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 12px;
	                  line-height: 18px;
	                  color: #8a8a8a;
	                  padding: 0 18px 28px 18px;
	                "
	              >
	                <a href="{{privacy_url}}" style="color: #8a8a8a; text-decoration: underline"
	                  >Политика конфиденциальности</a
	                >
	              </td>
	            </tr>
	          </table>
	        </td>
	      </tr>
	    </table>
	  </body>
	</html>
	`,
	En: `<!doctype html>
	<html lang="en">
	  <head>
	    <meta charset="utf-8" />
	    <meta name="viewport" content="width=device-width,initial-scale=1" />
	    <meta name="x-apple-disable-message-reformatting" />
	    <title>Aesterial — Verify Account</title>
	  </head>
	  <body style="margin: 0; padding: 0; background: #f3f3f3">
	    <table
	      role="presentation"
	      cellpadding="0"
	      cellspacing="0"
	      border="0"
	      width="100%"
	      style="background: #f3f3f3"
	    >
	      <tr>
	        <td align="center" style="padding: 28px 16px 10px 16px">
	          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;">
	  <tr>
	    <td align="center" style="padding:0 0 18px 0;">
	      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	        <tr>
	          <td valign="middle" style="padding:0;">
	            <div style="border-top:2px solid #3a3a3a; line-height:1px; font-size:1px;">&nbsp;</div>
	          </td>

	          <td width="180" valign="middle" align="center"
	              style="width:180px;padding:0 14px;font-family:Arial,Helvetica,sans-serif;font-size:24px;letter-spacing:3px;font-weight:700;color:#1f1f1f;white-space:nowrap;">
	            AESTERIAL
	          </td>

	          <td valign="middle" style="padding:0;">
	            <div style="border-top:2px solid #3a3a3a; line-height:1px; font-size:1px;">&nbsp;</div>
	          </td>
	        </tr>
	      </table>
	    </td>
	  </tr>
	</table>


	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="
	              max-width: 640px;
	              background: #f8f8f8;
	              border: 1px solid #d8d8d8;
	              border-radius: 14px;
	            "
	          >
	            <tr>
	              <td style="padding: 18px 22px 24px 22px">
	                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                  <tr>
	                    <td
	                      style="
	                        border-top: 1px solid #bdbdbd;
	                        height: 1px;
	                        font-size: 1px;
	                        line-height: 1px;
	                      "
	                    >
	                      &nbsp;
	                    </td>
	                    <td width="74" align="center" style="padding: 0 10px">
	                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                        <tr>
	                          <td
	                            align="center"
	                            width="56"
	                            height="56"
	                            style="
	                              width: 56px;
	                              height: 56px;
	                              background: #2a2a2a;
	                              border-radius: 50%;
	                              border: 4px solid #ededed;
	                            "
	                          >
	                            <svg
	                              width="26"
	                              height="26"
	                              viewBox="0 0 24 24"
	                              aria-hidden="true"
	                              style="display: block"
	                            >
	                              <path
	                                fill="#ffffff"
	                                d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V7Z"
	                              />
	                            </svg>
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                    <td
	                      style="
	                        border-top: 1px solid #bdbdbd;
	                        height: 1px;
	                        font-size: 1px;
	                        line-height: 1px;
	                      "
	                    >
	                      &nbsp;
	                    </td>
	                  </tr>
	                </table>

	                <div style="height: 14px; line-height: 14px; font-size: 14px">&nbsp;</div>

	                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 34px;
	                        line-height: 40px;
	                        font-weight: 800;
	                        color: #1f1f1f;
	                        padding: 8px 0 10px 0;
	                      "
	                    >
	                      Verify your account
	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #4a4a4a;
	                        padding: 0 18px 16px 18px;
	                      "
	                    >
	                      You requested an email verification for your Aesterial account.<br />
	                      To verify your email address, use the code below or click the button.
	                    </td>
	                  </tr>

	                  <tr>
	                    <td align="center" style="padding: 0 18px 14px 18px">
	                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                        <tr>
	                          <td align="center" bgcolor="#2b2b2b" style="border-radius: 10px">
	                            <a
	                              href="{{redirect_url}}"
	                              style="
	                                display: inline-block;
	                                font-family: Arial, Helvetica, sans-serif;
	                                font-size: 14px;
	                                letter-spacing: 1px;
	                                font-weight: 700;
	                                color: #ffffff;
	                                text-decoration: none;
	                                padding: 14px 42px;
	                                border-radius: 10px;
	                              "
	                            >
	                              VERIFY MY ACCOUNT
	                            </a>
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                  </tr>



	                  <tr>
	                    <td align="center" style="padding: 0 18px 14px 18px">

	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #4a4a4a;
	                        padding: 0 18px 6px 18px;
	                      "
	                    >
	                      Having trouble?
	                      <a href="{{support_url}}" style="color: #2b2b2b; text-decoration: underline"
	                        >Contact our support team</a
	                      >
	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #4a4a4a;
	                        padding: 0 18px 6px 18px;
	                      "
	                    >
	                      Didn’t request an account verification? You can safely ignore this email.
	                    </td>
	                  </tr>
	                </table>
	              </td>
	            </tr>
	          </table>

	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="max-width: 640px"
	          >
	            <tr>
	              <td align="center" style="padding: 18px 0 6px 0">
	                <div style="display:inline-block;width:34px;">
	                  <svg viewBox="0 0 64 48" role="presentation" className="{className}">
	                    <path
	                      fill="currentColor"
	                      d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"
	                    />
	                  </svg>
	                </div>
	              </td>
	            </tr>
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 13px;
	                  line-height: 20px;
	                  color: #8a8a8a;
	                  padding: 0 18px 12px 18px;
	                "
	              >
	                This link will expire in the next 24 hours.<br />
	                Please let us know if you have any questions or concerns, we’re here to help.
	              </td>
	            </tr>
	            <tr>
	              <td align="center" style="padding: 8px 18px 10px 18px">
	                <div
	                  style="
	                    border-top: 1px solid #d0d0d0;
	                    max-width: 520px;
	                    margin: 0 auto;
	                    line-height: 1px;
	                    font-size: 1px;
	                  "
	                >
	                  &nbsp;
	                </div>
	              </td>
	            </tr>
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 12px;
	                  line-height: 18px;
	                  color: #8a8a8a;
	                  padding: 0 18px 2px 18px;
	                "
	              >
	                Copyright © 2026 <span style="color: #2b2b2b">Aesterial</span>
	              </td>
	            </tr>
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 12px;
	                  line-height: 18px;
	                  color: #8a8a8a;
	                  padding: 0 18px 28px 18px;
	                "
	              >
	                <a href="{{privacy_url}}" style="color: #8a8a8a; text-decoration: underline"
	                  >Privacy Policy</a
	                >
	              </td>
	            </tr>
	          </table>
	        </td>
	      </tr>
	    </table>
	  </body>
	</html>
	`,
}

// requires only redirect_url variable
var ResetPassword template = template{
	Ru: `<!doctype html>
	<html lang="ru">
	<head>
	  <meta charset="utf-8" />
	  <meta name="viewport" content="width=device-width,initial-scale=1" />
	  <meta name="x-apple-disable-message-reformatting" />
	  <title>Aesterial — Сброс пароля</title>
	</head>
	<body style="margin:0;padding:0;background:#f3f3f3;">
	  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f3f3;">
	    <tr>
	      <td align="center" style="padding:28px 16px 10px 16px;">

	        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;">
	          <tr>
	            <td align="center" style="padding:0 0 18px 0;">
	              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                <tr>
	                  <td valign="middle" style="padding:0;"><div style="border-top:2px solid #3a3a3a;line-height:1px;font-size:1px;">&nbsp;</div></td>
	                  <td width="180" valign="middle" align="center" style="width:180px;padding:0 14px;font-family:Arial,Helvetica,sans-serif;font-size:24px;letter-spacing:3px;font-weight:700;color:#1f1f1f;white-space:nowrap;">
	                    AESTERIAL
	                  </td>
	                  <td valign="middle" style="padding:0;"><div style="border-top:2px solid #3a3a3a;line-height:1px;font-size:1px;">&nbsp;</div></td>
	                </tr>
	              </table>
	            </td>
	          </tr>
	        </table>

	        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:#f8f8f8;border:1px solid #d8d8d8;border-radius:14px;">
	          <tr>
	            <td style="padding:18px 22px 24px 22px;">

	              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                <tr>
	                  <td style="border-top:1px solid #bdbdbd;height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
	                  <td width="74" align="center" style="padding:0 10px;">
	                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                      <tr>
	                        <td align="center" width="56" height="56" style="width:56px;height:56px;background:#2a2a2a;border-radius:50%;border:4px solid #ededed;">
	                          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" style="display:block;">
	                            <path fill="#ffffff" d="M7 14a5 5 0 1 1 3.9 4.9L9 21H7v-2H5v-2.1l3.1-3.1A5 5 0 0 1 7 14Zm10-5a2 2 0 1 0 0 .001V9Z"/>
	                          </svg>
	                        </td>
	                      </tr>
	                    </table>
	                  </td>
	                  <td style="border-top:1px solid #bdbdbd;height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
	                </tr>
	              </table>

	              <div style="height:14px;line-height:14px;font-size:14px;">&nbsp;</div>

	              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:32px;line-height:38px;font-weight:800;color:#1f1f1f;padding:8px 0 10px 0;">
	                    Сброс пароля
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4a4a4a;padding:0 18px 14px 18px;">
	                    Мы получили запрос на сброс пароля для вашей учётной записи Aesterial.
	                  </td>
	                </tr>

	                <tr>
	                  <td style="padding:0 18px 10px 18px;">
	                    <div style="border-top:1px solid #d0d0d0;line-height:1px;font-size:1px;">&nbsp;</div>
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4a4a4a;padding:0 18px 14px 18px;">
	                    Нажмите кнопку ниже, чтобы сбросить пароль:
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="padding:0 18px 14px 18px;">
	                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                      <tr>
	                        <td align="center" bgcolor="#2b2b2b" style="border-radius:10px;">
	                          <a href="{{redirect_url}}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;letter-spacing:1px;font-weight:700;color:#ffffff;text-decoration:none;padding:14px 42px;border-radius:10px;">
	                            СБРОСИТЬ ПАРОЛЬ
	                          </a>
	                        </td>
	                      </tr>
	                    </table>
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#6a6a6a;padding:0 18px 12px 18px;">
	                    Если вы не запрашивали сброс, просто проигнорируйте это письмо — пароль останется прежним.
	                  </td>
	                </tr>

	                <tr>
	                  <td style="padding:0 18px;">
	                    <div style="border-top:1px solid #d0d0d0;line-height:1px;font-size:1px;">&nbsp;</div>
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#444;padding:14px 18px 6px 18px;">
	                    Нужна помощь? <a href="{{support_url}}" style="color:#2b2b2b;text-decoration:underline;">Свяжитесь со службой поддержки</a>
	                  </td>
	                </tr>
	              </table>

	            </td>
	          </tr>
	        </table>

	        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;">
	          <tr>
	            <td align="center" style="padding: 18px 0 6px 0">
	              <div style="display:inline-block;width:34px;">
	                <svg viewBox="0 0 64 48" role="presentation">
	                  <path fill="currentColor" d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"/>
	                </svg>
	              </div>
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#8a8a8a;padding:0 18px 12px 18px;">
	              Ссылка будет действительна в течение 24 часов.<br/>
	              Если у вас есть вопросы или нужна помощь — мы рядом.
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="padding:8px 18px 10px 18px;">
	              <div style="border-top:1px solid #d0d0d0;max-width:520px;margin:0 auto;line-height:1px;font-size:1px;">&nbsp;</div>
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8a8a8a;padding:0 18px 2px 18px;">
	              Copyright © 2026 <span style="color:#2b2b2b;">Aesterial</span>
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8a8a8a;padding:0 18px 28px 18px;">
	              <a href="{{privacy_url}}" style="color:#8a8a8a;text-decoration:underline;">Политика конфиденциальности</a>
	            </td>
	          </tr>
	        </table>

	      </td>
	    </tr>
	  </table>
	</body>
	</html>
	`,
	En: `<!doctype html>
	<html lang="en">
	  <head>
	    <meta charset="utf-8" />
	    <meta name="viewport" content="width=device-width,initial-scale=1" />
	    <meta name="x-apple-disable-message-reformatting" />
	    <title>Aesterial — Reset Password</title>
	  </head>
	  <body style="margin: 0; padding: 0; background: #f3f3f3">
	    <table
	      role="presentation"
	      cellpadding="0"
	      cellspacing="0"
	      border="0"
	      width="100%"
	      style="background: #f3f3f3"
	    >
	      <tr>
	        <td align="center" style="padding: 28px 16px 10px 16px">
	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="max-width: 640px"
	          >
	            <tr>
	              <td align="center" style="padding: 0 0 18px 0">
	                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                  <tr>
	                    <td valign="middle" style="padding: 0">
	                      <div style="border-top: 2px solid #3a3a3a; line-height: 1px; font-size: 1px">
	                        &nbsp;
	                      </div>
	                    </td>

	                    <td
	                      width="180"
	                      valign="middle"
	                      align="center"
	                      style="
	                        width: 180px;
	                        padding: 0 14px;
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 24px;
	                        letter-spacing: 3px;
	                        font-weight: 700;
	                        color: #1f1f1f;
	                        white-space: nowrap;
	                      "
	                    >
	                      AESTERIAL
	                    </td>
	                    <td valign="middle" style="padding: 0">
	                      <div style="border-top: 2px solid #3a3a3a; line-height: 1px; font-size: 1px">
	                        &nbsp;
	                      </div>
	                    </td>
	                  </tr>
	                </table>
	              </td>
	            </tr>
	          </table>

	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="
	              max-width: 640px;
	              background: #f8f8f8;
	              border: 1px solid #d8d8d8;
	              border-radius: 14px;
	            "
	          >
	            <tr>
	              <td style="padding: 18px 22px 24px 22px">
	                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                  <tr>
	                    <td
	                      style="
	                        border-top: 1px solid #bdbdbd;
	                        height: 1px;
	                        font-size: 1px;
	                        line-height: 1px;
	                      "
	                    >
	                      &nbsp;
	                    </td>
	                    <td width="74" align="center" style="padding: 0 10px">
	                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                        <tr>
	                          <td
	                            align="center"
	                            width="56"
	                            height="56"
	                            style="
	                              width: 56px;
	                              height: 56px;
	                              background: #2a2a2a;
	                              border-radius: 50%;
	                              border: 4px solid #ededed;
	                            "
	                          >
	                            <svg
	                              width="26"
	                              height="26"
	                              viewBox="0 0 24 24"
	                              aria-hidden="true"
	                              style="display: block"
	                            >
	                              <path
	                                fill="#ffffff"
	                                d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V7Z"
	                              />
	                            </svg>
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                    <td
	                      style="
	                        border-top: 1px solid #bdbdbd;
	                        height: 1px;
	                        font-size: 1px;
	                        line-height: 1px;
	                      "
	                    >
	                      &nbsp;
	                    </td>
	                  </tr>
	                </table>

	                <div style="height: 14px; line-height: 14px; font-size: 14px">&nbsp;</div>

	                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 32px;
	                        line-height: 38px;
	                        font-weight: 800;
	                        color: #1f1f1f;
	                        padding: 8px 0 10px 0;
	                      "
	                    >
	                      Reset your password
	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #4a4a4a;
	                        padding: 0 18px 14px 18px;
	                      "
	                    >
	                      We received a request to reset the password for your Aesterial account.
	                    </td>
	                  </tr>

	                  <tr>
	                    <td style="padding: 0 18px 10px 18px">
	                      <div style="border-top: 1px solid #d0d0d0; line-height: 1px; font-size: 1px">
	                        &nbsp;
	                      </div>
	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #4a4a4a;
	                        padding: 0 18px 14px 18px;
	                      "
	                    >
	                      Click the button below to reset your password:
	                    </td>
	                  </tr>

	                  <tr>
	                    <td align="center" style="padding: 0 18px 14px 18px">
	                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                        <tr>
	                          <td align="center" bgcolor="#2b2b2b" style="border-radius: 10px">
	                            <a
	                              href="{{redirect_url}}"
	                              style="
	                                display: inline-block;
	                                font-family: Arial, Helvetica, sans-serif;
	                                font-size: 14px;
	                                letter-spacing: 1px;
	                                font-weight: 700;
	                                color: #ffffff;
	                                text-decoration: none;
	                                padding: 14px 42px;
	                                border-radius: 10px;
	                              "
	                            >
	                              RESET PASSWORD
	                            </a>
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 13px;
	                        line-height: 20px;
	                        color: #6a6a6a;
	                        padding: 0 18px 12px 18px;
	                      "
	                    >
	                      If you did not request this, please ignore this email. Your password will
	                      remain unchanged.
	                    </td>
	                  </tr>

	                  <tr>
	                    <td style="padding: 0 18px">
	                      <div style="border-top: 1px solid #d0d0d0; line-height: 1px; font-size: 1px">
	                        &nbsp;
	                      </div>
	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #444;
	                        padding: 14px 18px 6px 18px;
	                      "
	                    >
	                      Need help?
	                      <a href="{{support_url}}" style="color: #2b2b2b; text-decoration: underline"
	                        >Contact our support team</a
	                      >
	                    </td>
	                  </tr>
	                </table>
	              </td>
	            </tr>
	          </table>

	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="max-width: 640px"
	          >
	            <tr>
	              <td align="center" style="padding: 18px 0 6px 0">
	                <div style="display: inline-block; width: 34px">
	                  <svg viewBox="0 0 64 48" role="presentation" className="{className}">
	                    <path
	                      fill="currentColor"
	                      d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"
	                    />
	                  </svg>
	                </div>
	              </td>
	            </tr>
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 13px;
	                  line-height: 20px;
	                  color: #8a8a8a;
	                  padding: 0 18px 12px 18px;
	                "
	              >
	                This link will expire in the next 24 hours.<br />
	                If you have any questions or need assistance, we’re here to help.
	              </td>
	            </tr>
	            <tr>
	              <td align="center" style="padding: 8px 18px 10px 18px">
	                <div
	                  style="
	                    border-top: 1px solid #d0d0d0;
	                    max-width: 520px;
	                    margin: 0 auto;
	                    line-height: 1px;
	                    font-size: 1px;
	                  "
	                >
	                  &nbsp;
	                </div>
	              </td>
	            </tr>
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 12px;
	                  line-height: 18px;
	                  color: #8a8a8a;
	                  padding: 0 18px 2px 18px;
	                "
	              >
	                Copyright © 2026 <span style="color: #2b2b2b">Aesterial</span>
	              </td>
	            </tr>
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 12px;
	                  line-height: 18px;
	                  color: #8a8a8a;
	                  padding: 0 18px 28px 18px;
	                "
	              >
	                <a href="{{privacy_url}}" style="color: #8a8a8a; text-decoration: underline"
	                  >Privacy Policy</a
	                >
	              </td>
	            </tr>
	          </table>
	        </td>
	      </tr>
	    </table>
	  </body>
	</html>
	`,
}

var TickerCreation template = template{
	En: `
	<!doctype html>
	<html lang="en">
	<head>
	  <meta charset="utf-8" />
	  <meta name="viewport" content="width=device-width,initial-scale=1" />
	  <meta name="x-apple-disable-message-reformatting" />
	  <title>Aesterial — Ticket Created</title>
	</head>
	<body style="margin:0;padding:0;background:#f3f3f3;">
	  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f3f3;">
	    <tr>
	      <td align="center" style="padding:28px 16px 10px 16px;">

	        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;">
	  <tr>
	    <td align="center" style="padding:0 0 18px 0;">
	      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	        <tr>
	          <td valign="middle" style="padding:0;">
	            <div style="border-top:2px solid #3a3a3a; line-height:1px; font-size:1px;">&nbsp;</div>
	          </td>

	          <td width="180" valign="middle" align="center"
	              style="width:180px;padding:0 14px;font-family:Arial,Helvetica,sans-serif;font-size:24px;letter-spacing:3px;font-weight:700;color:#1f1f1f;white-space:nowrap;">
	            AESTERIAL
	          </td>

	          <td valign="middle" style="padding:0;">
	            <div style="border-top:2px solid #3a3a3a; line-height:1px; font-size:1px;">&nbsp;</div>
	          </td>
	        </tr>
	      </table>
	    </td>
	  </tr>
	</table>


	        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:#f8f8f8;border:1px solid #d8d8d8;border-radius:14px;">
	          <tr>
	            <td style="padding:18px 22px 24px 22px;">

	              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                <tr>
	                  <td style="border-top:1px solid #bdbdbd;height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
	                  <td width="74" align="center" style="padding:0 10px;">
	                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                      <tr>
	                        <td align="center" width="56" height="56" style="width:56px;height:56px;background:#2a2a2a;border-radius:50%;border:4px solid #ededed;">
	                          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style="display:block;">
	                            <path fill="#ffffff" d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V7zm7 1h2v2h-2V8zm0 4h2v2h-2v-2z"/>
	                          </svg>
	                        </td>
	                      </tr>
	                    </table>
	                  </td>
	                  <td style="border-top:1px solid #bdbdbd;height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
	                </tr>
	              </table>

	              <div style="height:14px;line-height:14px;font-size:14px;">&nbsp;</div>

	              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:34px;font-weight:800;color:#1f1f1f;padding:8px 0 12px 0;">
	                    New support ticket created
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4a4a4a;padding:0 18px 14px 18px;">
	                    Your support request has been successfully created with the<br/>
	                    following details:
	                  </td>
	                </tr>

	                <tr>
	                  <td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4a4a4a;padding:0 18px 6px 18px;">
	                    <span style="color:#2b2b2b;font-weight:700;">Created on</span> {{date}}:
	                  </td>
	                </tr>

	                <tr>
	                  <td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#2b2b2b;padding:10px 18px 8px 18px;font-weight:700;">
	                    Problem description:
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="padding:0 18px 18px 18px;">
	                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f1f1;border:1px solid #d2d2d2;border-radius:8px;">
	                      <tr>
	                        <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:18px;letter-spacing:1px;font-weight:800;color:#3a3a3a;padding:18px;">
	                          {{content}}
	                        </td>
	                      </tr>
	                    </table>
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="padding:0 18px 14px 18px;">
	                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                      <tr>
	                        <td align="center" bgcolor="#2b2b2b" style="border-radius:10px;">
	                          <a href="{{redirect_url}}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;letter-spacing:1px;font-weight:700;color:#ffffff;text-decoration:none;padding:14px 42px;border-radius:10px;">
	                            VIEW TICKET
	                          </a>
	                        </td>
	                      </tr>
	                    </table>
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#6a6a6a;padding:0 18px 16px 18px;">
	                    You can view and track your support request by clicking the button above.
	                  </td>
	                </tr>

	              </table>

	            </td>
	          </tr>
	        </table>

	        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;">
	          <tr>
	              <td align="center" style="padding: 18px 0 6px 0">
	                <div style="display:inline-block;width:34px;">
	                  <svg viewBox="0 0 64 48" role="presentation" className="{className}">
	                    <path
	                      fill="currentColor"
	                      d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"
	                    />
	                  </svg>
	                </div>
	              </td>
	            </tr>
	          <tr>
	            <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#6a6a6a;padding:0 18px 14px 18px;">
	              If you have any questions, feel free to contact our support team.
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="padding:8px 18px 10px 18px;">
	              <div style="border-top:1px solid #d0d0d0;max-width:520px;margin:0 auto;line-height:1px;font-size:1px;">&nbsp;</div>
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8a8a8a;padding:0 18px 2px 18px;">
	              Copyright © 2026 <span style="color:#2b2b2b;">Aesterial</span>
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8a8a8a;padding:0 18px 28px 18px;">
	              <a href="{{privacy_url}}" style="color:#8a8a8a;text-decoration:underline;">Privacy Policy</a>
	            </td>
	          </tr>
	        </table>

	      </td>
	    </tr>
	  </table>
	</body>
	</html>
	`,
	Ru: `
	<!doctype html>
	<html lang="ru">
	<head>
	  <meta charset="utf-8" />
	  <meta name="viewport" content="width=device-width,initial-scale=1" />
	  <meta name="x-apple-disable-message-reformatting" />
	  <title>Aesterial — Обращение создано</title>
	</head>
	<body style="margin:0;padding:0;background:#f3f3f3;">
	  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f3f3;">
	    <tr>
	      <td align="center" style="padding:28px 16px 10px 16px;">

	        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;">
	          <tr>
	            <td align="center" style="padding:0 0 18px 0;">
	              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                <tr>
	                  <td valign="middle" style="padding:0;"><div style="border-top:2px solid #3a3a3a;line-height:1px;font-size:1px;">&nbsp;</div></td>
	                  <td width="180" valign="middle" align="center" style="width:180px;padding:0 14px;font-family:Arial,Helvetica,sans-serif;font-size:24px;letter-spacing:3px;font-weight:700;color:#1f1f1f;white-space:nowrap;">
	                    AESTERIAL
	                  </td>
	                  <td valign="middle" style="padding:0;"><div style="border-top:2px solid #3a3a3a;line-height:1px;font-size:1px;">&nbsp;</div></td>
	                </tr>
	              </table>
	            </td>
	          </tr>
	        </table>

	        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:#f8f8f8;border:1px solid #d8d8d8;border-radius:14px;">
	          <tr>
	            <td style="padding:18px 22px 24px 22px;">

	              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                <tr>
	                  <td style="border-top:1px solid #bdbdbd;height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
	                  <td width="74" align="center" style="padding:0 10px;">
	                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                      <tr>
	                        <td align="center" width="56" height="56" style="width:56px;height:56px;background:#2a2a2a;border-radius:50%;border:4px solid #ededed;">
	                          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style="display:block;">
	                            <path fill="#ffffff" d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V7zm7 1h2v2h-2V8zm0 4h2v2h-2v-2z"/>
	                          </svg>
	                        </td>
	                      </tr>
	                    </table>
	                  </td>
	                  <td style="border-top:1px solid #bdbdbd;height:1px;font-size:1px;line-height:1px;">&nbsp;</td>
	                </tr>
	              </table>

	              <div style="height:14px;line-height:14px;font-size:14px;">&nbsp;</div>

	              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:34px;font-weight:800;color:#1f1f1f;padding:8px 0 12px 0;">
	                    Создано новое обращение в поддержку
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4a4a4a;padding:0 18px 14px 18px;">
	                    Ваше обращение успешно создано со следующими данными:
	                  </td>
	                </tr>

	                <tr>
	                  <td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#4a4a4a;padding:0 18px 6px 18px;">
	                    <span style="color:#2b2b2b;font-weight:700;">Дата создания:</span> {{date}}
	                  </td>
	                </tr>

	                <tr>
	                  <td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#2b2b2b;padding:10px 18px 8px 18px;font-weight:700;">
	                    Описание проблемы:
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="padding:0 18px 18px 18px;">
	                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f1f1;border:1px solid #d2d2d2;border-radius:8px;">
	                      <tr>
	                        <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:18px;letter-spacing:1px;font-weight:800;color:#3a3a3a;padding:18px;">
	                          {{content}}
	                        </td>
	                      </tr>
	                    </table>
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="padding:0 18px 14px 18px;">
	                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                      <tr>
	                        <td align="center" bgcolor="#2b2b2b" style="border-radius:10px;">
	                          <a href="{{redirect_url}}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;letter-spacing:1px;font-weight:700;color:#ffffff;text-decoration:none;padding:14px 42px;border-radius:10px;">
	                            ОТКРЫТЬ ОБРАЩЕНИЕ
	                          </a>
	                        </td>
	                      </tr>
	                    </table>
	                  </td>
	                </tr>

	                <tr>
	                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#6a6a6a;padding:0 18px 16px 18px;">
	                    Вы можете открыть и отслеживать обращение, нажав кнопку выше.
	                  </td>
	                </tr>
	              </table>

	            </td>
	          </tr>
	        </table>

	        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;">
	          <tr>
	            <td align="center" style="padding: 18px 0 6px 0">
	              <div style="display:inline-block;width:34px;">
	                <svg viewBox="0 0 64 48" role="presentation">
	                  <path fill="currentColor" d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"/>
	                </svg>
	              </div>
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#6a6a6a;padding:0 18px 14px 18px;">
	              Если у вас есть вопросы — напишите в нашу службу поддержки.
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="padding:8px 18px 10px 18px;">
	              <div style="border-top:1px solid #d0d0d0;max-width:520px;margin:0 auto;line-height:1px;font-size:1px;">&nbsp;</div>
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8a8a8a;padding:0 18px 2px 18px;">
	              Copyright © 2026 <span style="color:#2b2b2b;">Aesterial</span>
	            </td>
	          </tr>
	          <tr>
	            <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8a8a8a;padding:0 18px 28px 18px;">
	              <a href="{{privacy_url}}" style="color:#8a8a8a;text-decoration:underline;">Политика конфиденциальности</a>
	            </td>
	          </tr>
	        </table>

	      </td>
	    </tr>
	  </table>
	</body>
	</html>
	`,
}

// requires creator to fill sender point, and content to fill {{content}}
var TicketMessageCreation template = template{
	En: `<!doctype html>
	<html lang="en">
	  <head>
	    <meta charset="utf-8" />
	    <meta name="viewport" content="width=device-width,initial-scale=1" />
	    <meta name="x-apple-disable-message-reformatting" />
	    <title>Aesterial — Support Thread</title>
	  </head>
	  <body style="margin: 0; padding: 0; background: #f3f3f3">
	    <table
	      role="presentation"
	      cellpadding="0"
	      cellspacing="0"
	      border="0"
	      width="100%"
	      style="background: #f3f3f3"
	    >
	      <tr>
	        <td align="center" style="padding: 28px 16px 10px 16px">
	          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;">
	  <tr>
	    <td align="center" style="padding:0 0 18px 0;">
	      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	        <tr>
	          <td valign="middle" style="padding:0;">
	            <div style="border-top:2px solid #3a3a3a; line-height:1px; font-size:1px;">&nbsp;</div>
	          </td>

	          <td width="180" valign="middle" align="center"
	              style="width:180px;padding:0 14px;font-family:Arial,Helvetica,sans-serif;font-size:24px;letter-spacing:3px;font-weight:700;color:#1f1f1f;white-space:nowrap;">
	            AESTERIAL
	          </td>

	          <td valign="middle" style="padding:0;">
	            <div style="border-top:2px solid #3a3a3a; line-height:1px; font-size:1px;">&nbsp;</div>
	          </td>
	        </tr>
	      </table>
	    </td>
	  </tr>
	</table>

	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="
	              max-width: 640px;
	              background: #f8f8f8;
	              border: 1px solid #d8d8d8;
	              border-radius: 14px;
	            "
	          >
	            <tr>
	              <td style="padding: 18px 22px 24px 22px">
	                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                  <tr>
	                    <td
	                      style="
	                        border-top: 1px solid #bdbdbd;
	                        height: 1px;
	                        font-size: 1px;
	                        line-height: 1px;
	                      "
	                    >
	                      &nbsp;
	                    </td>
	                    <td width="74" align="center" style="padding: 0 10px">
	                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                        <tr>
	                          <td
	                            align="center"
	                            width="56"
	                            height="56"
	                            style="
	                              width: 56px;
	                              height: 56px;
	                              background: #2a2a2a;
	                              border-radius: 50%;
	                              border: 4px solid #ededed;
	                            "
	                          >
	                            <svg
	                              width="26"
	                              height="26"
	                              viewBox="0 0 24 24"
	                              aria-hidden="true"
	                              style="display: block"
	                            >
	                              <path
	                                fill="#ffffff"
	                                d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
	                              />
	                            </svg>
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                    <td
	                      style="
	                        border-top: 1px solid #bdbdbd;
	                        height: 1px;
	                        font-size: 1px;
	                        line-height: 1px;
	                      "
	                    >
	                      &nbsp;
	                    </td>
	                  </tr>
	                </table>

	                <div style="height: 14px; line-height: 14px; font-size: 14px">&nbsp;</div>

	                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 28px;
	                        line-height: 34px;
	                        font-weight: 800;
	                        color: #1f1f1f;
	                        padding: 8px 0 12px 0;
	                      "
	                    >
	                      New message in your support thread
	                    </td>
	                  </tr>
	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #4a4a4a;
	                        padding: 0 18px 16px 18px;
	                      "
	                    >
	                      {{creator}} sent a new message in your support thread ##ID% with<br />
	                      the following message:
	                    </td>
	                  </tr>

	                  <tr>
	                    <td align="center" style="padding: 0 18px 18px 18px">
	                      <table
	                        role="presentation"
	                        cellpadding="0"
	                        cellspacing="0"
	                        border="0"
	                        width="100%"
	                        style="background: #f1f1f1; border: 1px solid #d2d2d2; border-radius: 8px"
	                      >
	                        <tr>
	                          <td
	                            align="center"
	                            style="
	                              font-family: Arial, Helvetica, sans-serif;
	                              font-size: 18px;
	                              letter-spacing: 1px;
	                              font-weight: 800;
	                              color: #3a3a3a;
	                              padding: 18px;
	                            "
	                          >
	                            {{content}}
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                  </tr>

	                  <tr>
	                    <td align="center" style="padding: 0 18px 14px 18px">
	                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                        <tr>
	                          <td align="center" bgcolor="#2b2b2b" style="border-radius: 10px">
	                            <a
	                              href="{{redirect_url}}"
	                              style="
	                                display: inline-block;
	                                font-family: Arial, Helvetica, sans-serif;
	                                font-size: 14px;
	                                letter-spacing: 1px;
	                                font-weight: 700;
	                                color: #ffffff;
	                                text-decoration: none;
	                                padding: 14px 42px;
	                                border-radius: 10px;
	                              "
	                            >
	                              VIEW THREAD
	                            </a>
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 13px;
	                        line-height: 20px;
	                        color: #6a6a6a;
	                        padding: 0 18px 16px 18px;
	                      "
	                    >
	                      You can view and reply to the message by clicking the button above.
	                    </td>
	                  </tr>

	                  <tr>
	                    <td style="padding: 0 18px">
	                      <div style="border-top: 1px solid #d0d0d0; line-height: 1px; font-size: 1px">
	                        &nbsp;
	                      </div>
	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #444;
	                        padding: 16px 18px 6px 18px;
	                      "
	                    >
	                      If you have any questions, feel free to contact our support team.
	                    </td>
	                  </tr>
	                </table>
	              </td>
	            </tr>
	          </table>

	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="max-width: 640px"
	          >
	            <tr>
	              <td align="center" style="padding: 18px 0 6px 0">
	                <div style="display:inline-block;width:34px;">
	                  <svg viewBox="0 0 64 48" role="presentation" className="{className}">
	                    <path
	                      fill="currentColor"
	                      d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"
	                    />
	                  </svg>
	                </div>
	              </td>
	            </tr>
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 13px;
	                  line-height: 20px;
	                  color: #6a6a6a;
	                  padding: 0 18px 14px 18px;
	                "
	              >
	                If you have any questions, feel free to contact our support team.
	              </td>
	            </tr>
	            <tr>
	              <td align="center" style="padding: 8px 18px 10px 18px">
	                <div
	                  style="
	                    border-top: 1px solid #d0d0d0;
	                    max-width: 520px;
	                    margin: 0 auto;
	                    line-height: 1px;
	                    font-size: 1px;
	                  "
	                >
	                  &nbsp;
	                </div>
	              </td>
	            </tr>
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 12px;
	                  line-height: 18px;
	                  color: #8a8a8a;
	                  padding: 0 18px 2px 18px;
	                "
	              >
	                Copyright © 2026 <span style="color: #2b2b2b">Aesterial</span>
	              </td>
	            </tr>
	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 12px;
	                  line-height: 18px;
	                  color: #8a8a8a;
	                  padding: 0 18px 28px 18px;
	                "
	              >
	                <a href="{{privacy_url}}" style="color: #8a8a8a; text-decoration: underline"
	                  >Privacy Policy</a
	                >
	              </td>
	            </tr>
	          </table>
	        </td>
	      </tr>
	    </table>
	  </body>
	</html>
	`,
	Ru: `<!doctype html>
	<html lang="ru">
	  <head>
	    <meta charset="utf-8" />
	    <meta name="viewport" content="width=device-width,initial-scale=1" />
	    <meta name="x-apple-disable-message-reformatting" />
	    <title>Aesterial — Обращение в поддержку</title>
	  </head>
	  <body style="margin: 0; padding: 0; background: #f3f3f3">
	    <table
	      role="presentation"
	      cellpadding="0"
	      cellspacing="0"
	      border="0"
	      width="100%"
	      style="background: #f3f3f3"
	    >
	      <tr>
	        <td align="center" style="padding: 28px 16px 10px 16px">
	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="max-width: 640px"
	          >
	            <tr>
	              <td align="center" style="padding: 0 0 18px 0">
	                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                  <tr>
	                    <td valign="middle" style="padding: 0">
	                      <div style="border-top: 2px solid #3a3a3a; line-height: 1px; font-size: 1px">
	                        &nbsp;
	                      </div>
	                    </td>
	                    <td
	                      width="180"
	                      valign="middle"
	                      align="center"
	                      style="
	                        width: 180px;
	                        padding: 0 14px;
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 24px;
	                        letter-spacing: 3px;
	                        font-weight: 700;
	                        color: #1f1f1f;
	                        white-space: nowrap;
	                      "
	                    >
	                      AESTERIAL
	                    </td>
	                    <td valign="middle" style="padding: 0">
	                      <div style="border-top: 2px solid #3a3a3a; line-height: 1px; font-size: 1px">
	                        &nbsp;
	                      </div>
	                    </td>
	                  </tr>
	                </table>
	              </td>
	            </tr>
	          </table>

	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="
	              max-width: 640px;
	              background: #f8f8f8;
	              border: 1px solid #d8d8d8;
	              border-radius: 14px;
	            "
	          >
	            <tr>
	              <td style="padding: 18px 22px 24px 22px">
	                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
	                  <tr>
	                    <td
	                      style="
	                        border-top: 1px solid #bdbdbd;
	                        height: 1px;
	                        font-size: 1px;
	                        line-height: 1px;
	                      "
	                    >
	                      &nbsp;
	                    </td>
	                    <td width="74" align="center" style="padding: 0 10px">
	                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                        <tr>
	                          <td
	                            align="center"
	                            width="56"
	                            height="56"
	                            style="
	                              width: 56px;
	                              height: 56px;
	                              background: #2a2a2a;
	                              border-radius: 50%;
	                              border: 4px solid #ededed;
	                            "
	                          >
	                            <svg
	                              width="26"
	                              height="26"
	                              viewBox="0 0 24 24"
	                              aria-hidden="true"
	                              style="display: block"
	                            >
	                              <path
	                                fill="#ffffff"
	                                d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
	                              />
	                            </svg>
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                    <td
	                      style="
	                        border-top: 1px solid #bdbdbd;
	                        height: 1px;
	                        font-size: 1px;
	                        line-height: 1px;
	                      "
	                    >
	                      &nbsp;
	                    </td>
	                  </tr>
	                </table>

	                <div style="height: 14px; line-height: 14px; font-size: 14px">&nbsp;</div>

	                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 28px;
	                        line-height: 34px;
	                        font-weight: 800;
	                        color: #1f1f1f;
	                        padding: 8px 0 12px 0;
	                      "
	                    >
	                      Новое сообщение в вашем обращении
	                    </td>
	                  </tr>
	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #4a4a4a;
	                        padding: 0 18px 16px 18px;
	                      "
	                    >
	                      {{creator}} отправил(а) новое сообщение в вашем обращении ##ID% со следующим
	                      текстом:
	                    </td>
	                  </tr>

	                  <tr>
	                    <td align="center" style="padding: 0 18px 18px 18px">
	                      <table
	                        role="presentation"
	                        cellpadding="0"
	                        cellspacing="0"
	                        border="0"
	                        width="100%"
	                        style="background: #f1f1f1; border: 1px solid #d2d2d2; border-radius: 8px"
	                      >
	                        <tr>
	                          <td
	                            align="center"
	                            style="
	                              font-family: Arial, Helvetica, sans-serif;
	                              font-size: 18px;
	                              letter-spacing: 1px;
	                              font-weight: 800;
	                              color: #3a3a3a;
	                              padding: 18px;
	                            "
	                          >
	                            {{content}}
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                  </tr>

	                  <tr>
	                    <td align="center" style="padding: 0 18px 14px 18px">
	                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
	                        <tr>
	                          <td align="center" bgcolor="#2b2b2b" style="border-radius: 10px">
	                            <a
	                              href="{{redirect_url}}"
	                              style="
	                                display: inline-block;
	                                font-family: Arial, Helvetica, sans-serif;
	                                font-size: 14px;
	                                letter-spacing: 1px;
	                                font-weight: 700;
	                                color: #ffffff;
	                                text-decoration: none;
	                                padding: 14px 42px;
	                                border-radius: 10px;
	                              "
	                            >
	                              ОТКРЫТЬ ДИАЛОГ
	                            </a>
	                          </td>
	                        </tr>
	                      </table>
	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 13px;
	                        line-height: 20px;
	                        color: #6a6a6a;
	                        padding: 0 18px 16px 18px;
	                      "
	                    >
	                      Вы можете открыть диалог и ответить, нажав кнопку выше.
	                    </td>
	                  </tr>

	                  <tr>
	                    <td style="padding: 0 18px">
	                      <div style="border-top: 1px solid #d0d0d0; line-height: 1px; font-size: 1px">
	                        &nbsp;
	                      </div>
	                    </td>
	                  </tr>

	                  <tr>
	                    <td
	                      align="center"
	                      style="
	                        font-family: Arial, Helvetica, sans-serif;
	                        font-size: 14px;
	                        line-height: 22px;
	                        color: #444;
	                        padding: 16px 18px 6px 18px;
	                      "
	                    >
	                      Если у вас есть вопросы — напишите в нашу службу поддержки.
	                    </td>
	                  </tr>
	                </table>
	              </td>
	            </tr>
	          </table>

	          <table
	            role="presentation"
	            cellpadding="0"
	            cellspacing="0"
	            border="0"
	            width="640"
	            style="max-width: 640px"
	          >
	            <tr>
	              <td align="center" style="padding: 18px 0 6px 0">
	                <div style="display: inline-block; width: 34px">
	                  <svg viewBox="0 0 64 48" role="presentation">
	                    <path
	                      fill="currentColor"
	                      d="M18 6c6-8 22-8 28 0 4 5 6 11 6 17 0 7-2 13-6 17h7v8H36v-8c4-2 8-7 8-14 0-6-3-11-8-14-5 3-8 8-8 14 0 7 4 12 8 14v8H11v-8h7c-4-4-6-10-6-17 0-6 2-12 6-17Z"
	                    />
	                  </svg>
	                </div>
	              </td>
	            </tr>

	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 13px;
	                  line-height: 20px;
	                  color: #6a6a6a;
	                  padding: 0 18px 14px 18px;
	                "
	              >
	                Если у вас есть вопросы — напишите в нашу службу поддержки.
	              </td>
	            </tr>

	            <tr>
	              <td align="center" style="padding: 8px 18px 10px 18px">
	                <div
	                  style="
	                    border-top: 1px solid #d0d0d0;
	                    max-width: 520px;
	                    margin: 0 auto;
	                    line-height: 1px;
	                    font-size: 1px;
	                  "
	                >
	                  &nbsp;
	                </div>
	              </td>
	            </tr>

	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 12px;
	                  line-height: 18px;
	                  color: #8a8a8a;
	                  padding: 0 18px 2px 18px;
	                "
	              >
	                Copyright © 2026 <span style="color: #2b2b2b">Aesterial</span>
	              </td>
	            </tr>

	            <tr>
	              <td
	                align="center"
	                style="
	                  font-family: Arial, Helvetica, sans-serif;
	                  font-size: 12px;
	                  line-height: 18px;
	                  color: #8a8a8a;
	                  padding: 0 18px 28px 18px;
	                "
	              >
	                <a href="{{privacy_url}}" style="color: #8a8a8a; text-decoration: underline"
	                  >Политика конфиденциальности</a
	                >
	              </td>
	            </tr>
	          </table>
	        </td>
	      </tr>
	    </table>
	  </body>
	</html>
	`,
}
