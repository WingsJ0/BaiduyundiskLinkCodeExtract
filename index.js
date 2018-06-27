// ==UserScript==
// @name         百度网盘提取工具
// @namespace    http://weibo.com/comicwings
// @version      1.1
// @description  寻找网盘提取码，打开网盘链接后自动填入并提交。
// @author       WingsJ
// @match        *://*/*
// @grant        unsafeWindow
// ==/UserScript==

(()=>
{
/*成员*/

    const BaiduHostname='pan.baidu.com';
    const CodeRegexp=/(?:(?:密码|提取码)[:：\t\n\r ]*([a-zA-Z\d]{4}))|(^[a-zA-Z\d]{4}$)/;
    const LinkRegexp=/((?:https?:\/\/)?(?:pan|yun).baidu.com\/s\/[-\w]+)/i;

    let link=
    {
        node:null,
        text:null       //text优先级高
    };
    let code=null;

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
                    link.node=node;

                return NodeFilter.FILTER_ACCEPT;
            }
            else if(node.nodeName==='#text')
            {
                let linkMatchResult=node.nodeValue.match(LinkRegexp);       //普通链接文本
                if(linkMatchResult)
                {
                    link.node=node.parentNode;
                    link.text=linkMatchResult[1];

                    return NodeFilter.FILTER_ACCEPT;
                }
            }

            return NodeFilter.FILTER_SKIP;
        };
        let nodeIterator=document.createNodeIterator(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,filter,false);
        while(nodeIterator.nextNode() && link.node===null);
    };
    /**
     * @name 搜索提取码
     * @type Function
     * @description 当link.node!==null时有效
     */
    let searchCode=function()
    {
        let startNode=link.node;
        if(startNode===null)
            return;

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
    };
    /**
     * @name 修饰链接
     * @type Function
     */
    let decorateLink=function()
    {
        if(link.text!==null)
        {
            let aHtml=`<a href='${link.text}#${code}' target='_blank'>${link.text}</a>`;
            link.node.innerHTML=link.node.innerHTML.replace(link.text,aHtml);       //将文本转换为链接
        }
        else if(link.node!==null)
            link.node.href+=`#${code}`;      //百度网盘在跳转时hash会被保留
    };

/*构造*/

    if(window.location.hostname!==BaiduHostname)        //链接源网页
    {
        searchLink();
        if(link.node!==null)
            searchCode();
        if(link.node!==null && code!==null)
            decorateLink();
    }
    else if(window.location.hostname===BaiduHostname)       //网盘目标网页
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