// ==UserScript==
// @name         百度网盘提取工具
// @namespace    http://weibo.com/comicwings
// @version      1.0
// @description  寻找网盘提取码，打开网盘链接后自动填入并提交。
// @author       WingsJ
// @match        *://*/*
// @grant        unsafeWindow
// ==/UserScript==

(()=>
{
    const BaiduHostname='pan.baidu.com';

    if(window.location.hostname!==BaiduHostname)        //链接源网页
    {
        const CodeRegexp=/(?:(?:密码|提取码)[:：\t\n\r ]*([a-zA-Z\d]{4}))|(^[a-zA-Z\d]{4}$)/;
        const LinkRegexp=/((?:https?:\/\/)?(?:pan|yun).baidu.com\/s\/[-\w]+)/i;

        let code=null,link=null,addressText=null,addressNode=null;
        let filter=(node)=>
        {
            if(node.nodeName==='A')
            {
                if(node.href.match(BaiduHostname))
                {
                    link=node;

                    return NodeFilter.FILTER_ACCEPT;
                }
                else
                    return NodeFilter.FILTER_SKIP;
            }
            else if(node.nodeName==='#text')
            {
                let codeMatchResult=node.nodeValue.match(CodeRegexp);       //提取码
                let linkMatchResult=node.nodeValue.match(LinkRegexp);       //普通链接文本

                if(codeMatchResult || linkMatchResult)
                {
                    if(codeMatchResult)
                        code=codeMatchResult[1] || codeMatchResult[2];

                    if(linkMatchResult)
                    {
                        addressNode=node;
                        addressText=linkMatchResult[1];
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
                else
                    return NodeFilter.FILTER_SKIP;
            }
        };

        let nodeIterator=document.createNodeIterator(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,filter,false);
        while(nodeIterator.nextNode())
        {
            if(code!==null && (link!==null || addressText!==null))
            {
                if(link!==null)
                    link.href+=`#${code}`;      //百度网盘在跳转时hash会被保留

                if(addressNode!==null)
                {
                    let aHtml=`<a href='${addressText}#${code}' target='_blank'>${addressText}</a>`;
                    addressNode.parentNode.innerHTML=addressNode.parentNode.innerHTML.replace(addressText,aHtml);       //将文本转换为链接
                }

                break;
            }
        }
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