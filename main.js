// ==UserScript==
// @name         SonarJump
// @version      0.1
// @updateURL    https://raw.githubusercontent.com/no3plane/SonarJump/main/main.js
// @description  SonarQube跳转VSCode
// @author       no3plane
// @match        !!!!!!!!!!!!!<这里填入sonarQube的地址，如：https://test.hello.cn/*>
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    setTimeout(() => {
        sonarMain();
    }, 1500);
})();

function sonarMain() {
    if (inIssueDetailPage()) {
        addJumpButton();
    }
    listenURLChange(async () => {
        if (inIssueDetailPage()) {
            await waitIssueDetailLoaded();
            addJumpButton();
        }
    });
}

function inIssueDetailPage() {
    return currentPageType() === 'issue-detail';
    function currentPageType() {
        // 项目问题-列表页 - /sonar/project/issues?id=[项目ID]
        // 项目问题-详情页 - /sonar/project/issues?id=[项目ID]&open=[正在查看的问题详情ID]
        // 全部问题-列表页 - /sonar/issues
        // 全部问题-详情页 - /sonar/issues?open=[正在查看的问题详情ID]
        const url = new URL(location.href);
        switch (url.pathname) {
            case '/sonar/project/issues':
            case '/sonar/issues':
                return url.searchParams.get('open')
                    ? 'issue-detail'
                    : 'issue-list';
            default:
                return 'other';
        }
    }
}

function addJumpButton() {
    const BUTTON_CLASS = 'css-2knsjy';
    const BUTTON_COLOR = 'rgb(253 241 203)';
    const PARENT_SELECTOR =
        '#issues-page > main > div > div > div:nth-child(3) > div > div.sw-z-normal > div > div';

    const button = document.createElement('button');
    button.classList.add(BUTTON_CLASS);
    button.style.background = BUTTON_COLOR;
    button.textContent = '在 VSCode 中打开';
    button.addEventListener('click', (e) => {
        const issue = findIssueInfo();
        const uri = parseCodePosition(issue);
        window.open(uri, '_self');
        setTimeout(() => {
            e.target.blur();
        }, 250);
    });
    button.addEventListener('contextmenu', (e) => {
        askForProjectPath();
        e.preventDefault();
    });
    const parent = document.querySelector(PARENT_SELECTOR);
    parent.insertBefore(button, parent.firstElementChild);
}

function askForProjectPath() {
    const path = prompt('请输入项目路径');
    if (path) {
        localStorage.setItem('sonarjump__project_path', path);
    }
}

/** 从React组件的props上找到issue信息 */
function findIssueInfo() {
    const HEADER_SELECTOR =
        '#issues-page > main > div > div > div:nth-child(3) > div > div.sw-z-normal > div';
    const headerDom = document.querySelector(HEADER_SELECTOR);
    const propsName = getReactPropsName(headerDom);
    const props = headerDom[propsName].children[0].props;
    return props.issue;
    function getReactPropsName(domElement) {
        for (var key in domElement) {
            if (key.startsWith('__reactProps')) {
                return key;
            }
        }
        return null;
    }
}

function parseCodePosition(issue) {
    const PROTOCOL_PREFIX = 'vscode://file/';
    const LOCAL_STORAGE_KEY = 'sonarjump__project_path';
    const projectPath = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!projectPath) {
        askForProjectPath();
        return;
    }
    const codeRow = issue.textRange.startLine;
    const codeColumn = issue.textRange.startOffset + 1;
    return `${PROTOCOL_PREFIX}${projectPath}${issue.componentPath}:${codeRow}:${codeColumn}`;
}

function listenURLChange(onChange) {
    listenPopState(() => onChange());
    decoratePushState(() => onChange());
    decorateReplaceState(() => onChange());

    function listenPopState(onPopState) {
        window.addEventListener('popstate', () => {
            onPopState();
        });
    }
    function decoratePushState(afterCall) {
        const origin = history.pushState;
        history.pushState = function () {
            origin.apply(history, arguments);
            afterCall();
        };
    }
    function decorateReplaceState(afterCall) {
        const origin = history.replaceState;
        history.replaceState = function () {
            origin.apply(history, arguments);
            afterCall();
        };
    }
}

/** URL变化之后需要等待React组件加载完成，才能拿到正确的新的issue */
function waitIssueDetailLoaded() {
    const ISSUE_CONTAINER_SELECTOR = '#issues-page > main > div > div';
    return new Promise((resolve) => {
        new MutationObserver((mutationsList, _observer) => {
            // 节点已添加，表示网页的 React 页面渲染已完成
            if (mutationsList[0].addedNodes.length > 0) {
                resolve();
                _observer.disconnect();
            }
        }).observe(document.querySelector(ISSUE_CONTAINER_SELECTOR), {
            childList: true,
        });
    });
}
