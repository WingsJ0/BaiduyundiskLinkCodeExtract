// ==UserScript==
// @name         百度网盘提取工具
// @namespace    http://weibo.com/comicwings
// @version      1.2
// @description  点击按钮扫描，如果页面上有百度云盘的资源网址，则将文字转换为链接；如果页面上有百度云盘资源链接和提取码，则在点击链接后自动填入提取码并提交
// @author       WingsJ
// @match        *://*/*
// @grant        unsafeWindow
// ==/UserScript==

(()=>
{
/*成员*/

    /**
     * @name 链接
     * @type Class
     */
    const Link=class
    {
        /**
         * @name 构造方法
         * @type Constructor Function
         * @param {Object} node 结点。DOMNode实例
         * @param {String} text 链接地址
         */
        constructor(node,text=null)
        {
            this.node=node;
            this.text=text;
        }
    };

    const BaiduHostname='pan.baidu.com';
    const CodeRegexp=/(?:(?:密码|提取码)[:：\t\n\r ]*([a-zA-Z\d]{4}))|(^[a-zA-Z\d]{4}$)/;
    const LinkRegexp=/((?:https?:\/\/)?(?:pan|yun).baidu.com\/s\/[-\w]+)/i;
  
    let links=[];

    /**
     * @name 搜索链接
     * @type Function
     */
    let searchLink=function()
    {
        let filter=(node)=>
        {
            if(node.nodeName==='A')
            {
                if(node.href.match(LinkRegexp))
                {
                    links.push(new Link(node));
                }

                return NodeFilter.FILTER_ACCEPT;
            }
            else if(node.nodeName==='#text')
            {
                let linkMatchResult=node.nodeValue.match(LinkRegexp);       //普通链接文本
                if(linkMatchResult)
                {
                    links.push(new Link(node.parentNode,linkMatchResult[1]));

                    return NodeFilter.FILTER_ACCEPT;
                }
            }

            return NodeFilter.FILTER_SKIP;
        };
        let nodeIterator=document.createNodeIterator(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,filter,false);
        while(nodeIterator.nextNode());
    };
    /**
     * @name 搜索提取码
     * @type Function
     * @param {Object} startNode 起点。DOMNode实例
     */
    let searchCode=function(startNode)
    {
        if(startNode===null)
            return;

        let code=null;

        let filter=(node)=>
        {
            if(node.nodeName==='#text')
            {
                let codeMatchResult=node.nodeValue.match(CodeRegexp);       //普通链接文本
                if(codeMatchResult)
                {
                    code=codeMatchResult[1]||codeMatchResult[2];

                    return NodeFilter.FILTER_ACCEPT;
                }

                return NodeFilter.FILTER_SKIP;
            }
        };

        const MaxLevel=5;       //搜索最多5层
        let level=0;
        while(code===null && level<MaxLevel)
        {
            let nodeIterator=document.createNodeIterator(startNode,NodeFilter.SHOW_TEXT,filter,false);
            while(nodeIterator.nextNode() && code===null);

            level++;
            startNode=startNode.parentNode;
        }

        return code;
    };
    /**
     * @name 修饰链接
     * @type Function
     * @param {Object} link Link实例
     * @param {String} code 提取码
     */
    let decorateLink=function(link,code)
    {
        if(link.node.tagName.toUpperCase()==='A' && !link.node.BaiduyundiskLinkCodeExtract_decorated)
        {
            link.node.href+=`#${code}`;      //百度网盘在跳转时hash会被保留
            link.node.classList.add('BaiduyundiskLinkCodeExtract_link');
            link.node.BaiduyundiskLinkCodeExtract_decorated=true;
        }
        else if(link.text!==null)
        {
            let aHtml=`<a class='BaiduyundiskLinkCodeExtract_link' href='${link.text}#${code}' target='_blank'>${link.text}</a>`;
            link.node.innerHTML=link.node.innerHTML.replace(link.text,aHtml);       //将文本转换为链接
        }
    };
  
/*接口*/

    /**
     * @name 扫描
     * @type Function
     */
    const scan=function()
    {
        searchLink();

        console.log(links);
        for(let el of links)
        {
            let code=searchCode(el.node);
            if(code)
                decorateLink(el,code);
        }
    };
    /**
     * @name 初始化
     * @type Function
     */
    const initiate=function()
    {
        const css=
        `
            .BaiduyundiskLinkCodeExtract_button
            {
                position:fixed;
                right:0;
                top:30%;
                width:100px;
                height:100px;
                background-color:skyblue;
                font-size:32px;
                font-weight:bold;
                text-align:center;
                border-top-left-radius:16px;
                border-bottom-left-radius:16px;
                cursor:pointer
            }
            .BaiduyundiskLinkCodeExtract_button:active
            {
                background-color:yellow;
            }

            .BaiduyundiskLinkCodeExtract_link
            {
                background-color:rgba(255,255,0,0.5);
            }
        `;

        let style=document.createElement('style');
        style.innerHTML=css;
        document.head.appendChild(style);
      
        let button=document.createElement('div');
        button.className='BaiduyundiskLinkCodeExtract_button';
        button.innerHTML='<p>扫描</p><p>链接</p>';
        button.addEventListener('click',scan);

        document.body.appendChild(button);
    };

/*构造*/

    initiate();

    if(window.location.hostname===BaiduHostname)       //网盘目标网页
    {
        let extractCode=window.location.hash.slice(1,5);
        if(extractCode)
        {
            let codeInput=document.querySelector('.pickpw input');
            codeInput.value=extractCode;
            document.querySelector('form[name="accessForm"]').onsubmit();
        }
    }
})();