# SonarJump

## 使用方法

1. 安装[Tampermonkey](https://www.tampermonkey.net/)
2. 点开[脚本链接](https://github.com/no3plane/SonarJump/raw/main/main.user.js)，并安装脚本
3. 将脚本第 7 行的`@match`字段处，填入SonarQube的地址，如：`https://test.hello.cn/*`，记得后面要带`*`，以匹配域名下的所有路径，详见[匹配模式](https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/WebExtensions/Match_patterns)。
4. 在SonarQube中打开issue的详情页即可看到跳转按钮。