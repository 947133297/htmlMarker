+function () {

    // 额外的事件处理
    const extraFn = (target, evt, add) => {
        const src = target[evt];

        target[evt] = function () {
            src && src(...arguments);
            add(...arguments);
        }
    };

    // 随机字符串，以r开头
    function randomString(len) {
        len = len || 32;
        let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
        let maxPos = $chars.length;
        let pwd = '';
        for (let i = 0; i < len; i++) {
            pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return "r" + pwd;
    }

    // 移除批量元素
    window.removeAllBySeltor = function (sel) {
        for (let ele of document.querySelectorAll(sel)) {
            ele.remove();
        }
    };

    // 插入元素
    function addEle(style, content, id) {
        const element = document.createElement("div");
        element.id = id;
        element.innerHTML = content + style;
        document.body.insertBefore(element, document.body.firstChild);
        return element
    }

    const editPageIndex = 9999;

    function initEditOnPage() {
        let itemBlur = 1;  // 1能添加元素 2刚刚失去焦点 3处于编辑状态
        let curInput;

        const id = randomString(5);

        const style = `
            <style>
                #${id}{
                    position: absolute;
                    height: 100%;
                    width: 100%;
                    z-index: ${editPageIndex};
                    border-bottom: 3px dashed #000;
                }
                #${id}:after{
                    content: '已到达编辑边界';
                    position: absolute;
                    bottom: -1px;
                    left: 0px;
                    font-size: 10px;
                    color: #FD482C;
                    font-style: italic;
                }
                
                #${id} div.inputItem{
                    position: absolute;
                    border: 1px solid black;
                    font-size: 12px;
                    border-radius: 3px;
                    padding: 3px;
                }
                
            </style>
        `;
        const container = addEle(style, "当前处于编辑状态", id);

        container.addEventListener("click", evt => {
            if (evt.target.id === id && itemBlur === 1) {
                addTip(container, evt.clientX + document.documentElement.scrollLeft, evt.clientY + document.documentElement.scrollTop)
            }
            if (itemBlur === 2) {
                itemBlur = 1;
            }
        });

        extraFn(document, "onkeydown", evt => {
            if (115 === evt.keyCode) { // F4
                curInput && curInput.remove();
                itemBlur = 1;
            }
            if (113 === evt.keyCode) { // F2
                trigger();
            }
        });

        // 触发切换展示，初始不展示
        let showed = false;
        container.style.display = "none";

        function trigger() {
            showed = !showed;
            container.style.display = showed ? "block" : "none";
            layer.msg(showed ? '已【启用】在线编辑，点击任意位置试试！' : '已【关闭】在线编辑');

            // 设置高度
            container.style.height = document.body.scrollHeight + "px";
        }

        // 添加输入框
        function addTip(container, x, y) {
            const initContent = "&nbsp;&nbsp;&nbsp;";
            const inputId = randomString(5);
            const input = document.createElement("div");
            input.className = "inputItem";
            input.id = inputId;
            input.contentEditable = true;
            input.style = `left: ${x}px;top: ${y}px;`;
            input.innerHTML = initContent;

            container.appendChild(input)

            input.addEventListener("blur", evt => {
                itemBlur = 2;
                curInput = null;
            });
            input.addEventListener("click", evt => {
                itemBlur = 3;
                curInput = input;

                if(input.innerHTML === initContent){
                    input.innerHTML = "";
                }
            });
        }

        return {
            trigger
        }
    }

    function initToolBar(pageCtrl) {
        const id = randomString(5);
        const style = `
            <style>
                #${id} {
                    border-radius: 5px;
                    background-color: green;
                    left: 20px;
                    top: 20px;
                    position: fixed;
                    z-index: ${editPageIndex + 1};
                }
                
                .x-panel {
                    min-width: 200px;
                    min-height: 200px;
                    background-color: aliceblue;
                    border-radius: 5px;
                    box-shadow: 5px 5px 5px #888888;
                    position: fixed;
                    z-index: ${editPageIndex + 2};
                    display: none;
                    padding: 20px;
                    padding-left: 40px;
                    border: 1px solid #164a84;
                }
                
                .x-content-item{
                    display: block;
                    margin-bottom: 10px;
                }
                .x-content-item .x-tip{
                    color: dimgray;
                    font-style: italic;
                    font-size: 10px;
                }
                
                .x-close {
                    border-radius: 5px;
                    position: fixed;
                    border: 1px solid #fff;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    position: fixed;
                    z-index: ${editPageIndex + 3};
                    background-color: #4d4398;
                }
            </style>
        `;

        const panelContent = [];

        function addPanelContent(title, script, tipText = "无备注", className = "") {
            const btn = document.createElement("button");
            btn.addEventListener("click", script);
            btn.innerHTML = title;
            className && (btn.className = className);

            const tip = document.createElement("div");
            tip.className = "x-tip";
            tip.innerHTML = tipText;

            const ctn = document.createElement("div");
            ctn.className = "x-content-item";
            ctn.appendChild(btn);
            ctn.appendChild(tip);


            panelContent.push(ctn);
        }

        addPanelContent("打开本地记事本", () => {
            chrome.storage.local.get("xdata", function(val) {
                triggerPanel();
                layer.prompt({
                    formType: 2,
                    value: val.xdata || "",
					maxlength: 999999999, //可输入文本的最大长度，默认500
                    title: '本地记事本',
                    area: ['800px', '500px']
                }, function (val, index) {
                    chrome.storage.local.set({'xdata': val}, function() {
                        layer.close(index);
                    });
                });

            });

        }, '读写记录本地数据');

        addPanelContent("唤起/关闭在线编辑", () => {
            pageCtrl.trigger();
            triggerPanel();
        });

        // TODO 此处添加其他操作
        addPanelContent("移除自定义元素", () => {
            triggerPanel();
            layer.prompt({
                formType: 2,
                title: '输入自定义元素的选择器，逗号分隔',
            }, function (sels, index) {
                sels.split(",").forEach(item => {
                    removeAllBySeltor(item);
                });
                layer.msg("移除完成");
                layer.close(index);
            });
        }, '输入自定义元素的选择器，逗号分隔');

        addPanelContent("打印", () => {
            triggerPanel();
            print();
        }, '设置打印为：无页脚、缩放为90', "x-print");


        const ele = addEle(style, `
            <div class="x-close"></div>
            <div class="x-panel">
                
            </div>
        
        `, id);

        const panel = ele.querySelector(".x-panel");
        for (let item of panelContent) {
            panel.appendChild(item);
        }

        let show = false;
        ele.querySelector(".x-close").addEventListener("click", triggerPanel);

        function triggerPanel() {
            show = !show;
            panel.style.display = show ? "block" : "none";
        }
    }

    extraFn(window, "onload", () => {
        setTimeout(()=>{
            initToolBar(initEditOnPage());
        },10)
    })
}();


