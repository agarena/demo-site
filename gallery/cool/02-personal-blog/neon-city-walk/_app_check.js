'use strict';
/* ============================================================
   0. 微工具与全局状态
   ============================================================ */
const $=(id)=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const easeIO=(t)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const easeO=(t)=>1-Math.pow(1-t,3);
function mulberry(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_COARSE=window.matchMedia&&matchMedia('(pointer: coarse)').matches;
const IS_MOBILE=IS_COARSE||innerWidth<768;
const LOW=IS_MOBILE||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4);

const S={mode:'boot',p:0,pSm:0,mouse:{x:0,y:0},hover:-1,autoWalk:false,
  visited:new Set(),rainOn:true,fps:{n:0,acc:0,done:false},t:0};

let toastT=0;
function toast(msg,ms){
  const el=$('toast');el.textContent=msg;el.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),ms||2200);
}
/* 焦点圈闭：Esc / 关闭钮统一走 onClose */
function trapFocus(root,onClose){
  const sel='a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])';
  function onKey(e){
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key!=='Tab')return;
    const list=Array.from(root.querySelectorAll(sel)).filter(el=>el.offsetParent!==null);
    if(!list.length)return;
    const first=list[0],last=list[list.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
  function close(){document.removeEventListener('keydown',onKey,true);onClose();}
  document.addEventListener('keydown',onKey,true);
  return close;
}
function lockScroll(on){document.body.classList.toggle('locked',on);}

/* ============================================================
   1. 统一内容库（文案逐字来自 research/15-blog-expansion.md）
   ============================================================ */
const CATS={
  ai:  {name:'AI 工具', en:'AI TOOLS',    color:'#22E4E0', no:'①'},
  web: {name:'网页设计', en:'WEB DESIGN', color:'#FF3B5C', no:'②'},
  life:{name:'健康生活', en:'HEALTHY LIFE',color:'#52FFA8', no:'③'},
  game:{name:'游戏娱乐', en:'GAMES',      color:'#FFC53D', no:'④'}
};
const CAT_ORDER=['ai','web','life','game'];
const WORKS=[
 {slug:'mowen',name:'墨问',en:'Mowen',cat:'ai',side:-1,
  intro:'AI 中文写作 Copilot：把半生不熟的想法追问成干净段落。',
  tags:['写作','大纲','改写'],tool:'https://mowen.example.com',video:'https://video.example.com/mowen',
  qa:[['和通用聊天助手有何区别？','墨问只做中文长文：内置大纲树、段内改写与语气校准，不闲聊、不跑题。'],
      ['我的稿子会被拿去训练吗？','不会，默认本地缓存草稿，云端处理即用即删，设置里可一键导出全部数据。'],
      ['可以指定文风吗？','从「论文」「博客」「公文」三档起步，再用你已发布的文章微调出专属文风。']]},
 {slug:'ciproc',name:'词嵌',en:'Ciproc',cat:'ai',side:1,
  intro:'翻译润色：让机翻长句落回中文的语感。',
  tags:['翻译','润色','术语表'],tool:'https://ciproc.example.com',video:'https://video.example.com/ciproc',
  qa:[['支持哪些语言？','中英日韩四语互译，中译英与英译中两条主路线打磨最深。'],
      ['术语表怎么用？','上传「原文,译文」两列 CSV 即全库生效，人名与产品名从此不再译飞。'],
      ['润色会改专有名词吗？','不会，润色只动句法与连接词，术语按表原样保留。']]},
 {slug:'rememory',name:'拾光',en:'Rememory',cat:'ai',side:-1,
  intro:'老照片修复上色：把像素噪声还给面孔和黄昏。',
  tags:['修复','上色','老照片'],tool:'https://rememory.example.com',video:'https://video.example.com/rememory',
  qa:[['划痕很重的照片能修吗？','先跑「重度修复」通道，再用手动笔触补细节，1990 年前的泛黄照实测成功率约八成。'],
      ['上色会失真吗？','AI 只给建议色，可先锁定人物服色与背景色调再渲染，避免「染色感」。'],
      ['支持批量吗？','3.0 正在做批量队列（见通知条预告），当前单张约 20 秒。']]},
 {slug:'scriptor',name:'速记',en:'Scriptor',cat:'ai',side:1,
  intro:'会议转写摘要：一小时的会，两分钟拿到决议和待办。',
  tags:['转写','摘要','待办'],tool:'https://scriptor.example.com',video:'https://video.example.com/scriptor',
  qa:[['录音质量差能转吗？','可以，8kHz 电话音质也能出稿，专业术语建议先加进词库。'],
      ['摘要格式可定制吗？','内置「决议/待办/风险」三段式，也支持自定义 Markdown 模板。'],
      ['说话人区分准吗？','会前 30 秒轮流自报姓名，区分准确率可到 95% 以上。']]},
 {slug:'ideabox',name:'灵感匣',en:'Ideabox',cat:'ai',side:-1,
  intro:'头脑风暴卡片：一个人也能开的头脑风暴会。',
  tags:['头脑风暴','卡片','内测'],tool:'https://ideabox.example.com',video:'https://video.example.com/ideabox',
  qa:[['一个人也能用吗？','能，「自我对抗」模式会让 AI 扮演反方连续追问五轮。'],
      ['卡片能导出吗？','支持白板 PNG、思维导图 OPML 与纯文本大纲三种格式。'],
      ['内测怎么加入？','首页留邮箱排号，每周五发 50 个邀请码（见通知条）。']]},
 {slug:'neongrid',name:'霓虹栅格',en:'NeonGrid',cat:'web',side:1,
  intro:'CSS 霓虹组件库：给暗色站点一整排会发光的零件。',
  tags:['CSS','组件库','暗色'],tool:'https://neongrid.example.com',video:'https://video.example.com/neongrid',
  qa:[['亮色站点能用吗？','可以，加 data-ng-theme="light" 变体，霓虹自动降为荧光细描边。'],
      ['依赖框架吗？','零依赖纯 CSS 加少量 JS，复制类名即用，gzip 后约 12KB。'],
      ['发光影响性能吗？','发光用分层 box-shadow 缓存，实测 200 个组件同屏仍 60fps。']]},
 {slug:'paperui',name:'纸间 UI',en:'PaperUI',cat:'web',side:-1,
  intro:'纸质质感设计系统：让屏幕学会纸张的呼吸。',
  tags:['设计系统','拟物','排印'],tool:'https://paperui.example.com',video:'https://video.example.com/paperui',
  qa:[['纸质感是贴图吗？','全部由 SVG feTurbulence 程序化生成，无一张图片，可随主题换纸色。'],
      ['和框架兼容吗？','提供 React/Vue/Svelte 三套封装，同时保留原味 CSS 版。'],
      ['支持打印吗？','内置 print 样式层，网页直接打印即成手册排版。']]},
 {slug:'micromove',name:'微动',en:'MicroMove',cat:'web',side:1,
  intro:'微交互动效库：48 个小动作，让界面像被摸过一样。',
  tags:['动效','缓动','开源'],tool:'https://micromove.example.com',video:'https://video.example.com/micromove',
  qa:[['一共多少种动效？','首版 48 个，覆盖按钮、表单、卡片、加载四大场景，每季新增一批。'],
      ['支持 prefers-reduced-motion 吗？','每个动效都有降级变体，引入即自动生效。'],
      ['怎么自定义缓动？','在线缓动编辑器拖出曲线，复制 cubic-bezier 即可。']]},
 {slug:'shellpick',name:'拾贝',en:'Shellpick',cat:'web',side:-1,
  intro:'落地页模板集：把转化区块像贝壳一样捡起来拼好。',
  tags:['落地页','模板','转化'],tool:'https://shellpick.example.com',video:'https://video.example.com/shellpick',
  qa:[['模板包含哪些区块？','每套 9-12 个区块：英雄区、社会证明、定价、FAQ 等，自由增删排序。'],
      ['可以商用吗？','可以，MIT 授权，保留页脚一行 Built with Shellpick 即可。'],
      ['如何换主题色？','改一个 CSS 变量全站生效，附赠 6 组配色预设。']]},
 {slug:'breathrhythm',name:'息律',en:'BreathRhythm',cat:'life',side:-1,
  intro:'呼吸训练：跟着一圈光，把呼吸放慢。',
  tags:['呼吸','冥想','4-7-8'],tool:'https://breathrhythm.example.com',video:'https://video.example.com/breathrhythm',
  qa:[['内置哪些呼吸法？','4-7-8、盒式呼吸、Coherent 三种，也可自定「吸-停-呼」节拍。'],
      ['需要戴耳机吗？','不必须，视觉光圈与震动引导可单独使用，耳机只是加分项。'],
      ['数据会上传吗？','默认只存本机、可导出 CSV，云同步在路线图上且默认关闭。']]},
 {slug:'lightbite',name:'轻食记',en:'LightBite',cat:'life',side:1,
  intro:'饮食记录：两分钟记完一顿饭，不审判你。',
  tags:['饮食','记录','营养'],tool:'https://lightbite.example.com',video:'https://video.example.com/lightbite',
  qa:[['必须拍照识别吗？','支持拍照，也支持纯文字，「两分钟一顿饭」是设计红线。'],
      ['有食物数据库吗？','内置中文常见菜 6000+ 条，支持自建家常菜模板。'],
      ['会劝我节食吗？','不会，只做记录与趋势，不设卡路里羞辱提醒。']]},
 {slug:'sleepsea',name:'眠海',en:'SleepSea',cat:'life',side:-1,
  intro:'白噪音助眠：八轨海浪，混一杯属于你的夜。',
  tags:['白噪音','助眠','混音'],tool:'https://sleepsea.example.com',video:'https://video.example.com/sleepsea',
  qa:[['音源能混搭吗？','雨、浪、风、柴火等八轨自由混音，并记忆你的配比。'],
      ['整夜播放耗电吗？','开启渐弱定时后低于 2% 电量每小时，凌晨自动淡出。'],
      ['可以下载离线听吗？','专业版可打包三种混音离线缓存，免费版仅在线播放。']]},
 {slug:'stepmap',name:'万步路线图',en:'StepMap',cat:'life',side:1,
  intro:'城市步行路线：给下班后的两万步画一条闭环。',
  tags:['步行','城市','路线'],tool:'https://stepmap.example.com',video:'https://video.example.com/stepmap',
  qa:[['路线怎么生成？','输入时长与偏好（树荫/咖啡/少坡度），算法沿街巷拼出闭环路线。'],
      ['支持哪些城市？','已覆盖 12 城步道路网，杭州与上海最细，欢迎提交城市申请。'],
      ['能记录走过的路吗？','可导入步数生成「足迹墨水」，走过的街道会被染上颜色。']]},
 {slug:'wordblocks',name:'字块',en:'WordBlocks',cat:'game',side:-1,
  intro:'中文填字：每天一局，和汉字较劲。',
  tags:['填字','文字','每日一题'],tool:'https://wordblocks.example.com',video:'https://video.example.com/wordblocks',
  qa:[['每天更新吗？','每天 0 点更新一局，周日是 13×13 大盘，历史局可随时回玩。'],
      ['提示怎么计分？','揭示一字扣 10 分，无广告无内购，分数只和自己较劲。'],
      ['能自己出题吗？','编辑器出题后生成题号分享，好题会收进精选题库。']]},
 {slug:'pixelcourier',name:'像素信使',en:'PixelCourier',cat:'game',side:1,
  intro:'像素跑酷：替人送信的信使，在屋顶上一路向前。',
  tags:['跑酷','像素','单手玩'],tool:'https://pixelcourier.example.com',video:'https://video.example.com/pixelcourier',
  qa:[['一局多长？','3 分钟一局，刚好一趟地铁，死亡即结算、退出不惩罚。'],
      ['支持手柄吗？','支持，也保留单指触摸：按住蓄力跳，松手触发二段跳。'],
      ['有剧情吗？','你是替人送信的像素信使，每封信是一段关卡引言，读不读随你。']]},
 {slug:'cattower',name:'猫咪塔',en:'CatTower',cat:'game',side:-1,
  intro:'叠塔：把猫叠稳，是门手艺。',
  tags:['休闲','物理','猫咪'],tool:'https://cattower.example.com',video:'https://video.example.com/cattower',
  qa:[['规则是什么？','把下落的猫叠稳，歪 15° 内它会自己找姿势卧好，超过就溜走。'],
      ['猫有区别吗？','12 种猫各有体重与弹性：橘猫稳、奶牛猫爱弹，开局三选一。'],
      ['最高纪录多少层？','全球榜目前 47 层，突破 30 层解锁云端巨猫彩蛋。']]},
 {slug:'puzzleship',name:'谜题船',en:'PuzzleShip',cat:'game',side:1,
  intro:'解谜：一艘纸船，六十道安静的海关。',
  tags:['解谜','关卡','手绘'],tool:'https://puzzleship.example.com',video:'https://video.example.com/puzzleship',
  qa:[['卡关了怎么办？','每关三枚「漂流瓶」提示，从暗示到图解逐级展开，不用也不影响成就。'],
      ['有多少关？','六章 60 关，每章引入一种新机制，通关后开放玩家自制海图。'],
      ['需要什么配置？','一部能开浏览器的手机即可，无 3D 无强光效，电量友好。']]}
];
WORKS.forEach((w,i)=>{w.idx=i;w.no=String(i+1).padStart(2,'0');});

/* 通知条 10 条（逐字） */
const NOTICES=[
 {t:'update', text:'新文章《把博客首屏压进 300ms》补全附录：完整 Lighthouse 数据表已上传。', a:{k:'article',idx:0}},
 {t:'preview',text:'本周六 20:00 B 站直播「从 0 到 1 做一个独立小工具」，现在预约。', a:{k:'ext',href:'https://live.example.com/slowcache'}},
 {t:'update', text:'订阅数突破 10,000，写给你们的《第一万零一次缓存》已发出。', a:{k:'article',idx:0,pin:1}},
 {t:'info',   text:'墨问 Mowen 2.4 发布：新增长文大纲模式与本地草稿缓存。', a:{k:'work',slug:'mowen'}},
 {t:'info',   text:'《凌晨四点的杭州菜市场》被「独立开发者周刊」第 082 期转载。', a:{k:'ext',href:'https://weekly.example.com/issue-82'}},
 {t:'preview',text:'灵感匣 Ideabox 内测招募 200 名用户，本周五发放邀请码。', a:{k:'work',slug:'ideabox'}},
 {t:'update', text:'全站夜间模式上线，跟随系统自动切换，也可以在页脚手动拨一下。', a:null},
 {t:'info',   text:'「慢速写作训练营」第三期开放报名，本期只收 30 人。', a:{k:'ext',href:'https://camp.example.com/slowcache'}},
 {t:'info',   text:'RSS 地址迁移至 feed.slowcache.example，旧地址保留 90 天。', a:{k:'ext',href:'https://feed.slowcache.example'}},
 {t:'preview',text:'拾光 Rememory 3.0「批量修复」开发中，路线图已挂出，欢迎许愿。', a:{k:'work',slug:'rememory'}}
];
const BADGE={update:'更新',info:'资讯',preview:'预告'};

/* 博客文章 7 篇（前 2 篇完整正文） */
const ARTICLES=[
 {date:'2026-08-14',cat:'造轮子',title:'把博客首屏压进 300ms：一次性能考古',
  sum:'Lighthouse 从 45 到 98 分：字体子集化、关键 CSS 内联与「删库」式瘦身实录。',
  body:`<p>那张 Lighthouse 45 分的截屏，现在还躺在一个叫 <code>before.png</code> 的文件夹里。首屏 4.8 秒才可交互，三栏评分里性能那栏红得最理直气壮。</p>
<h3><span class="no">①</span>起点——45 分的截屏</h3>
<p>归因错了三次。第一反应怪图片——可首屏根本没几张图；第二反应怪服务器——TTFB 其实只有 210ms；第三次怪构建工具。直到把瀑布图放大到第三屏，才不得不承认：错的是我自己。字体 6 个请求、CSS 187KB、三个「以防万一」的库，全是我亲手写上去的。</p>
<h3><span class="no">②</span>字体——从 6 个请求到 2 个</h3>
<p>中文字体是第一凶手。整包思源黑体 8MB，页面却只用到 214 个字形。fontmin 一刀切成单包命中率低，unicode-range 按频次切成 12 片浏览器按需取用，最终两套切片加 <code>font-display: swap</code>：字体请求 6→2，首屏字形加载 2.9s→0.7s。完整对比表在文末附录。</p>
<h3><span class="no">③</span>CSS——关键路径内联 14KB</h3>
<p>把首屏真正用到的样式抽成 14KB 内联进 head，其余走 <code>media="print"</code> 加 onload 切换的老技巧延后——浏览器首帧后才拉取，却不阻塞渲染。这一步没有花哨之处，只有取舍：哪些规则配得上「关键」二字。删掉的两千行 CSS 里，有六百行属于永远不会再上线的旧版卡片。</p>
<h3><span class="no">④</span>图片——首屏 0 图策略</h3>
<p>首屏一张位图都不放。刊头那圈霓虹是三层 box-shadow 加一段 SVG 描边，总共 2KB。LCP 从 3.4s 提前到 1.2s——它不再等任何网络请求。文章配图全部 <code>loading="lazy"</code> 加固定宽高比占位，滚动到位才加载，流量省了，布局也没跳。</p>
<h3><span class="no">⑤</span>JS——删掉三个「以防万一」的库</h3>
<p>轮播库（首页根本没有轮播）、动画库（transition 就够了）、日期库（我只格式化一种格式），合计 92KB。删掉的那一刻，控制台安静得像深夜的街道。评论区的「回复展开」改成一个 17 行的事件委托；原来那 400 行，是我在学框架那年抄的。</p>
<h3><span class="no">⑥</span>终局——98 分与未完清单</h3>
<p>复测：98 分，首屏可交互 1.4s，总传输 312KB。<code>after.png</code> 就放在 <code>before.png</code> 旁边，中间隔着四个周末。未完清单也留着：Service Worker 离线阅读、字体二次瘦身、AVIF 编码——留到下篇《300ms 之后，把整站搬进缓存》。</p>
<blockquote>附录：完整 Lighthouse 数据表已随本文更新（见通知条）。慢速缓存，长期保鲜。</blockquote>`},
 {date:'2026-07-02',cat:'折腾录',title:'词嵌一年：从 0 个用户到 1000 个用户',
  sum:'一个翻译润色小工具独立运营一整年的数据、差评与定价摇摆史。',
  body:`<p>一年前的今晚，我把词嵌的第一个版本推上线，然后在统计后台前坐到凌晨两点，等来了 3 个 UV。</p>
<h3><span class="no">①</span>动机——被机翻长句折磨的第 N 次</h3>
<p>一句「这种设计在保证可读性的同时兼顾了视觉层级」被译成 47 个单词的从句迷宫。当晚我决定自己写一个只管中译英的小工具，先喂给自己的博客用。</p>
<h3><span class="no">②</span>三个月没人用</h3>
<p>上线第一天 UV 3，其中两个是我。之后九十天日均 UV 7，最好的数据来自我每篇文章文末那句自嘲式广告。数据谷底的截图我还留着：一条平得像杭州马路的美线。</p>
<h3><span class="no">③</span>转折</h3>
<p>第 103 天，我在知乎「如何评价机器翻译」问题下写了两千字长答，末尾提了一句词嵌。第二天 UV 340，第三天 300。第一批 300 个用户来自一条认真回答问题的长文——这件事后来改变了我对「推广」的全部理解。</p>
<h3><span class="no">④</span>定价摇摆史</h3>
<p>免费三个月 → 买断 45 元（半年，23 单）→ 订阅 8 元/月（骂声一片）→ 回到买断 68 元（稳定至今）。每次改价都有用户来信；骂得最凶的那封，现在是我功能路线图的扉页。</p>
<h3><span class="no">⑤</span>差评处理</h3>
<p>那条差评说：「术语表是阉割功能。」我回复道歉，两周后把 CSV 术语表做成了全库生效。后来他续了三年。差评不是敌情，是免费的产品经理。</p>
<h3><span class="no">⑥</span>一年后</h3>
<p>1000 个用户，月收入刚好够服务器和域名，离「辞职做独立开发」还差得远。但我决定不辞职：词嵌在夜里长，白天我仍有同事和业务要学。慢速缓存，长期保鲜。</p>`},
 {date:'2026-05-21',cat:'城市漫步',title:'凌晨四点的杭州菜市场',
  sum:'跟着送货三轮车走完一条街的城市漫步笔记，配 9 张手机摄影。',
  body:`<p>写于一个失眠的凌晨：跟着送货三轮车从体育馆路走到凤起路菜场，4 点 12 分，卷帘门一扇一扇响起来。</p>
<ul><li>① 三轮车的节奏——整条街的节拍器</li><li>② 卸货的暗号——不需要说话的默契</li><li>③ 豆腐摊的第一盏灯</li><li>④ 早点铺的蒸汽与霓虹</li><li>⑤ 九张照片的排序逻辑</li></ul>
<p>正文与 9 张手机摄影整理中，预计下月发在这里。先去睡一会。</p>`},
 {date:'2026-04-09',cat:'观展记',title:'滚动即叙事：拆解 3 个获奖网站的动效节奏',
  sum:'逐帧分析获奖长文的 pinned 章节、节拍与留白。',
  body:`<p>把三个获奖长文网站逐帧拆完，发现它们的滚动动效都遵守同一条隐形乐谱。</p>
<ul><li>① pinned 章节的「停留时长」即小节线</li><li>② 视差层的数量决定段落密度</li><li>③ 留白是休止符：最贵的 200px</li><li>④ 转场补间 600-900ms 是黄金区间</li></ul>
<p>提纲完成度 60%，案例截图授权沟通中。</p>`},
 {date:'2026-03-15',cat:'半成品 🌲',title:'数字花园第一年：种下 214 条笔记之后',
  sum:'笔记成熟度统计、双链心得，与放弃完美主义的收获。',
  body:`<p>一年 214 条笔记：常青 31 条、灌木 88 条、种子 95 条。这份成熟度统计表让我第一次看清自己的知识地图。</p>
<ul><li>① 双链不是收藏，是复述</li><li>② 每周 40 分钟的「除草时间」</li><li>③ 放弃完美主义：半成品也是果实</li></ul>
<p>🌲 半成品标记：本文允许永远不「完成」。</p>`},
 {date:'2026-02-08',cat:'折腾录',title:'给十年前的 Kindle 刷了个「慢读」系统',
  sum:'越狱、换字体，把墨水屏改成只读文章的慢读终端。',
  body:`<p>十年前的 Kindle 4 在抽屉里躺了七年。越狱、换思源宋体、装 KUAL，把它改造成只同步本站文章的慢读终端。</p>
<ul><li>① 越狱与 MR 包装器安装实录</li><li>② 字体子集化：墨水屏上的排印</li><li>③ RSS 全文抓取脚本：每晚 11 点自动投递</li><li>④ 没有推送、没有红点的阅读是什么体验</li></ul>
<p>折腾记要素过多，图文教程施工中。</p>`},
 {date:'2026-01-12',cat:'健康实验',title:'呼吸训练 30 天实验报告',
  sum:'用自己写的息律每天 10 分钟：睡眠、心率与情绪的笨办法记录。',
  body:`<p>用自己写的息律 BreathRhythm 做了一次 30 天实验：每天 10 分钟 4-7-8 呼吸，数据全靠手记，笨办法。</p>
<ul><li>① 入睡时间中位数提前 14 分钟</li><li>② 静息心率平均下降 3 次/分</li><li>③ 情绪自评：波动幅度收窄</li><li>④ 第四周的倦怠与重启</li></ul>
<p>结论先行：有用，但远不如「睡前放下手机」有用。完整数据表施工中。</p>`}
];

/* ============================================================
   2. 街道空间布局（DOM 与 3D 共用）
   ============================================================ */
const STREET={zStart:8,zEnd:-206,archZ:[-18,-70,-113,-156],gateZ:-202,shopZ:[]};
(function(){
  let k=0;
  CAT_ORDER.forEach((c,ci)=>{
    const n=WORKS.filter(w=>w.cat===c).length;
    for(let i=0;i<n;i++){STREET.shopZ.push(STREET.archZ[ci]-8-9*i);k++;}
  });
  WORKS.forEach((w,i)=>{w.z=STREET.shopZ[i];});
})();
function pForZ(z){return clamp((STREET.zStart-z)/(STREET.zStart-STREET.zEnd),0,1);}
function catColor(c){return CATS[c].color;}

/* ============================================================
   3. A · LED 走字屏（通知条，hover/focus 暂停）
   ============================================================ */
function tickAction(n){ /* 通知点击统一入口（3D 自动漫步或降级滚动由 walkTo 分派） */
  if(n.t==='update')$('ticker').classList.add('flash');
}
function buildTicker(){
  const inner=$('tkInner');
  const mk=(n)=>{
    const bs='<span class="badge">'+BADGE[n.t]+'</span>';
    if(n.a){
      let href='#',extra='';
      if(n.a.k==='ext'){href=n.a.href;extra=' target="_blank" rel="noopener"';}
      const a=document.createElement('a');
      a.className='tick t-'+n.t;a.href=href;if(extra)a.setAttribute('target','_blank'),a.setAttribute('rel','noopener');
      a.innerHTML=bs+'<span>'+n.text+'</span><span class="arr" aria-hidden="true">→</span>';
      if(n.a.k!=='ext'){
        a.addEventListener('click',(e)=>{
          e.preventDefault();
          if(n.a.k==='work')walkTo(n.a.slug);
          else if(n.a.k==='article')jumpArticle(n.a.idx,n.a.pin);
        });
      }
      return a;
    }
    const s=document.createElement('span');
    s.className='tick t-'+n.t;s.innerHTML=bs+'<span>'+n.text+'</span>';
    return s;
  };
  const set=document.createDocumentFragment();
  NOTICES.forEach((n)=>set.appendChild(mk(n)));
  inner.appendChild(set);
  inner.appendChild(buildTickerCopy());
  /* 时长按内容宽度估算 */
  requestAnimationFrame(()=>{
    const w=inner.scrollWidth/2;inner.style.setProperty('--tk-dur',Math.max(30,w/62).toFixed(1)+'s');
  });
}
function buildTickerCopy(){
  const frag=document.createDocumentFragment();
  NOTICES.forEach((n)=>{
    const s=document.createElement('span');
    s.className='tick t-'+n.t;s.setAttribute('aria-hidden','true');
    s.innerHTML='<span class="badge">'+BADGE[n.t]+'</span><span>'+n.text+'</span>'+(n.a?'<span class="arr">→</span>':'');
    frag.appendChild(s);
  });
  return frag;
}

/* ============================================================
   4. C · 店铺详情弹层（店内视角：大图/介绍/按钮/QA 手风琴）
   ============================================================ */
let onDetailClosed=null;   /* 3D 模式下由场景层挂载「返回街道」补间 */
let detailTrap=null;
function openDetail(w,from3D){
  const acc=catColor(w.cat);
  $('dNo').textContent='SHOP No.'+w.no+' · 第'+CATS[w.cat].no+'街区 · '+CATS[w.cat].name;
  $('dSign').textContent=w.name;
  $('dSignEn').textContent=w.en.toUpperCase();
  $('dCatBadge').textContent=CATS[w.cat].name;
  $('dIntro').textContent=w.intro;
  $('dTags').innerHTML=w.tags.map(t=>'<span class="tag">'+t+'</span>').join('');
  $('dTool').href=w.tool;$('dVideo').href=w.video;
  const qa=$('dQa');
  qa.innerHTML='<p class="qa-t">QA · 店内问答</p>'+w.qa.map((p,i)=>
    '<details class="qa"'+(i===0?' open':'')+'><summary>'+(i+1)+'. '+p[0]+'</summary><div class="a">'+p[1]+'</div></details>').join('');
  const cv=$('dThumb');drawThumb(cv.getContext('2d'),cv.width,cv.height,w);
  openModal('detailModal',acc);
  S.visited.add(w.slug);
  detailTrap=trapFocus($('detailSheet'),()=>closeDetail(true));
}
function closeDetail(fromUI){
  const m=$('detailModal');
  if(!m.classList.contains('open'))return;
  m.classList.remove('open');
  if(detailTrap){detailTrap();detailTrap=null;}
  if(!document.querySelector('.modal.open'))lockScroll(false);
  if(fromUI&&onDetailClosed)onDetailClosed();
}

/* ============================================================
   5. B · 街角邮局（联系面板：复制/社交/伪二维码/留言表单）
   ============================================================ */
function pseudoQR(){
  const rnd=mulberry(20260815),N=25,cell=6;
  let cells='';
  const finder=(cx,cy)=>{
    for(let y=0;y<7;y++)for(let x=0;x<7;x++){
      const edge=x===0||y===0||x===6||y===6,core=x>=2&&x<=4&&y>=2&&y<=4;
      if(edge||core)cells+='<rect x="'+(cx+x)*cell+'" y="'+(cy+y)*cell+'" width="'+cell+'" height="'+cell+'"/>';
    }};
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const inFinder=(x<8&&y<8)||(x>N-9&&y<8)||(x<8&&y>N-9),center=x>=10&&x<=14&&y>=10&&y<=14;
    if(inFinder||center)continue;
    if(rnd()<0.44)cells+='<rect x="'+x*cell+'" y="'+y*cell+'" width="'+cell+'" height="'+cell+'"/>';
  }
  finder(0,0);finder(N-7,0);finder(0,N-7);
  return '<svg viewBox="0 0 '+(N*cell)+' '+(N*cell)+'" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">'
    +'<rect width="'+(N*cell)+'" height="'+(N*cell)+'" fill="#0a0e16"/>'
    +'<g fill="#22E4E0">'+cells+'</g>'
    +'<rect x="'+(10*cell)+'" y="'+(10*cell)+'" width="'+(5*cell)+'" height="'+(5*cell)+'" fill="#0a0e16" stroke="#FFC53D" stroke-width="2"/>'
    +'<text x="'+(12.5*cell)+'" y="'+(13.6*cell)+'" font-size="15" text-anchor="middle" fill="#FFC53D" font-weight="700">慢</text></svg>';
}
function initContact(){
  $('qrBox').innerHTML=pseudoQR();
  $('mailBtn').addEventListener('click',()=>openContact());
  $('seMail').addEventListener('click',()=>openContact());
  document.querySelectorAll('[data-close]').forEach(el=>{
    el.addEventListener('click',()=>{
      const id=el.getAttribute('data-close');
      if(id==='detailModal')closeDetail(true);
      else if(id==='blogModal')closeBlog();
      else if(id==='contactModal')closeContact();
    });
  });
  $('copyMail').addEventListener('click',async()=>{
    const txt='hi@slowcache.example';
    try{await navigator.clipboard.writeText(txt);toast('已复制，随时来信');}
    catch(e){
      const r=document.createRange();r.selectNodeContents($('mailAddr'));
      const sel=getSelection();sel.removeAllRanges();sel.addRange(r);
      try{document.execCommand('copy');toast('已复制，随时来信');}
      catch(e2){toast('复制失败，邮箱：hi@slowcache.example');}
      sel.removeAllRanges();
    }
  });
  $('mailForm').addEventListener('submit',(e)=>{
    e.preventDefault();
    const msg=$('fMsg').value.trim(),mail=$('fMail').value.trim();
    const okMsg=msg.length>=10&&msg.length<=500;
    const okMail=!mail||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
    $('errMsg').classList.toggle('show',!okMsg);
    $('errMail').classList.toggle('show',!okMail);
    if(!okMsg||!okMail)return;
    let box=[];try{box=JSON.parse(localStorage.getItem('sc_messages')||'[]');}catch(e2){box=[];}
    box.push({name:$('fName').value.trim(),email:mail,msg,msgLen:msg.length,at:new Date().toISOString()});
    try{localStorage.setItem('sc_messages',JSON.stringify(box));}catch(e3){}
    $('formOk').classList.add('show');
    $('mailForm').reset();
    toast('已投进邮筒');
    setTimeout(()=>$('formOk').classList.remove('show'),4200);
  });
}
let contactTrap=null;
function openContact(){
  if(contactTrap)return;
  openModal('contactModal','var(--red)');
  contactTrap=trapFocus($('contactSheet'),()=>closeContact());
}
function closeContact(){
  $('contactModal').classList.remove('open');
  if(contactTrap){contactTrap();contactTrap=null;}
  if(!document.querySelector('.modal.open'))lockScroll(false);
}

/* ============================================================
   6. D · 夜读橱窗（卷首语 + 7 篇文章 + 关于）
   ============================================================ */
let blogTrap=null;
function initBlog(){
  const list=$('blogList');
  ARTICLES.forEach((a,i)=>{
    const b=document.createElement('button');
    b.type='button';b.className='b-item';b.setAttribute('role','listitem');b.dataset.idx=i;
    b.innerHTML='<span class="b-meta"><span>'+a.date+'</span><span class="b-cat">'+a.cat+'</span><span>No.'+String(i+1).padStart(2,'0')+'</span></span>'
      +'<h3>'+a.title+'</h3><p class="b-sum">'+a.sum+'</p>';
    b.addEventListener('click',()=>readArticle(i));
    list.appendChild(b);
  });
  $('readerBack').addEventListener('click',()=>{
    $('blogModal').classList.remove('reading');
    const cur=document.querySelector('.b-item.flash');if(cur)cur.focus();
  });
  $('seBlog').addEventListener('click',()=>openBlog());
}
function openBlog(){
  if(blogTrap)return;
  openModal('blogModal','var(--yellow)');
  blogTrap=trapFocus($('blogSheet'),()=>closeBlog());
}
function closeBlog(){
  $('blogModal').classList.remove('open','reading');
  if(blogTrap){blogTrap();blogTrap=null;}
  if(!document.querySelector('.modal.open'))lockScroll(false);
}
function readArticle(i){
  const a=ARTICLES[i];
  $('readerTitle').textContent=a.title;
  $('readerMeta').textContent=a.date+' · '+a.cat+' · 慢速缓存 Slow Cache';
  $('readerBody').innerHTML=a.body;
  $('blogModal').classList.add('reading');
  $('blogSheet').scrollTop=0;
  $('readerBack').focus();
}
function jumpArticle(idx,pin){
  openBlog();
  $('blogModal').classList.remove('reading');
  const item=$('blogList').children[idx];
  if(!item)return;
  if(pin)$('blogList').scrollTop=0;
  item.scrollIntoView({block:'nearest',behavior:RM?'auto':'smooth'});
  item.classList.remove('flash');void item.offsetWidth;item.classList.add('flash');
  setTimeout(()=>item.classList.remove('flash'),2600);
}

/* ============================================================
   7. 街尾页脚（回到街口 / 雨幕拨杆）
   ============================================================ */
function initFooter(){
  $('seTop').addEventListener('click',()=>{
    if(document.body.classList.contains('rms')||document.body.classList.contains('no3d')){
      $('rmsStreet').scrollTo({left:0,top:0,behavior:RM?'auto':'smooth'});return;
    }
    animateScrollTo(0,1600);
    toast('沿街走回街口');
  });
  $('rainToggle').addEventListener('click',()=>{
    S.rainOn=!S.rainOn;
    $('rainToggle').classList.toggle('on',S.rainOn);
    $('rainToggle').setAttribute('aria-pressed',String(S.rainOn));
    $('rainState').textContent=S.rainOn?'开':'关';
    if(G.rain)G.rain.visible=S.rainOn;
    toast(S.rainOn?'雨，继续下。':'雨停了（霓虹更亮了）');
  });
}

/* ============================================================
   8. 降级街道（reduced-motion 横向 scroll-snap / no3d 纵向列表）
   ============================================================ */
function buildStaticStreet(){
  const root=$('rmsStreet');
  root.hidden=false;root.innerHTML='';
  const inner=document.createElement('div');inner.className='rms-inner';
  /* 街口英雄卡 */
  const hero=document.createElement('section');hero.className='rms-block rms-hero';
  hero.innerHTML='<h2>慢速缓存</h2><p class="rh-en">SLOW CACHE · NEON CITY WALK</p>'
    +'<p>'+ '把值得想的事，写在会呼吸的页面上。深夜雨街开张：17 间小店，17 件作品，卷帘门后都亮着灯。'
    +(RM?'（已按偏好关闭动效）':'（WebGL 不可用，已切换 CSS 霓虹街）')+'</p>'
    +'<p class="rh-tip">'+(document.body.classList.contains('no3d')?'上下滚动 · 浏览街道':'左右滑动 · 浏览街道')+'</p>';
  inner.appendChild(hero);
  /* 四个街区 */
  CAT_ORDER.forEach((c,ci)=>{
    const works=WORKS.filter(w=>w.cat===c);
    const block=document.createElement('section');block.className='rms-block';
    block.innerHTML='<header class="rms-blockhead" style="--acc:'+catColor(c)+'">BLOCK '+CATS[c].no+' · '+CATS[c].en
      +'<b>第'+CATS[c].no+'街区 · '+CATS[c].name+'</b></header>';
    const row=document.createElement('div');row.className='rms-cards';
    works.forEach((w)=>{
      const card=document.createElement('article');card.className='rms-card';card.style.setProperty('--acc',catColor(c));
      card.dataset.slug=w.slug;
      const cv=document.createElement('canvas');cv.width=560;cv.height=360;
      const h=document.createElement('h3');h.textContent=w.name;
      const en=document.createElement('span');en.className='rc-en';en.textContent=w.en+' · No.'+w.no;
      const p=document.createElement('p');p.textContent=w.intro;
      const btn=document.createElement('button');btn.type='button';btn.className='btn';
      btn.style.setProperty('--acc',catColor(c));btn.textContent='进店看看 →';
      btn.addEventListener('click',()=>{openDetail(w,false);});
      card.appendChild(cv);card.appendChild(h);card.appendChild(en);card.appendChild(p);card.appendChild(btn);
      row.appendChild(card);
    });
    block.appendChild(row);inner.appendChild(block);
  });
  /* 街尾：博客 + 页脚 */
  const foot=document.createElement('section');foot.className='rms-block rms-foot';
  foot.innerHTML='<header class="rms-blockhead" style="--acc:var(--yellow)">STREET END · 街尾夜读馆<b>夜读橱窗 · 博客本体</b></header>'
    +'<div class="preface" style="max-width:520px"><p class="pf-t">卷首语 · PREFACE</p>'
    +'<p>欢迎来到我的公开笔记本。这里记录我做的小工具、写下的长句，以及一些和生活有关的慢实验。更新不快，但每一篇都经过缓存。</p></div>';
  const brow=document.createElement('div');brow.className='btn-row';
  const bb=document.createElement('button');bb.type='button';bb.className='btn';bb.style.setProperty('--acc','var(--yellow)');
  bb.textContent='翻开夜读橱窗（'+ARTICLES.length+' 篇）';bb.addEventListener('click',()=>openBlog());
  const cb=document.createElement('button');cb.type='button';cb.className='btn ghost';cb.style.setProperty('--acc','var(--red)');
  cb.textContent='街角邮局';cb.addEventListener('click',()=>openContact());
  brow.appendChild(bb);brow.appendChild(cb);foot.appendChild(brow);
  const fine=document.createElement('div');fine.className='se-fine';
  fine.innerHTML='<span>© 2026 沈知远 · 慢速缓存，长期保鲜。</span><span>杭州 · 雨夜</span>';
  foot.appendChild(fine);
  inner.appendChild(foot);
  root.appendChild(inner);
  /* 卡片缩略图绘制（canvas 2D，WebGL 失败也可用） */
  root.querySelectorAll('.rms-card').forEach(card=>{
    const w=WORKS.find(x=>x.slug===card.dataset.slug);
    if(w)drawThumb(card.querySelector('canvas').getContext('2d'),560,360,w);
  });
  /* HUD/邮局按钮在降级模式下依然可用 */
  $('mailBtn').classList.add('show');
}
/* 降级模式下的「自动走到店铺」：滚动 snap 容器到卡片 */
function fallbackWalkTo(slug){
  const card=document.querySelector('.rms-card[data-slug="'+slug+'"]');
  if(!card)return;
  card.scrollIntoView({behavior:RM?'auto':'smooth',block:'center',inline:'center'});
  card.style.transition='box-shadow .3s';
  card.style.boxShadow='0 0 34px -4px '+catColor(WORKS.find(w=>w.slug===slug).cat);
  setTimeout(()=>{card.style.boxShadow='';},2600);
  const w=WORKS.find(x=>x.slug===slug);
  if(w){S.visited.add(slug);toast('已走到「'+w.name+'」门口，卷帘门升起');}
}

/* ============================================================
   9. 程序化缩略图（17 幅，canvas 2D；WebGL 降级时同样可用）
   ============================================================ */
function strHash(s){let h=9;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),387420489);return h>>>0;}
function tBg(ctx,W,H,c1,c2,vert){
  const g=ctx.createLinearGradient(0,0,vert?0:W,vert?H:0);
  g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}
function neonStroke(ctx,color,blur,w){ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.lineWidth=w||2;}
function glowText(ctx,txt,x,y,size,color,core,align,font){
  ctx.font='700 '+size+'px '+'"PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign=align||'center';ctx.textBaseline='middle';
  ctx.shadowColor=color;ctx.shadowBlur=size*0.6;ctx.fillStyle=color;ctx.fillText(txt,x,y);
  ctx.shadowBlur=0;ctx.fillStyle=core||'#ffffff';ctx.fillText(txt,x,y);
}
function mono(ctx,size){ctx.font=size+'px ui-monospace,"Courier New",monospace';ctx.textBaseline='middle';}
function bar(ctx,x,y,w,h,c,r){ctx.fillStyle=c;if(r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}else ctx.fillRect(x,y,w,h);}
function textLines(ctx,x,y,w,n,gap,c){
  ctx.fillStyle=c;
  for(let i=0;i<n;i++){const ww=w*(0.6+((i*37)%40)/100);ctx.fillRect(x,y+i*gap,ww,Math.max(2,gap*0.32));}
}
function drawThumb(ctx,W,H,w){
  const R=mulberry(strHash(w.slug)),col=catColor(w.cat);
  ctx.save();ctx.clearRect(0,0,W,H);
  switch(w.slug){
  case 'mowen':{ /* 深蓝底·钢笔尖·三行发光汉字·印章 */
    tBg(ctx,W,H,'#0a1240','#0e1e5c',true);
    ctx.fillStyle='#f2f4fa';const pw=W*0.62,ph=H*0.46,px=(W-pw)/2,py=H*0.46;
    ctx.fillRect(px,py,pw,ph);
    textLines(ctx,px+pw*0.12,py+ph*0.2,pw*0.76,3,ph*0.24,'#2c3350');
    ctx.strokeStyle='#dfe5f2';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(px+pw*0.12,py+ph*0.2);ctx.lineTo(px+pw*0.12,py+ph*0.2);ctx.stroke();
    ctx.strokeStyle='#f5f7ff';ctx.shadowColor='#ffffff';ctx.shadowBlur=10;ctx.lineWidth=Math.max(2,W*0.012);
    ctx.beginPath();ctx.moveTo(W*0.5,H*0.08);ctx.lineTo(W*0.5,H*0.38);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W*0.5,H*0.38);ctx.lineTo(W*0.5-W*0.045,H*0.5);
    ctx.lineTo(W*0.5,H*0.46);ctx.lineTo(W*0.5+W*0.045,H*0.5);ctx.closePath();
    ctx.fillStyle='#f5f7ff';ctx.fill();ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(W*0.86,H*0.8,Math.min(W,H)*0.09,0,7);
    ctx.fillStyle='#c23a3a';ctx.fill();
    glowText(ctx,'墨',W*0.86,H*0.8,Math.min(W,H)*0.11,'#c23a3a','#ffd9d0');
    break;}
  case 'ciproc':{ /* 米白两栏·青色玉扣缝合 */
    tBg(ctx,W,H,'#f3ecda','#e9dfc6',true);
    textLines(ctx,W*0.08,H*0.18,W*0.34,7,H*0.09,'#8d8672');
    textLines(ctx,W*0.58,H*0.18,W*0.34,7,H*0.09,'#6f7d8a');
    const g=ctx.createLinearGradient(W*0.46,0,W*0.54,H);g.addColorStop(0,'#22E4E0');g.addColorStop(1,'#0e9c98');
    ctx.strokeStyle=g;ctx.shadowColor='#22E4E0';ctx.shadowBlur=14;ctx.lineWidth=W*0.045;
    ctx.beginPath();ctx.arc(W*0.5,H*0.5,W*0.065,0,7);ctx.stroke();
    ctx.shadowBlur=4;ctx.lineWidth=W*0.012;ctx.strokeStyle='#bffefa';
    ctx.beginPath();ctx.arc(W*0.5,H*0.5,W*0.028,0,7);ctx.stroke();ctx.shadowBlur=0;
    break;}
  case 'rememory':{ /* 微斜老照片·左黑白右暖橘·胶带 */
    tBg(ctx,W,H,'#161310','#241d15',true);
    ctx.save();ctx.translate(W/2,H/2);ctx.rotate(-0.06);
    const pw=W*0.72,ph=H*0.62;
    ctx.fillStyle='#f5f1e6';ctx.fillRect(-pw/2-8,-ph/2-8,pw+16,ph+16);
    const gl=ctx.createLinearGradient(-pw/2,0,0,0);gl.addColorStop(0,'#3c3c3c');gl.addColorStop(1,'#787878');
    ctx.fillStyle=gl;ctx.fillRect(-pw/2,-ph/2,pw/2,ph);
    const gr=ctx.createLinearGradient(0,0,pw/2,0);gr.addColorStop(0,'#8a4a1f');gr.addColorStop(1,'#e8974a');
    ctx.fillStyle=gr;ctx.fillRect(0,-ph/2,pw/2,ph);
    ctx.fillStyle='rgba(40,30,25,.55)';
    ctx.beginPath();ctx.arc(-pw*0.25,-ph*0.08,ph*0.14,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(pw*0.25,-ph*0.08,ph*0.14,0,7);ctx.fill();
    ctx.fillStyle='rgba(240,230,180,.5)';
    ctx.save();ctx.rotate(0.5);ctx.fillRect(-pw/2-14,-ph/2+4,34,14);ctx.restore();
    ctx.save();ctx.rotate(-0.5);ctx.fillRect(pw/2-20,ph/2-18,34,14);ctx.restore();
    ctx.restore();
    mono(ctx,10);ctx.fillStyle='rgba(240,230,200,.5)';ctx.textAlign='center';
    ctx.fillText('1996 · REMEMORY 3.0',W/2,H*0.92);
    break;}
  case 'scriptor':{ /* 声波回形针·三张便签 */
    tBg(ctx,W,H,'#0f1319','#161d26',true);
    ctx.strokeStyle='#37e6ff';ctx.shadowColor='#37e6ff';ctx.shadowBlur=8;ctx.lineWidth=2;ctx.beginPath();
    for(let x=0;x<=W;x+=6){const y=H*0.16+Math.sin(x*0.11)*H*0.07+Math.sin(x*0.031)*H*0.03;
      x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
    ctx.stroke();ctx.shadowBlur=0;
    const notes=[['决议','#ffd166',0.26,0.56],['待办','#8ecdf5',0.52,0.62],['风险','#ff9e9e',0.76,0.52]];
    notes.forEach(n=>{
      ctx.save();ctx.translate(W*n[2],H*n[3]);ctx.rotate((R()-0.5)*0.2);
      const nw=W*0.2,nh=H*0.34;
      ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(3,4,nw,nh);
      ctx.fillStyle=n[1];ctx.fillRect(0,0,nw,nh);
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='700 '+Math.round(H*0.09)+'px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText(n[0],nw/2,nh/2);ctx.restore();
    });
    ctx.strokeStyle='#aab4c4';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(W*0.12,H*0.62,W*0.05,1.2,4.6);ctx.stroke();
    ctx.beginPath();ctx.arc(W*0.12,H*0.72,W*0.05,-1.9,1.6);ctx.stroke();
    break;}
  case 'ideabox':{ /* 深紫丝绒·黄铜小匣·彩虹卡片抛物线 */
    const g=ctx.createRadialGradient(W/2,H*0.42,10,W/2,H*0.5,W*0.7);
    g.addColorStop(0,'#3a2560');g.addColorStop(1,'#160b28');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#c9963c';ctx.fillRect(W*0.36,H*0.62,W*0.28,H*0.2);
    ctx.fillStyle='#a97b2b';ctx.save();ctx.translate(W*0.36,H*0.6);ctx.rotate(-0.9);
    ctx.fillRect(0,-H*0.18,W*0.28,H*0.06);ctx.restore();
    ctx.fillStyle='#e8c060';ctx.fillRect(W*0.36,H*0.62,W*0.28,H*0.02);
    for(let i=0;i<6;i++){
      const t=i/5,cx=W*0.2+t*W*0.6,cy=H*0.5-Math.sin(t*Math.PI)*H*0.34;
      ctx.save();ctx.translate(cx,cy);ctx.rotate((t-0.5)*0.9);
      ctx.shadowColor='hsl('+i*60+',90%,60%)';ctx.shadowBlur=10;
      ctx.fillStyle='hsl('+i*60+',85%,58%)';ctx.fillRect(-W*0.045,-H*0.09,W*0.09,H*0.18);
      ctx.shadowBlur=0;ctx.fillStyle='#fdfcf7';ctx.fillRect(-W*0.038,-H*0.082,W*0.076,H*0.164);
      textLines(ctx,-W*0.028,-H*0.05,W*0.056,3,H*0.045,'#8a8578');
      ctx.restore();
    }
    break;}
  case 'neongrid':{ /* 暗夜网格·青紫霓虹控件 */
    tBg(ctx,W,H,'#0a0b13','#10121d',true);
    ctx.strokeStyle='rgba(120,130,180,.12)';ctx.lineWidth=1;
    for(let x=0;x<W;x+=W/12){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=H/8){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    neonStroke(ctx,'#22E4E0',12,2.5);
    ctx.strokeRect(W*0.1,H*0.2,W*0.24,H*0.13);
    ctx.beginPath();ctx.arc(W*0.16,H*0.265,W*0.018,0,7);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W*0.5,H*0.2);ctx.lineTo(W*0.5+W*0.16,H*0.2);ctx.stroke();
    neonStroke(ctx,'#b06cff',12,2.5);
    ctx.strokeRect(W*0.66,H*0.2,W*0.24,H*0.13);
    ctx.strokeRect(W*0.1,H*0.44,W*0.42,H*0.13);
    neonStroke(ctx,'#22E4E0',12,2);
    ctx.beginPath();ctx.arc(W*0.78,H*0.505,W*0.06,0.5*Math.PI+0.4,1.5*Math.PI-0.4);ctx.stroke();
    ctx.beginPath();ctx.arc(W*0.78+W*0.07,H*0.505,W*0.06,-0.5*Math.PI+0.4,0.5*Math.PI-0.4);ctx.stroke();
    neonStroke(ctx,'#b06cff',10,2);
    ctx.strokeRect(W*0.2,H*0.68,W*0.6,H*0.15);
    ctx.beginPath();ctx.moveTo(W*0.26,H*0.755);ctx.lineTo(W*0.3,H*0.755);ctx.stroke();
    ctx.shadowBlur=0;
    break;}
  case 'paperui':{ /* 奶油纸组件·压痕·撕边 */
    tBg(ctx,W,H,'#f2ead8','#e6dbc2',true);
    ctx.fillStyle='#fbf6ea';
    ctx.fillRect(W*0.08,H*0.12,W*0.4,H*0.34);
    ctx.strokeStyle='rgba(120,100,70,.35)';ctx.lineWidth=1.5;ctx.strokeRect(W*0.08+3,H*0.12+3,W*0.4-6,H*0.34-6);
    textLines(ctx,W*0.13,H*0.2,W*0.28,4,H*0.06,'#a89a80');
    ctx.fillStyle='#fbf6ea';ctx.fillRect(W*0.56,H*0.14,W*0.36,H*0.3);
    ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(120,100,70,.5)';
    ctx.beginPath();ctx.moveTo(W*0.74,H*0.14);ctx.lineTo(W*0.74,H*0.44);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#e84040';mono(ctx,11);ctx.textAlign='center';
    ctx.fillText('No.042',W*0.64,H*0.28);
    ctx.fillStyle='#d86a5a';ctx.fillRect(W*0.12,H*0.58,W*0.12,H*0.3);
    ctx.beginPath();ctx.moveTo(W*0.12,H*0.88);ctx.lineTo(W*0.18,H*0.82);ctx.lineTo(W*0.24,H*0.88);
    ctx.lineTo(W*0.24,H*0.58);ctx.lineTo(W*0.12,H*0.58);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fbf6ea';
    ctx.beginPath();ctx.moveTo(W*0.4,H*0.6);
    for(let x=0;x<=W*0.5;x+=W*0.05){ctx.lineTo(W*0.4+x,H*0.6+((x/W*0.05)%2<1?0:6));}
    ctx.lineTo(W*0.9,H*0.92);ctx.lineTo(W*0.4,H*0.92);ctx.closePath();ctx.fill();
    textLines(ctx,W*0.46,H*0.68,W*0.34,3,H*0.07,'#b3a68c');
    break;}
  case 'micromove':{ /* 九宫格动效中途帧 */
    tBg(ctx,W,H,'#0d0f16','#12151f',true);
    for(let r=0;r<3;r++)for(let c=0;c<3;c++){
      const cx=W*(0.2+c*0.3),cy=H*(0.24+r*0.3),t=(r*3+c)/8;
      const dx=Math.sin(t*Math.PI)*W*0.04,s=1+Math.sin(t*Math.PI)*0.12;
      ctx.save();ctx.translate(cx+dx,cy);ctx.rotate((t-0.5)*0.3);ctx.scale(s,s);
      ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(-W*0.09,-H*0.07,W*0.18,H*0.14);
      ctx.fillStyle='hsl('+(190+t*40)+',80%,58%)';
      ctx.fillRect(-W*0.09,-H*0.07,W*0.18,H*0.14);
      ctx.fillStyle='rgba(10,12,18,.85)';
      ctx.font='700 '+Math.round(H*0.045)+'px ui-monospace,monospace';
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(Math.round(t*100)+'%',0,1);
      ctx.restore();
      ctx.setLineDash([3,4]);ctx.strokeStyle='rgba(140,200,255,.35)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(cx-W*0.07,cy);ctx.lineTo(cx+W*0.11,cy);ctx.stroke();ctx.setLineDash([]);
    }
    break;}
  case 'shellpick':{ /* 沙滩螺壳·迷你落地页线框 */
    tBg(ctx,W,H,'#274c63','#7fb2a8',false);
    ctx.fillStyle='#e6d3a8';ctx.beginPath();
    ctx.moveTo(0,H*0.72);
    for(let x=0;x<=W;x+=W/8){ctx.quadraticCurveTo(x+W/16,H*0.66+((x/W*8)%2)*H*0.04,x+W/8,H*0.72);}
    ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();
    ctx.fillStyle='#e8d9b0';ctx.fill();
    ctx.strokeStyle='#f4ead2';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(W*0.26,H*0.78,W*0.1,0.6,5.4);ctx.stroke();
    ctx.beginPath();ctx.arc(W*0.24,H*0.76,W*0.055,0.6,4.6);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.shadowColor='#fff';ctx.shadowBlur=6;
    ctx.strokeRect(W*0.46,H*0.3,W*0.4,H*0.52);
    ctx.strokeRect(W*0.49,H*0.34,W*0.34,H*0.12);
    ctx.strokeRect(W*0.49,H*0.5,W*0.1,H*0.1);ctx.strokeRect(W*0.61,H*0.5,W*0.1,H*0.1);ctx.strokeRect(W*0.73,H*0.5,W*0.1,H*0.1);
    ctx.beginPath();ctx.moveTo(W*0.62,H*0.66);ctx.lineTo(W*0.72,H*0.72);ctx.lineTo(W*0.52,H*0.72);ctx.closePath();ctx.stroke();
    ctx.shadowBlur=0;
    break;}
  case 'breathrhythm':{ /* 呼吸光圈·4-7-8 刻度 */
    tBg(ctx,W,H,'#0a1230','#101c48',true);
    const cx=W/2,cy=H/2,r=Math.min(W,H)*0.3;
    [r*1.25,r*1.05,r*0.85].forEach((rr,i)=>{
      ctx.beginPath();ctx.arc(cx,cy,rr,0,7);
      ctx.strokeStyle='rgba(80,200,255,'+(0.16-i*0.04)+')';ctx.lineWidth=10-i*3;ctx.stroke();
    });
    ctx.beginPath();ctx.arc(cx,cy,r,0,7);
    ctx.strokeStyle='#7fd8ff';ctx.shadowColor='#7fd8ff';ctx.shadowBlur=16;ctx.lineWidth=3;ctx.stroke();ctx.shadowBlur=0;
    for(let a=0;a<12;a++){
      const ang=a/12*Math.PI*2,big=a%4===0;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(ang)*(r*1.32),cy+Math.sin(ang)*(r*1.32));
      ctx.lineTo(cx+Math.cos(ang)*(r*(big?1.44:1.38)),cy+Math.sin(ang)*(r*(big?1.44:1.38)));
      ctx.strokeStyle=big?'#ffd166':'rgba(160,210,255,.5)';ctx.lineWidth=big?3:1.5;ctx.stroke();
    }
    glowText(ctx,'4 · 7 · 8',cx,cy,Math.round(H*0.09),'#7fd8ff','#eaf8ff');
    break;}
  case 'lightbite':{ /* 白瓷碗俯视环形图 */
    tBg(ctx,W,H,'#121a22','#1a2630',true);
    const cx=W/2,cy=H/2;
    ctx.beginPath();ctx.arc(cx,cy,H*0.36,0,7);ctx.fillStyle='#f4f2ec';ctx.fill();
    ctx.beginPath();ctx.arc(cx,cy,H*0.2,0,7);ctx.fillStyle='#1a2630';ctx.fill();
    const segs=[[0,1.5,'#5cc98f'],[1.5,2.6,'#f5a24b'],[2.6,3.6,'#e8604f'],[3.6,6.283,'#e8e4d8']];
    segs.forEach(s=>{
      ctx.beginPath();ctx.arc(cx,cy,H*0.28,s[0],s[1]);
      ctx.strokeStyle=s[2];ctx.lineWidth=H*0.085;ctx.stroke();
    });
    ctx.strokeStyle='#d9d5c8';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(W*0.08,H*0.2);ctx.lineTo(W*0.16,H*0.85);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W*0.13,H*0.18);ctx.lineTo(W*0.21,H*0.83);ctx.stroke();
    [['#5cc98f',0.86],['#f5a24b',0.905],['#e8604f',0.95]].forEach(p=>{
      ctx.beginPath();ctx.arc(W*p[1],H*0.9,5,0,7);ctx.fillStyle=p[0];ctx.fill();
    });
    break;}
  case 'sleepsea':{ /* 墨绿海·月牙·涟漪 */
    tBg(ctx,W,H,'#0c1f1a','#123128',true);
    ctx.fillStyle='#f5e9c8';
    ctx.beginPath();ctx.arc(W*0.72,H*0.22,H*0.14,0,7);ctx.fill();
    ctx.fillStyle='#0c1f1a';
    ctx.beginPath();ctx.arc(W*0.68,H*0.18,H*0.13,0,7);ctx.fill();
    ctx.strokeStyle='rgba(140,220,190,.5)';
    for(let i=1;i<=5;i++){
      ctx.beginPath();ctx.arc(W*0.3,H*0.68,i*H*0.09,Math.PI*1.05,Math.PI*1.95);
      ctx.lineWidth=1.5+(5-i)*0.5;ctx.stroke();
    }
    ctx.strokeStyle='rgba(160,235,200,.35)';ctx.lineWidth=2;
    for(let i=0;i<4;i++){ctx.beginPath();
      ctx.moveTo(W*0.05,H*(0.86+i*0.035));
      ctx.quadraticCurveTo(W*0.5,H*(0.83+i*0.035),W*0.95,H*(0.86+i*0.035));ctx.stroke();}
    break;}
  case 'stepmap':{ /* 牛皮纸地图·红色闭环·脚印邮戳 */
    tBg(ctx,W,H,'#c8a76e','#b3905a',true);
    ctx.strokeStyle='rgba(90,70,40,.3)';ctx.lineWidth=1.5;
    for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(W*(0.05+i*0.15),H*0.05);
      ctx.lineTo(W*(0.05+i*0.15)+W*0.06,H*0.95);ctx.stroke();}
    for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(W*0.05,H*(0.12+i*0.19));
      ctx.lineTo(W*0.95,H*(0.06+i*0.19));ctx.stroke();}
    ctx.setLineDash([8,7]);ctx.strokeStyle='#c8352c';ctx.lineWidth=3.5;ctx.shadowColor='#c8352c';ctx.shadowBlur=5;
    ctx.beginPath();ctx.moveTo(W*0.2,H*0.7);
    ctx.bezierCurveTo(W*0.05,H*0.35,W*0.4,H*0.12,W*0.68,H*0.24);
    ctx.bezierCurveTo(W*0.95,H*0.36,W*0.85,H*0.75,W*0.55,H*0.85);
    ctx.bezierCurveTo(W*0.38,H*0.9,W*0.24,H*0.82,W*0.2,H*0.7);
    ctx.stroke();ctx.setLineDash([]);ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(W*0.2,H*0.7,H*0.075,0,7);
    ctx.strokeStyle='#8a2f28';ctx.lineWidth=2.5;ctx.stroke();
    ctx.fillStyle='#8a2f28';
    ctx.beginPath();ctx.ellipse(W*0.2,H*0.685,H*0.022,H*0.032,0.3,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(W*0.2,H*0.725,H*0.014,0,7);ctx.fill();
    mono(ctx,10);ctx.fillStyle='#6e352e';ctx.textAlign='center';ctx.fillText('START',W*0.2,H*0.79);
    break;}
  case 'wordblocks':{ /* 木纹棋盘·翻开「慢」·铅笔橡皮 */
    tBg(ctx,W,H,'#6e4f30','#54401f',true);
    ctx.strokeStyle='rgba(60,40,18,.5)';ctx.lineWidth=1.5;
    for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(0,H*(0.08+i*0.11));
      ctx.bezierCurveTo(W*0.3,H*(0.06+i*0.11),W*0.7,H*(0.1+i*0.11),W,H*(0.08+i*0.11));ctx.stroke();}
    const gs=Math.min(W,H)*0.14,gx=W/2-gs*2.5,gy=H/2-gs*2.5;
    for(let r=0;r<5;r++)for(let c=0;c<5;c++){
      if((r+c)%2===0){ctx.fillStyle='#f2ead8';ctx.fillRect(gx+c*gs+2,gy+r*gs+2,gs-4,gs-4);}
      else{ctx.fillStyle='#26262c';ctx.fillRect(gx+c*gs+2,gy+r*gs+2,gs-4,gs-4);}
    }
    ctx.save();ctx.translate(gx+3*gs,gy+1.5*gs);ctx.rotate(-0.16);
    ctx.fillStyle='#ffdf8e';ctx.fillRect(-gs*0.55,-gs*0.55,gs*1.1,gs*1.1);
    ctx.strokeStyle='#a87f2c';ctx.strokeRect(-gs*0.55,-gs*0.55,gs*1.1,gs*1.1);
    glowText(ctx,'慢',0,2,gs*0.62,'#b8860b','#4a3208');
    ctx.restore();
    ctx.save();ctx.translate(W*0.12,H*0.85);ctx.rotate(-0.4);
    ctx.fillStyle='#e8b83c';ctx.fillRect(-gs,-6,gs*2.2,12);
    ctx.fillStyle='#f2e2c0';ctx.fillRect(gs*1.2,-6,gs*0.25,12);
    ctx.fillStyle='#3a3a40';ctx.beginPath();ctx.moveTo(gs*1.45,-6);ctx.lineTo(gs*1.7,0);ctx.lineTo(gs*1.45,6);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.fillStyle='#e88a9a';ctx.save();ctx.translate(W*0.88,H*0.86);ctx.rotate(0.3);
    ctx.fillRect(-gs*0.5,-gs*0.25,gs,gs*0.5);ctx.restore();
    break;}
  case 'pixelcourier':{ /* 黄昏像素天际线·奔跑信使 */
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#3c2347');g.addColorStop(0.55,'#c4553a');g.addColorStop(0.56,'#e8a04a');g.addColorStop(1,'#f2c060');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#e8c04a';ctx.fillRect(W*0.68,H*0.3,H*0.14,H*0.14);
    const R2=mulberry(7),u=Math.max(4,W/90);
    for(let i=0;i<14;i++){
      const bw=u*(6+Math.floor(R2()*6)),bh=u*(6+Math.floor(R2()*10)),bx=i*u*6.4-u*2;
      ctx.fillStyle=i%2?'#2c1e33':'#382740';
      ctx.fillRect(bx,H*0.62-bh,bw,bh+H*0.4);
      ctx.fillStyle='rgba(255,220,130,.7)';
      for(let wy=0;wy<bh-u*2;wy+=u*2)for(let wx=0;wx<bw-u*2;wx+=u*2)
        if(R2()<0.28)ctx.fillRect(bx+u+wx,H*0.62-bh+u+wy,u,u);
    }
    ctx.fillStyle='#1a121f';ctx.fillRect(0,H*0.62,W,H*0.4);
    const px=W*0.42,py=H*0.62;
    ctx.fillStyle='#f5f0e6';
    ctx.fillRect(px,py-u*3.4,u,u*1.2);
    ctx.fillRect(px+u*0.2,py-u*2.2,u*1.4,u*1.4);
    ctx.fillRect(px+u*0.1,py-u*0.8,u*0.7,u*0.8);
    ctx.fillRect(px+u*1.1,py-u*0.8,u*0.7,u*0.8);
    ctx.fillStyle='#c84040';ctx.fillRect(px+u*1.6,py-u*2.1,u*0.9,u*1.1);
    ctx.fillStyle='rgba(255,255,255,.75)';
    for(let i=1;i<=4;i++){
      const sx=px-i*u*1.5-u,sy=py-u*1.6+Math.sin(i)*u*0.4;
      ctx.beginPath();ctx.moveTo(sx,sy-u*0.4);ctx.lineTo(sx+u*0.35,sy);ctx.lineTo(sx,sy+u*0.4);ctx.lineTo(sx-u*0.35,sy);ctx.closePath();ctx.fill();
    }
    break;}
  case 'cattower':{ /* 六猫斜叠塔 */
    tBg(ctx,W,H,'#f7ead2','#efddb8',true);
    const cats=['#e8933c','#f2e6d8','#8899aa','#d8b8a0','#e8d0c0','#f5f0e6'];
    let y=H*0.9;
    for(let i=5;i>=0;i--){
      const cx=W*0.5+Math.sin(i*1.7)*W*0.035,cw=W*(0.2+i*0.012),ch=H*0.115,rot=Math.sin(i*2.3)*0.12;
      ctx.save();ctx.translate(cx,y-ch*0.5);ctx.rotate(rot);
      ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.ellipse(3,4,cw*0.5,ch*0.5,0,0,7);ctx.fill();
      ctx.fillStyle=cats[i];
      ctx.beginPath();ctx.ellipse(0,0,cw*0.48,ch*0.5,0,0,7);ctx.fill();
      ctx.beginPath();ctx.moveTo(-cw*0.3,-ch*0.34);ctx.lineTo(-cw*0.18,-ch*0.62);ctx.lineTo(-cw*0.06,-ch*0.4);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(cw*0.3,-ch*0.34);ctx.lineTo(cw*0.18,-ch*0.62);ctx.lineTo(cw*0.06,-ch*0.4);ctx.closePath();ctx.fill();
      if(i===0){
        ctx.strokeStyle='#5a4632';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(-cw*0.12,-ch*0.05,cw*0.05,0.15*Math.PI,0.85*Math.PI);ctx.stroke();
        ctx.beginPath();ctx.arc(cw*0.12,-ch*0.05,cw*0.05,0.15*Math.PI,0.85*Math.PI);ctx.stroke();
        mono(ctx,Math.round(ch*0.5));ctx.fillStyle='#8a7a5a';ctx.textAlign='center';ctx.fillText('zZ',cw*0.42,-ch*0.5);
      }else{
        ctx.fillStyle='#4a3a28';
        ctx.beginPath();ctx.arc(-cw*0.14,-ch*0.08,2.6,0,7);ctx.fill();
        ctx.beginPath();ctx.arc(cw*0.14,-ch*0.08,2.6,0,7);ctx.fill();
      }
      ctx.restore();
      y-=ch*0.78;
    }
    break;}
  case 'puzzleship':{ /* 蓝墨水海·纸船信帆·齿轮星号 */
    ctx.fillStyle='#eef2f6';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#3a5a8c';ctx.lineWidth=2;
    for(let r=0;r<4;r++){ctx.beginPath();
      for(let x=0;x<=W;x+=8){
        const y=H*(0.66+r*0.09)+Math.sin(x*0.05+r)*3;
        x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }ctx.stroke();}
    ctx.save();ctx.translate(W*0.5,H*0.6);
    ctx.fillStyle='#c0392b';ctx.beginPath();
    ctx.moveTo(-W*0.14,0);ctx.quadraticCurveTo(0,H*0.06,W*0.14,0);
    ctx.lineTo(W*0.09,H*0.1);ctx.lineTo(-W*0.09,H*0.1);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fdfcf5';ctx.strokeStyle='#8a97ad';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(0,-H*0.34);ctx.lineTo(W*0.1,-H*0.02);ctx.lineTo(0,-H*0.02);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-H*0.34);ctx.lineTo(-W*0.11,-H*0.02);ctx.lineTo(0,-H*0.02);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#8a97ad';
    ctx.beginPath();ctx.moveTo(0,-H*0.34);ctx.lineTo(0,-H*0.02);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-H*0.18);ctx.lineTo(W*0.06,-H*0.12);ctx.moveTo(0,-H*0.24);ctx.lineTo(-W*0.05,-H*0.18);ctx.stroke();
    ctx.restore();
    ctx.strokeStyle='#3a5a8c';ctx.fillStyle='#3a5a8c';
    [[0.14,0.3,11],[0.85,0.42,8],[0.78,0.2,7],[0.2,0.52,6]].forEach(p=>{
      ctx.beginPath();ctx.arc(W*p[0],H*p[1],p[2],0,7);ctx.stroke();
      for(let a=0;a<6;a++){const ang=a/6*Math.PI*2;
        ctx.beginPath();ctx.moveTo(W*p[0]+Math.cos(ang)*p[2],H*p[1]+Math.sin(ang)*p[2]);
        ctx.lineTo(W*p[0]+Math.cos(ang)*(p[2]+4),H*p[1]+Math.sin(ang)*(p[2]+4));ctx.stroke();}
    });
    ctx.font='700 16px serif';ctx.fillStyle='#3a5a8c';
    ['✳','✳','✳'].forEach((s,i)=>ctx.fillText(s,W*(0.32+i*0.18),H*0.36));
    break;}
  default:{
    tBg(ctx,W,H,'#10131c','#1a2030',true);
    glowText(ctx,w.name,W/2,H/2,Math.round(H*0.16),col,'#ffffff');
  }
  }
  /* 统一暗角 */
  const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.4,W/2,H/2,Math.max(W,H)*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.34)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  ctx.restore();
}
/* 店招+橱窗 合成纹理画布（3D 店面用）：上部霓虹灯带 + 下部灯箱缩略图 */
function drawShopFront(cv,w){
  const ctx=cv.getContext('2d'),W=cv.width,H=cv.height,col=catColor(w.cat);
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#07080d';ctx.fillRect(0,0,W,H);
  /* 顶部灯带边框 */
  ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=10;ctx.lineWidth=3;
  ctx.strokeRect(5,5,W-10,H-10);
  ctx.shadowBlur=0;
  /* 店招 */
  glowText(ctx,w.name,W/2,52,40,col,'#ffffff');
  mono(ctx,15);ctx.fillStyle='rgba(210,220,240,.75)';ctx.textAlign='center';
  ctx.fillText(w.en.toUpperCase()+' · No.'+w.no,W/2,88);
  /* 橱窗灯箱 */
  ctx.save();ctx.translate(14,108);
  ctx.fillStyle='#020204';ctx.fillRect(0,0,W-28,H-122);
  ctx.beginPath();ctx.rect(0,0,W-28,H-122);ctx.clip();
  drawThumb(ctx,W-28,H-122,w);
  ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;ctx.strokeRect(14,108,W-28,H-122);
  /* 灯箱玻璃斜向反光 */
  const gl=ctx.createLinearGradient(0,108,W,H);
  gl.addColorStop(0.35,'rgba(255,255,255,0)');gl.addColorStop(0.5,'rgba(255,255,255,.10)');gl.addColorStop(0.62,'rgba(255,255,255,0)');
  ctx.fillStyle=gl;ctx.fillRect(14,108,W-28,H-122);
}

/* ============================================================
   10. three.js 场景（统一按 r128 API）
   ============================================================ */
const G={three:false,shops:[],winAnims:[],curbIdx:{},flickers:[],archGlow:{},
  tubeMesh:null,tubeMirror:null,shutterInst:null,districtLights:[],rain:null,
  rainUniforms:null,glowUniforms:null,glowSizeAttr:null,posCurve:null,lookCurve:null,
  lookNow:null,camBase:{pos:null,look:null}};

const wiggle=(z)=>Math.sin(z*0.05)*1.3;

function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function ctex(cv,srgb){
  const t=new THREE.CanvasTexture(cv);
  if(srgb!==false)t.encoding=THREE.sRGBEncoding;
  return t;
}

/* --- 窗格纹理（emissiveMap：黑底+随机亮窗，支持节流重绘） --- */
function makeWindowTex(seed,cols,rows,litP,dim){
  const cv=makeCanvas(512,512),ctx=cv.getContext('2d'),R=mulberry(seed);
  ctx.fillStyle='#000';ctx.fillRect(0,0,512,512);
  const cw=512/cols,ch=512/rows,cells=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const lit=R()<litP;
    const warm=R()<0.6;
    const a=dim?(0.25+R()*0.4):(0.55+R()*0.45);
    const col=warm?('rgba(255,'+Math.round(190+R()*40)+',120,'+a+')')
                  :('rgba(150,'+Math.round(195+R()*35)+',255,'+a+')');
    const cell={x:c*cw+cw*0.22,y:r*ch+ch*0.24,w:cw*0.56,h:ch*0.5,lit,c:col};
    cells.push(cell);
    if(lit){ctx.fillStyle=col;ctx.fillRect(cell.x,cell.y,cell.w,cell.h);}
  }
  const tex=ctex(cv,false);
  return {tex,ctx,cells};
}
function toggleWindows(win,n){
  const R=Math.random;
  for(let i=0;i<n;i++){
    const cell=win.cells[Math.floor(R()*win.cells.length)];
    cell.lit=!cell.lit;
    win.ctx.fillStyle=cell.lit?cell.c:'#000';
    win.ctx.fillRect(cell.x,cell.y,cell.w,cell.h);
  }
  win.tex.needsUpdate=true;
}

/* --- 柏油路面纹理 --- */
function makeAsphaltTex(){
  const cv=makeCanvas(128,128),ctx=cv.getContext('2d'),R=mulberry(7);
  ctx.fillStyle='#14171f';ctx.fillRect(0,0,128,128);
  for(let i=0;i<420;i++){
    ctx.fillStyle='rgba('+Math.round(20+R()*30)+','+Math.round(24+R()*30)+','+Math.round(36+R()*36)+','+(0.25+R()*0.5)+')';
    ctx.fillRect(R()*128,R()*128,1+R()*3,1+R()*3);
  }
  for(let i=0;i<5;i++){ /* 深色补丁 */
    ctx.fillStyle='rgba(8,9,14,'+(0.2+R()*0.25)+')';
    ctx.beginPath();ctx.arc(R()*128,R()*128,8+R()*16,0,7);ctx.fill();
  }
  const t=ctex(cv,false);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,42);return t;
}
/* --- 卷帘门波纹纹理 --- */
function makeShutterTex(){
  const cv=makeCanvas(128,128),ctx=cv.getContext('2d');
  ctx.fillStyle='#181b25';ctx.fillRect(0,0,128,128);
  for(let y=0;y<128;y+=10){
    ctx.fillStyle='#212532';ctx.fillRect(0,y,128,4);
    ctx.fillStyle='#10121a';ctx.fillRect(0,y+7,128,2);
  }
  const t=ctex(cv,false);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t;
}
/* --- 店面占位纹理（懒加载装配前的「即将开灯」） --- */
function makePlaceholderTex(){
  const cv=makeCanvas(256,352),ctx=cv.getContext('2d');
  ctx.fillStyle='#07080d';ctx.fillRect(0,0,256,352);
  ctx.strokeStyle='#26304a';ctx.lineWidth=3;ctx.strokeRect(5,5,246,342);
  ctx.fillStyle='rgba(160,175,205,.35)';
  ctx.font='28px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('即将开灯',128,150);
  ctx.font='12px ui-monospace,monospace';
  ctx.fillText('COMING INTO LIGHT',128,186);
  return ctex(cv);
}

/* --- 广告牌 / 挂匾图集 --- */
function makeBillboardAtlas(){
  const cv=makeCanvas(1024,1024),ctx=cv.getContext('2d');
  const cells=[];
  function draw(x,y,title,en,color){
    ctx.fillStyle='#0a0c13';ctx.fillRect(x+4,y+4,504,248);
    ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=16;ctx.lineWidth=5;
    ctx.strokeRect(x+14,y+14,484,228);
    ctx.shadowBlur=0;
    ctx.fillStyle=color;
    [[x+26,y+26],[x+486,y+26],[x+26,y+226],[x+486,y+226]].forEach(p=>{
      ctx.beginPath();ctx.arc(p[0],p[1],5,0,7);ctx.fill();
    });
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='800 72px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.shadowColor=color;ctx.shadowBlur=22;ctx.fillStyle='#ffffff';
    ctx.fillText(title,x+256,y+106);
    ctx.shadowBlur=0;ctx.font='26px ui-monospace,"Courier New",monospace';
    ctx.fillStyle=color;ctx.fillText(en,x+256,y+186);
    ctx.fillStyle='rgba(255,255,255,.3)';
    ctx.fillText('‹  WALK  ›',x+256,y+224);
  }
  const defs=[];
  CAT_ORDER.forEach((c,ci)=>{
    draw(512*(ci%2),256*Math.floor(ci/2),'第'+CATS[c].no+'巷 · '+CATS[c].name,CATS[c].en+'  ·  BLOCK '+CATS[c].no,CATS[c].color);
    cells.push({x:512*(ci%2),y:256*Math.floor(ci/2),color:CATS[c].color});
  });
  draw(0,512,'慢速缓存','SLOW CACHE  ·  NEON CITY WALK','#22E4E0');
  draw(512,512,'邮局','CORNER POST OFFICE · EST. 2019','#FF3B5C');
  draw(0,768,'夜读馆','NIGHT READING WINDOW · BLOG','#FFC53D');
  cells.push({x:0,y:512,color:'#22E4E0'},{x:512,y:512,color:'#FF3B5C'},{x:0,y:768,color:'#FFC53D'});
  const tex=ctex(cv);tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;
  return {tex,cells};
}
function makeHangSignAtlas(){
  const cv=makeCanvas(512,1024),ctx=cv.getContext('2d');
  const texts=['写作','翻译','修复','转写','灵感','组件','纸感','动效','模板','呼吸','轻食','夜航','填字','像素','猫塔','解谜'];
  const palette=['#22E4E0','#FF3B5C','#FFC53D','#52FFA8','#FF9ED2','#8EA8FF'];
  const cells=[];
  texts.forEach((t,i)=>{
    const x=(i%4)*128,y=Math.floor(i/4)*256,col=palette[i%palette.length];
    ctx.fillStyle='#0a0c13';ctx.fillRect(x+6,y+6,116,244);
    ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=12;ctx.lineWidth=4;
    ctx.strokeRect(x+12,y+12,104,232);ctx.shadowBlur=0;
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(let k=0;k<t.length;k++){
      ctx.font='800 52px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.shadowColor=col;ctx.shadowBlur=18;ctx.fillStyle='#ffffff';
      ctx.fillText(t[k],x+64,y+86+k*86);
      ctx.shadowBlur=0;
    }
    cells.push({x,y});
  });
  const tex=ctex(cv);tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;
  return {tex,cells};
}
/* 图集实例平面：aUvo/aUvs 定 UV，aFlick/aSeed 控坏灯闪烁（GPU） */
const ATLAS_VERT=[
'attribute vec2 aUvo;attribute vec2 aUvs;attribute float aFlick;attribute float aSeed;',
'uniform float uTime;',
'varying vec2 vUv;varying float vF;',
'void main(){',
' vUv=aUvo+uv*aUvs;',
' float f=1.0;',
' if(aFlick>0.5){float g=fract(sin(floor(uTime*2.1+aSeed*91.0)*43758.5453));f=g<0.10?0.15:(g<0.22?0.55:1.0);}',
' vF=f;',
' mat4 im=mat4(1.0);',
' #ifdef USE_INSTANCING',
' im=instanceMatrix;',
' #endif',
' gl_Position=projectionMatrix*modelViewMatrix*im*vec4(position,1.0);',
'}'].join('\n');
const ATLAS_FRAG=[
'uniform sampler2D uMap;',
'varying vec2 vUv;varying float vF;',
'void main(){',
' vec4 c=texture2D(uMap,vUv);',
' if(c.a<0.06)discard;',
' gl_FragColor=vec4(c.rgb*vF,c.a);',
'}'].join('\n');
function makeAtlasMat(tex){
  return new THREE.ShaderMaterial({
    uniforms:{uMap:{value:tex},uTime:{value:0}},
    vertexShader:ATLAS_VERT,fragmentShader:ATLAS_FRAG,
    transparent:true,depthWrite:false,side:THREE.DoubleSide});
}

/* --- 辉光点（替代后处理泛光：additive 精灵点，1 dc） --- */
const GLOW_VERT=[
'attribute float aSize;attribute vec3 aColor;attribute float aDelay;attribute float aPulse;attribute float aSeed;',
'uniform float uTime;uniform float uReveal;',
'varying vec3 vC;',
'void main(){',
' vec4 mv=modelViewMatrix*vec4(position,1.0);',
' float rev=smoothstep(aDelay,aDelay+0.12,uReveal);',
' float br=rev*(0.7+0.3*sin(uTime*(0.5+aSeed)+aSeed*19.0));',
' if(aPulse>0.5)br*=0.78+0.32*(0.5+0.5*sin(uTime*2.1+aSeed*9.0));',
' vC=aColor*br;',
' float ps=aSize*(170.0/max(1.0,-mv.z));',
' gl_PointSize=min(ps,240.0)*rev;',
' gl_Position=projectionMatrix*mv;',
'}'].join('\n');
const GLOW_FRAG=[
'varying vec3 vC;',
'void main(){',
' vec2 d=gl_PointCoord-vec2(0.5);',
' float a=smoothstep(0.5,0.04,length(d));',
' gl_FragColor=vec4(vC,a*0.85);',
'}'].join('\n');

/* --- 雨丝（LineSegments + 顶点着色器循环下落，1 dc） --- */
const RAIN_VERT=[
'attribute float aTop;attribute float aSeed;',
'uniform float uTime;',
'varying float vA;',
'void main(){',
' vec3 p=position;',
' float sp=13.0+aSeed*9.0;',
' float y=mod(p.y-uTime*sp+aSeed*37.0,26.0);',
' p.y=y+aTop*0.6;',
' p.x+=(26.0-p.y)*0.045;',
' vA=0.12+aSeed*0.16;',
' gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);',
'}'].join('\n');
const RAIN_FRAG=[
'uniform vec3 uColor;varying float vA;',
'void main(){gl_FragColor=vec4(uColor,vA);}'].join('\n');

/* ------------------------------------------------------------
   场景装配主函数
   ------------------------------------------------------------ */
function initScene(){
  const canvas=$('stage');
  let gl=null;
  try{gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');}catch(e){gl=null;}
  if(!gl)throw new Error('WebGL 不可用');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:!IS_MOBILE,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,IS_MOBILE?1.5:2));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.shadowMap.enabled=false;
  G.renderer=renderer;

  const scene=new THREE.Scene();
  G.scene=scene;
  G.colNight=new THREE.Color(0x0e0f14);
  G.colDusk=new THREE.Color(0x352a4e);
  scene.background=G.colDusk.clone();
  scene.fog=new THREE.FogExp2(G.colDusk.getHex(),0.03);
  const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,0.1,300);
  camera.position.set(0,64,26);
  G.camera=camera;
  G.lookNow=new THREE.Vector3(0,0,-40);
  G.tmpV=new THREE.Vector3();G.tmpV2=new THREE.Vector3();G.tmpC=new THREE.Color();

  /* 灯光：半球底光 + 冷方向光 + 四街区点光（走过点亮） */
  G.hemi=new THREE.HemisphereLight(0x33405e,0x0a0b10,0.85);scene.add(G.hemi);
  const dir=new THREE.DirectionalLight(0x7f8fc0,0.22);dir.position.set(12,34,8);scene.add(dir);
  CAT_ORDER.forEach((c,ci)=>{
    const pl=new THREE.PointLight(new THREE.Color(CATS[c].color),0,60,1.6);
    pl.position.set(0,7.5,STREET.archZ[ci]-12);
    scene.add(pl);G.districtLights.push(pl);
  });

  /* 相机双曲线（位置 + 注视点），滚动驱动 */
  const ptsA=[],ptsB=[];
  for(let z=STREET.zStart+4;z>=STREET.zEnd-2;z-=15){
    ptsA.push(new THREE.Vector3(wiggle(z),2.2,z));
    ptsB.push(new THREE.Vector3(wiggle(z-13),2.5,z-13));
  }
  G.posCurve=new THREE.CatmullRomCurve3(ptsA,false,'catmullrom',0.35);
  G.lookCurve=new THREE.CatmullRomCurve3(ptsB,false,'catmullrom',0.35);
  G.posCurve.getLengths(160);G.lookCurve.getLengths(160);

  const boxGeo=new THREE.BoxGeometry(1,1,1);
  const dum=new THREE.Object3D();

  /* --- 道路 / 人行道 / 车道虚线 --- */
  const road=new THREE.Mesh(
    new THREE.PlaneGeometry(17.6,244),
    new THREE.MeshPhongMaterial({color:0x131722,map:makeAsphaltTex(),
      specular:0x8fa3cf,shininess:88,transparent:true,opacity:0.8}));
  road.rotation.x=-Math.PI/2;road.position.set(0,0,(STREET.zStart+STREET.zEnd)/2);
  scene.add(road);
  const walkway=new THREE.InstancedMesh(boxGeo,
    new THREE.MeshLambertMaterial({color:0x171a24}),2);
  for(let i=0;i<2;i++){
    dum.position.set(i===0?-8.4:8.4,0.11,(STREET.zStart+STREET.zEnd)/2);
    dum.scale.set(2.0,0.22,244);dum.updateMatrix();
    walkway.setMatrixAt(i,dum.matrix);
  }
  scene.add(walkway);
  const dashGeo=new THREE.PlaneGeometry(0.18,1.7);
  const dashes=new THREE.InstancedMesh(dashGeo,new THREE.MeshBasicMaterial({color:0x2a3042}),42);
  for(let i=0;i<42;i++){
    dum.position.set(0,0.02,STREET.zStart-i*5.2);
    dum.rotation.set(-Math.PI/2,0,0);dum.scale.set(1,1,1);dum.updateMatrix();
    dashes.setMatrixAt(i,dum.matrix);
  }
  dum.rotation.set(0,0,0);
  scene.add(dashes);

  /* --- 城市峡谷楼块（InstancedMesh ×2）+ 镜像 + 远景天际线 --- */
  const winA=makeWindowTex(11,10,16,0.42,false);
  const winB=makeWindowTex(23,12,15,0.38,false);
  const winC=makeWindowTex(37,8,18,0.2,true);
  G.winAnims=[winA,winB];
  const matA=new THREE.MeshLambertMaterial({color:0x1c202b,emissive:0xffffff,emissiveMap:winA.tex,emissiveIntensity:1});
  const matB=new THREE.MeshLambertMaterial({color:0x1a1e29,emissive:0xffffff,emissiveMap:winB.tex,emissiveIntensity:1});
  const Rb=mulberry(42);
  const defsA=[],defsB=[];
  function addBuilding(x,z,sx,sy,sz){
    const arr=(defsA.length<=defsB.length)?defsA:defsB;
    arr.push({x,z,sx,sy,sz});
  }
  /* 店铺宿主楼（17 间店上方的楼体） */
  WORKS.forEach(w=>{
    addBuilding(w.side*(9.35+3.4),w.z,6.8,10+Rb()*9,7.6);
  });
  /* 第二、三排填充楼 */
  const rows=LOW?[{f:15.6,hmin:13,hmax:26}]:[{f:15.6,hmin:13,hmax:26},{f:24.5,hmin:18,hmax:40}];
  rows.forEach(rw=>{
    for(let z=STREET.zStart+10;z>STREET.zEnd-12;z-=9.2){
      [-1,1].forEach(s=>{
        if(Rb()<0.12)return;
        addBuilding(s*(rw.f+2.6+Rb()*1.6),z+(Rb()-0.5)*3,4.6+Rb()*3,rw.hmin+Rb()*(rw.hmax-rw.hmin),5+Rb()*5);
      });
    }
  });
  /* 街口与街尾的围合楼 */
  addBuilding(0,STREET.zStart+12,26,16+Rb()*8,8);
  addBuilding(0,STREET.zEnd-14,30,20+Rb()*10,9);
  function buildInstanced(arr,mat){
    const m=new THREE.InstancedMesh(boxGeo,mat,arr.length);
    arr.forEach((d,i)=>{
      dum.position.set(d.x,d.sy/2,d.z);
      dum.scale.set(d.sx,d.sy,d.sz);dum.updateMatrix();
      m.setMatrixAt(i,dum.matrix);
    });
    m.instanceMatrix.needsUpdate=true;
    scene.add(m);return m;
  }
  buildInstanced(defsA,matA);buildInstanced(defsB,matB);
  G.mirrorDefs=defsA.concat(defsB);
  if(!LOW){
    const matM=matA.clone();
    matM.transparent=true;matM.opacity=0.24;matM.depthWrite=false;
    G.mirrorMat=matM;
    const mm=new THREE.InstancedMesh(boxGeo,matM,G.mirrorDefs.length);
    G.mirrorDefs.forEach((d,i)=>{
      dum.position.set(d.x,-d.sy/2-0.02,d.z);
      dum.scale.set(d.sx,d.sy,d.sz);dum.updateMatrix();
      mm.setMatrixAt(i,dum.matrix);
    });
    mm.instanceMatrix.needsUpdate=true;mm.renderOrder=-1;
    scene.add(mm);
  }else{ /* LOW：静态渐变替代镜像（预算换挡） */
    G.mirrorMat=null;
  }
  /* 远景天际线层 */
  const matS=new THREE.MeshLambertMaterial({color:0x0c0e16,emissive:0xffffff,emissiveMap:winC.tex,emissiveIntensity:0.5});
  const sky=[],Rs=mulberry(99);
  for(let z=STREET.zStart+16;z>STREET.zEnd-24;z-=13){
    [-1,1].forEach(s=>{
      sky.push({x:s*(42+Rs()*20),z:z+(Rs()-0.5)*6,sx:8+Rs()*10,sy:26+Rs()*34,sz:9+Rs()*8});
    });
  }
  buildInstanced(sky,matS);

  /* --- 霓虹灯管总集（InstancedMesh + instanceColor）--- */
  const tubeDefs=[];
  function tube(x,y,z,sx,sy,sz,c,mi){tubeDefs.push({x,y,z,sx,sy,sz,c,mi:!!mi});}
  /* 店铺橱窗霓虹框（4 段/店）+ 地面镜像 */
  const brokenSet=new Set([2,6,11,15]);
  WORKS.forEach((w,i)=>{
    const col=new THREE.Color(catColor(w.cat));
    const fx=w.side*8.46,fw=3.76,fh=2.96,zc=w.z;
    tube(fx,3.5,zc,fw,0.09,0.09,col,false);
    tube(fx,0.32,zc,fw,0.09,0.09,col,false);
    tube(fx,1.91,zc-fh/2,0.09,fh,0.09,col,false);
    tube(fx,1.91,zc+fh/2,0.09,fh,0.09,col,false);
    tube(fx,-3.5,zc,fw,0.09,0.09,col,true);
    if(brokenSet.has(i))G.flickers.push({i:i*4,base:col.clone(),phase:Math.random()*9});
  });
  /* 沿街缘石灯带（走过街区→点亮） */
  CAT_ORDER.forEach((c,ci)=>{
    const z0=STREET.archZ[ci]-4,z1=ci<3?STREET.archZ[ci+1]-2:STREET.gateZ+4;
    const len=Math.abs(z1-z0),zc=(z0+z1)/2;
    const col=new THREE.Color(catColor(c)).multiplyScalar(0.22);
    G.curbIdx[c]=[];
    [-1,1].forEach(s=>{
      tube(s*9.35,0.29,zc,0.12,0.06,len,col,false);
      G.curbIdx[c].push(tubeDefs.length-1);
      tube(s*9.35,-0.29,zc,0.12,0.06,len,col,true);
    });
  });
  /* 街区牌坊 / 街口灯架 / 街尾夜读馆 / 邮局 */
  function gantry(z,c){
    const col=new THREE.Color(c);
    [-1,1].forEach(s=>{
      tube(s*8.9,3.4,z,0.3,6.8,0.3,col,false);
      tube(s*8.9,-3.4,z,0.3,6.8,0.3,col,true);
    });
    tube(0,6.85,z,18.4,0.42,0.42,col,false);
  }
  STREET.archZ.forEach((z,i)=>gantry(z,CATS[CAT_ORDER[i]].color));
  gantry(2,'#9fe8ec');
  gantry(STREET.gateZ,'#FFC53D');
  /* 邮局亭灯管 */
  const po={x:7.4,z:-5};
  [[po.x-0.95,1.2,po.z-0.95],[po.x+0.95,1.2,po.z-0.95],[po.x,2.35,po.z-0.95]].forEach(p=>{
    tube(p[0],p[1],p[2],p[1]>2?1.9:0.08,p[1]>2?0.08:2.4,0.08,new THREE.Color('#FF3B5C'),false);
  });
  /* 组装两个 InstancedMesh（本体 + y 镜像） */
  const tubeMat=new THREE.MeshBasicMaterial({color:0xffffff});
  function buildTubes(defs){
    const m=new THREE.InstancedMesh(boxGeo,tubeMat,defs.length);
    defs.forEach((d,i)=>{
      dum.position.set(d.x,d.y,d.z);
      dum.scale.set(d.sx,d.sy,d.sz);dum.updateMatrix();
      m.setMatrixAt(i,dum.matrix);
      m.setColorAt(i,d.c.clone());
    });
    m.instanceMatrix.needsUpdate=true;
    if(m.instanceColor)m.instanceColor.needsUpdate=true;
    scene.add(m);return m;
  }
  G.tubeMesh=buildTubes(tubeDefs.filter(d=>!d.mi));
  if(!LOW)G.tubeMirror=buildTubes(tubeDefs.filter(d=>d.mi));
  G.tubeLit=new Array(G.tubeMesh.count).fill(false);
  G.tubeMeta=tubeDefs.filter(d=>!d.mi);

  /* --- 图集平面：街区牌坊文案 + 邮局 + 街口 + 夜读馆 --- */
  const bb=makeBillboardAtlas();
  const bbMat=makeAtlasMat(bb.tex);
  const bbDefs=[
    {x:0,y:8.0,z:STREET.archZ[0]-0.5,sx:10,sy:2.5,cell:0,flick:0},
    {x:0,y:8.0,z:STREET.archZ[1]-0.5,sx:10,sy:2.5,cell:1,flick:0},
    {x:0,y:8.0,z:STREET.archZ[2]-0.5,sx:10,sy:2.5,cell:2,flick:0},
    {x:0,y:8.0,z:STREET.archZ[3]-0.5,sx:10,sy:2.5,cell:3,flick:0},
    {x:0,y:8.2,z:2.4,sx:11,sy:2.75,cell:4,flick:0},
    {x:po.x,y:2.75,z:po.z-1.02,sx:2.7,sy:1.35,cell:5,flick:0},
    {x:0,y:8.0,z:STREET.gateZ-0.5,sx:10,sy:2.5,cell:6,flick:0}
  ];
  /* 图集顺序：0..3 四街区牌坊 · 4 街口站名 · 5 邮局 · 6 夜读馆 */
  const planeGeo=new THREE.PlaneGeometry(1,1);
  const bbMesh=new THREE.InstancedMesh(planeGeo,bbMat,bbDefs.length);
  const uvo=[],uvs=[],flk=[],sd=[];
  bbDefs.forEach((d,i)=>{
    dum.position.set(d.x,d.y,d.z);dum.rotation.set(0,d.x>5?0:0,0);
    dum.scale.set(d.sx,d.sy,1);dum.updateMatrix();
    bbMesh.setMatrixAt(i,dum.matrix);
    const c=bb.cells[Math.min(d.cell,bb.cells.length-1)];
    uvo.push(c.x/1024,c.y/1024);uvs.push(512/1024,256/1024);
    flk.push(d.flick);sd.push(Math.random());
  });
  bbMesh.geometry.setAttribute('aUvo',new THREE.InstancedBufferAttribute(new Float32Array(uvo),2));
  bbMesh.geometry.setAttribute('aUvs',new THREE.InstancedBufferAttribute(new Float32Array(uvs),2));
  bbMesh.geometry.setAttribute('aFlick',new THREE.InstancedBufferAttribute(new Float32Array(flk),1));
  bbMesh.geometry.setAttribute('aSeed',new THREE.InstancedBufferAttribute(new Float32Array(sd),1));
  bbMesh.renderOrder=6;
  scene.add(bbMesh);
  G.bbMat=bbMat;

  /* --- 挂壁竖招（香港式，GPU 坏灯闪烁）--- */
  const hs=makeHangSignAtlas();
  const hsMat=makeAtlasMat(hs.tex);
  const Rhs=mulberry(5);
  const hsCount=LOW?8:16;
  const hsMesh=new THREE.InstancedMesh(planeGeo,hsMat,hsCount);
  const hUvo=[],hUvs=[],hFlk=[],hSd=[];
  for(let i=0;i<hsCount;i++){
    const side=i%2===0?-1:1;
    const z=STREET.zStart+2-i*(226/hsCount)-(Rhs()-0.5)*6;
    const y=4.6+Rhs()*3.4;
    dum.position.set(side*9.15,y,z);dum.rotation.set(0,0,0);
    dum.scale.set(1.15,2.3,1);dum.updateMatrix();
    hsMesh.setMatrixAt(i,dum.matrix);
    const c=hs.cells[i%hs.cells.length];
    hUvo.push(c.x/512,c.y/1024);hUvs.push(128/512,256/1024);
    hFlk.push(i%5===0?1:0);hSd.push(Rhs());
  }
  hsMesh.geometry.setAttribute('aUvo',new THREE.InstancedBufferAttribute(new Float32Array(hUvo),2));
  hsMesh.geometry.setAttribute('aUvs',new THREE.InstancedBufferAttribute(new Float32Array(hUvs),2));
  hsMesh.geometry.setAttribute('aFlick',new THREE.InstancedBufferAttribute(new Float32Array(hFlk),1));
  hsMesh.geometry.setAttribute('aSeed',new THREE.InstancedBufferAttribute(new Float32Array(hSd),1));
  hsMesh.renderOrder=6;
  scene.add(hsMesh);
  G.hsMat=hsMat;

  /* --- 街灯杆（InstancedMesh）--- */
  const lampCount=Math.floor(226/19);
  const lamps=new THREE.InstancedMesh(boxGeo,new THREE.MeshLambertMaterial({color:0x222836}),lampCount);
  G.lampPos=[];
  for(let i=0;i<lampCount;i++){
    const side=i%2===0?-1:1,z=STREET.zStart-2-i*19;
    dum.position.set(side*8.0,1.6,z);dum.scale.set(0.12,2.9,0.12);dum.updateMatrix();
    lamps.setMatrixAt(i,dum.matrix);
    G.lampPos.push({x:side*7.9,y:3.15,z});
  }
  scene.add(lamps);

  /* --- 店铺结构（橱窗 recess+楣 / 灯箱面 / 卷帘门）--- */
  const darkInst=new THREE.InstancedMesh(boxGeo,new THREE.MeshBasicMaterial({color:0x06070c}),WORKS.length*2);
  const placeholder=makePlaceholderTex();
  G.hitTargets=[];
  WORKS.forEach((w,i)=>{
    const s=w.side;
    /* 店洞 + 楣 */
    dum.rotation.set(0,0,0);
    dum.position.set(s*9.0,1.72,w.z);dum.scale.set(1.5,3.2,4.3);dum.updateMatrix();
    darkInst.setMatrixAt(i*2,dum.matrix);
    dum.position.set(s*8.7,3.6,w.z);dum.scale.set(4.5,0.75,0.6);dum.updateMatrix();
    darkInst.setMatrixAt(i*2+1,dum.matrix);
    /* 灯箱面（懒加载：先占位纹理） */
    const mat=new THREE.MeshBasicMaterial({map:placeholder});
    const front=new THREE.Mesh(new THREE.PlaneGeometry(3.6,2.9),mat);
    front.position.set(s*8.66,1.86,w.z);
    front.rotation.y=s>0?-Math.PI/2:Math.PI/2;
    front.userData.shopIndex=i;
    scene.add(front);G.hitTargets.push(front);
    G.shops.push({w,front,assembled:false,open:0,target:0,spotUntil:0,baseY:1.83});
    /* 卷帘门（实例化，hover 上收） */
  });
  scene.add(darkInst);
  const shutterMat=new THREE.MeshBasicMaterial({map:makeShutterTex()});
  G.shutterInst=new THREE.InstancedMesh(new THREE.PlaneGeometry(3.62,2.78),shutterMat,WORKS.length);
  WORKS.forEach((w,i)=>{
    dum.rotation.set(0,w.side>0?-Math.PI/2:Math.PI/2,0);
    dum.position.set(w.side*8.5,G.shops[i].baseY,w.z);
    dum.scale.set(1,1,1);dum.updateMatrix();
    G.shutterInst.setMatrixAt(i,dum.matrix);
  });
  G.shutterInst.instanceMatrix.needsUpdate=true;
  scene.add(G.shutterInst);
  G.hitTargets.push(G.shutterInst);
  dum.rotation.set(0,0,0);

  /* --- 街灯辉光 + 牌坊辉光（Points，1 dc）--- */
  const gp=[]; /* {x,y,z,size,c,delay,pulse} */
  function glow(x,y,z,size,c,delay,pulse){gp.push({x,y,z,size,c:new THREE.Color(c),delay:delay||0,pulse:pulse||0});}
  G.lampPos.forEach((p,i)=>glow(p.x,p.y,p.z,3.2,'#ffd9a0',i*0.02,0));
  CAT_ORDER.forEach((c,ci)=>{
    glow(0,6.9,STREET.archZ[ci],9.5,CATS[c].color,ci*0.1,1);
    G.archGlow[ci]=gp.length-1;
  });
  glow(0,8.4,2.6,10,'#22E4E0',0.05,1);
  glow(po.x,2.8,po.z,4.5,'#FF3B5C',0.06,1);
  glow(0,6.9,STREET.gateZ,9,'#FFC53D',0.1,1);
  WORKS.forEach((w,i)=>glow(w.side*8.4,3.6,w.z,4.6,catColor(w.cat),0.04+w.idx*0.012,1));
  const gGeo=new THREE.BufferGeometry();
  const gPos=new Float32Array(gp.length*3),gCol=new Float32Array(gp.length*3),
        gSize=new Float32Array(gp.length),gDelay=new Float32Array(gp.length),
        gPulse=new Float32Array(gp.length),gSeed=new Float32Array(gp.length);
  gp.forEach((g,i)=>{
    gPos.set([g.x,g.y,g.z],i*3);
    gCol.set([g.c.r,g.c.g,g.c.b],i*3);
    gSize[i]=g.size;gDelay[i]=g.delay;gPulse[i]=g.pulse;gSeed[i]=Math.random();
  });
  gGeo.setAttribute('position',new THREE.BufferAttribute(gPos,3));
  gGeo.setAttribute('aColor',new THREE.BufferAttribute(gCol,3));
  gGeo.setAttribute('aSize',new THREE.BufferAttribute(gSize,1));
  gGeo.setAttribute('aDelay',new THREE.BufferAttribute(gDelay,1));
  gGeo.setAttribute('aPulse',new THREE.BufferAttribute(gPulse,1));
  gGeo.setAttribute('aSeed',new THREE.BufferAttribute(gSeed,1));
  G.glowSizeAttr=gGeo.getAttribute('aSize');
  G.glowUniforms={uTime:{value:0},uReveal:{value:RM?1:0}};
  const gMat=new THREE.ShaderMaterial({uniforms:G.glowUniforms,vertexShader:GLOW_VERT,fragmentShader:GLOW_FRAG,
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  scene.add(new THREE.Points(gGeo,gMat));

  /* --- 雨丝 --- */
  const nRain=LOW?420:1500;
  const rGeo=new THREE.BufferGeometry();
  const rPos=new Float32Array(nRain*2*3),rTop=new Float32Array(nRain*2),rSeed=new Float32Array(nRain*2);
  for(let i=0;i<nRain;i++){
    const x=(Math.random()-0.5)*30,y=Math.random()*26,z=-30+Math.random()*38,seed=Math.random();
    rPos.set([x,y,z,x,y,z],i*6);
    rTop[i*2]=0;rTop[i*2+1]=1;
    rSeed[i*2]=seed;rSeed[i*2+1]=seed;
  }
  rGeo.setAttribute('position',new THREE.BufferAttribute(rPos,3));
  rGeo.setAttribute('aTop',new THREE.BufferAttribute(rTop,1));
  rGeo.setAttribute('aSeed',new THREE.BufferAttribute(rSeed,1));
  G.rainUniforms={uTime:{value:0},uColor:{value:new THREE.Color(0x9fb6d8)}};
  const rMat=new THREE.ShaderMaterial({uniforms:G.rainUniforms,vertexShader:RAIN_VERT,fragmentShader:RAIN_FRAG,
    transparent:true,depthWrite:false});
  G.rain=new THREE.LineSegments(rGeo,rMat);
  G.rain.frustumCulled=false;
  scene.add(G.rain);

  /* --- 过街电缆（HIGH 档氛围件）--- */
  if(!LOW){
    const cPts=[];
    for(let z=STREET.zStart;z>STREET.zEnd;z-=24){
      for(let k=0;k<7;k++){
        const t=k/6,sag=Math.sin(t*Math.PI)*1.1;
        const x=-9+t*18,y=7.2-sag;
        if(k>0){cPts.push(new THREE.Vector3(px,py,z),new THREE.Vector3(x,y,z));}
        px=x;py=y;
      }
    }
    var px=0,py=0;
    const cGeo=new THREE.BufferGeometry().setFromPoints(cPts);
    scene.add(new THREE.LineSegments(cGeo,new THREE.LineBasicMaterial({color:0x1e2331,transparent:true,opacity:0.8})));
  }

  G.raycaster=new THREE.Raycaster();
  G.ndc=new THREE.Vector2();
  /* InstancedMesh 的包围球基于单位几何，跨全街分布必须关剔除 */
  scene.traverse(o=>{o.frustumCulled=false;});
  G.three=true;
}

/* ============================================================
   11. HUD 组装 / 相机 / 补间
   ============================================================ */
(function buildChips(){
  const box=$('chips');
  CAT_ORDER.forEach(c=>{
    const d=document.createElement('span');
    d.className='chip';d.style.setProperty('--c',catColor(c));
    d.innerHTML='<i class="dot"></i>第'+CATS[c].no+'街区 · '+CATS[c].name;
    box.appendChild(d);
  });
})();

if('scrollRestoration' in history)history.scrollRestoration='manual';
window.scrollTo(0,0);

function scrollable(){return Math.max(1,document.documentElement.scrollHeight-innerHeight);}
function currentP(){return clamp(scrollY/scrollable(),0,1);}

function placeCamera(p){
  if(!G.camBase.pos){G.camBase.pos=new THREE.Vector3();G.camBase.look=new THREE.Vector3();}
  const pos=G.posCurve.getPointAt(p);
  const look=G.lookCurve.getPointAt(clamp(p+0.05,0,1));
  pos.x+=S.mouse.x*0.45;pos.y-=S.mouse.y*0.2;
  G.camera.position.copy(pos);
  G.lookNow.set(look.x+S.mouse.x*2.0,look.y+S.mouse.y*1.1,look.z);
  G.camera.lookAt(G.lookNow);
  G.camBase.pos.copy(pos);G.camBase.look.copy(G.lookNow);
  if(G.rain)G.rain.position.set(G.camera.position.x*0.9,0,G.camera.position.z);
}

const tweens=[];
function addTween(dur,onU,onC){tweens.push({t:0,dur,onU,onC});}
function stepTweens(dt){
  for(let i=tweens.length-1;i>=0;i--){
    const tw=tweens[i];tw.t+=dt;
    const k=clamp(tw.t/tw.dur,0,1);
    if(tw.onU)tw.onU(k);
    if(k>=1){tweens.splice(i,1);if(tw.onC)tw.onC();}
  }
}

/* ============================================================
   12. 指针 / hover 拾取 / 进店与返回补间
   ============================================================ */
let pmx=innerWidth/2,pmy=innerHeight/2,lastRay=0;
function onPointerMove(e){
  S.mouse.x=(e.clientX/innerWidth)*2-1;
  S.mouse.y=(e.clientY/innerHeight)*2-1;
  pmx=e.clientX;pmy=e.clientY;
}
function doRaycast(dt){
  lastRay+=dt;
  if(lastRay<0.08)return;
  lastRay=0;
  if(!G.three||S.mode!=='walk'||S.autoWalk||document.body.classList.contains('locked'))return;
  G.ndc.set((pmx/innerWidth)*2-1,-(pmy/innerHeight)*2+1);
  G.raycaster.setFromCamera(G.ndc,G.camera);
  const hits=G.raycaster.intersectObjects(G.hitTargets,false);
  let idx=-1;
  if(hits.length){
    const o=hits[0].object;
    idx=(o.userData&&o.userData.shopIndex!==undefined)?o.userData.shopIndex:(hits[0].instanceId!==undefined?hits[0].instanceId:-1);
  }
  setHover(idx);
}
function setHover(i){
  if(S.hover===i)return;
  S.hover=i;
  const cap=$('caption');
  if(i<0||i>=WORKS.length){cap.classList.remove('show');document.body.style.cursor='';return;}
  const w=WORKS[i];
  cap.innerHTML='<b>'+w.name+' '+w.en+'</b> · '+CATS[w.cat].name+' — 点击进店';
  cap.style.setProperty('--acc',catColor(w.cat));
  cap.classList.add('show');
  document.body.style.cursor='pointer';
}
function onCanvasClick(e){
  if(e.target.closest('#ticker,#mailBtn,.modal,#streetEnd,#skipBtn,#rmsStreet,#hud,#progressRail,#caption'))return;
  if(S.mode==='intro'){skipIntro();return;}
  if(S.mode!=='walk')return;
  if(S.hover>=0)enterShop(S.hover);
}
function enterShop(i){
  if(!G.three||S.mode!=='walk'||i<0)return;
  S.mode='enter';setHover(-1);
  const w=WORKS[i],side=w.side;
  const fp=G.camera.position.clone(),fl=G.lookNow.clone();
  const tp=new THREE.Vector3(side*5.9,1.95,w.z+1.9);
  const tl=new THREE.Vector3(side*8.45,2.2,w.z);
  let opened=false;
  addTween(1150,(k)=>{
    const e=easeIO(k);
    G.camera.position.lerpVectors(fp,tp,e);
    G.lookNow.lerpVectors(fl,tl,e);
    G.camera.lookAt(G.lookNow);
    if(!opened&&k>0.86){
      opened=true;
      $('flash').classList.add('on');
      setTimeout(()=>$('flash').classList.remove('on'),520);
      openDetail(w,true);
    }
  },()=>{S.mode='detail';});
}
function returnToStreet(){
  if(!G.three)return;
  S.mode='return';
  const fp=G.camera.position.clone(),fl=G.lookNow.clone();
  const p=currentP();
  const tPos=G.posCurve.getPointAt(p);
  const tLook=G.lookCurve.getPointAt(clamp(p+0.05,0,1));
  addTween(900,(k)=>{
    const e=easeIO(k);
    G.camera.position.lerpVectors(fp,tPos,e);
    G.lookNow.lerpVectors(fl,tLook,e);
    G.camera.lookAt(G.lookNow);
  },()=>{S.mode='walk';});
}

/* 通知条带链消息 → 相机自动沿街走到店铺并亮灯 */
let scrollAnim=null;
function animateScrollTo(y,dur,done){
  if(scrollAnim)cancelAnimationFrame(scrollAnim.raf);
  if(RM||dur<=0){window.scrollTo(0,y);if(done)done();return;}
  const y0=scrollY,dy=y-y0,t0=performance.now();
  const step=(now)=>{
    const k=clamp((now-t0)/dur,0,1);
    window.scrollTo(0,y0+dy*easeIO(k));
    if(k<1){scrollAnim.raf=requestAnimationFrame(step);}
    else{scrollAnim=null;if(done)done();}
  };
  scrollAnim={raf:requestAnimationFrame(step)};
}
function walkTo(slug){
  const i=WORKS.findIndex(w=>w.slug===slug);
  if(i<0)return;
  if(!G.three||RM){fallbackWalkTo(slug);return;}
  if(S.mode!=='walk')return;
  const w=WORKS[i];
  const yT=pForZ(w.z+11)*scrollable();
  S.autoWalk=true;
  const dur=clamp(900+Math.abs(yT-scrollY)*0.3,900,3600);
  animateScrollTo(yT,dur,()=>{S.autoWalk=false;spotShop(i);});
}
function spotShop(i){
  const sh=G.shops[i];
  if(!sh)return;
  sh.spotUntil=S.t+6;sh.target=1;
  S.visited.add(sh.w.slug);
  toast('已走到「'+sh.w.name+'」门口，卷帘门升起',2400);
}

/* ============================================================
   13. 入场编排：天色渐暗 → 霓虹逐管点亮 → 高空俯冲落街
   ============================================================ */
const INT={t:0};
function startIntro(){
  document.body.classList.add('intro-on');
  S.mode='intro';INT.t=0;
  G.glowUniforms.uReveal.value=0;
  placeCamera(0);
}
function introTick(dt){
  INT.t+=dt;
  const t=INT.t;
  /* ① 天色渐暗 */
  const k1=clamp(t/1.1,0,1);
  G.scene.background.copy(G.colDusk).lerp(G.colNight,k1);
  G.scene.fog.color.copy(G.scene.background);
  G.hemi.intensity=lerp(1.0,0.55,k1);
  /* ② 霓虹逐管点亮（沿街序） */
  if(t>0.7){
    const kr=clamp((t-0.7)/1.7,0,1);
    G.glowUniforms.uReveal.value=kr;
    let dirty=false;
    G.tubeMeta.forEach((d,i)=>{
      if(G.tubeLit[i])return;
      const delay=clamp((STREET.zStart-d.z)/230,0,1)*0.8;
      if(kr<=delay)return;
      const f=(kr-delay)/0.1;
      const c=G.tmpC.copy(d.c);
      if(f<1)c.multiplyScalar(Math.sin(f*24+i)>-0.2?1:0.06);
      else G.tubeLit[i]=true;
      G.tubeMesh.setColorAt(i,c);dirty=true;
    });
    if(dirty&&G.tubeMesh.instanceColor)G.tubeMesh.instanceColor.needsUpdate=true;
  }
  /* ③ 相机俯冲 */
  const k3=clamp((t-1.7)/1.6,0,1);
  if(k3<1){
    const e=easeIO(k3);
    const pos=G.posCurve.getPointAt(0),look=G.lookCurve.getPointAt(0.05);
    G.camera.position.set(lerp(0,pos.x,e),lerp(64,pos.y,e),lerp(26,pos.z,e));
    G.tmpV.set(look.x,lerp(-30,look.y,e),look.z);
    G.camera.lookAt(G.tmpV);
  }else finishIntro();
}
function finishIntro(){
  if(S.mode!=='intro')return;
  G.scene.background.copy(G.colNight);
  G.scene.fog.color.copy(G.colNight);
  G.hemi.intensity=0.55;
  G.glowUniforms.uReveal.value=1;
  G.tubeMeta.forEach((d,i)=>{G.tubeLit[i]=true;G.tubeMesh.setColorAt(i,G.tmpC.copy(d.c));});
  if(G.tubeMesh.instanceColor)G.tubeMesh.instanceColor.needsUpdate=true;
  S.pSm=currentP();
  placeCamera(S.pSm);
  S.mode='walk';
  document.body.classList.remove('intro-lock','intro-on');
  toast('雨夜开街 · 滚动沿街漫步',2600);
}
function skipIntro(){if(S.mode==='intro')finishIntro();}

/* ============================================================
   14. 每帧更新：街区点亮 / 懒装配 / 卷帘 / 坏灯 / 窗格 / HUD
   ============================================================ */
const districtLit=[false,false,false,false];
function updateDistricts(){
  const cz=G.camera.position.z;
  CAT_ORDER.forEach((c,ci)=>{
    const passed=cz<STREET.archZ[ci]+3;
    if(passed===districtLit[ci])return;
    districtLit[ci]=passed;
    G.districtLights[ci].intensity=passed?1.2:0;
    const col=new THREE.Color(catColor(c)).multiplyScalar(passed?1:0.22);
    G.curbIdx[c].forEach(ti=>G.tubeMesh.setColorAt(ti,col));
    if(G.tubeMesh.instanceColor)G.tubeMesh.instanceColor.needsUpdate=true;
    const chip=$('chips').children[ci];
    if(chip)chip.classList.toggle('on',passed);
    if(passed)toast('点亮 第'+CATS[c].no+'街区 · '+CATS[c].name,1700);
  });
}
function updateLazy(){
  const cz=G.camera.position.z;
  G.shops.forEach((sh)=>{
    if(!sh.assembled&&Math.abs(cz-sh.w.z)<48){
      sh.assembled=true;
      const cv=makeCanvas(256,352);
      drawShopFront(cv,sh.w);
      const tex=ctex(cv);
      tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;
      sh.front.material.map=tex;
    }
  });
}
function updateShutters(dt){
  if(!G.shutterInst)return;
  if(!G.dum)G.dum=new THREE.Object3D();
  const cz=G.camera.position.z;
  let dirty=false;
  G.shops.forEach((sh,i)=>{
    sh.target=(S.hover===i||S.visited.has(sh.w.slug)||S.t<sh.spotUntil)?1:0;
    const d=sh.target-sh.open;
    if(Math.abs(d)>0.002){
      sh.open+=d*Math.min(1,dt*5.2);
      G.dum.rotation.set(0,sh.w.side>0?-Math.PI/2:Math.PI/2,0);
      G.dum.position.set(sh.w.side*8.5,sh.baseY+sh.open*2.42,sh.w.z);
      G.dum.scale.set(1,1,1);G.dum.updateMatrix();
      G.shutterInst.setMatrixAt(i,G.dum.matrix);
      dirty=true;
    }
    const b=(S.hover===i)?1.5:((S.visited.has(sh.w.slug)||S.t<sh.spotUntil)?1.16:1);
    if(sh.b!==b){sh.b=b;sh.front.material.color.setScalar(b);}
  });
  if(dirty)G.shutterInst.instanceMatrix.needsUpdate=true;
}
let flT=0;
function updateFlickers(dt){
  flT+=dt;
  if(flT<0.09||!G.tubeMesh)return;
  flT=0;
  let dirty=false;
  G.flickers.forEach(f=>{
    if(!G.tubeLit[f.i])return;
    const v=Math.sin(S.t*7+f.phase)+Math.sin(S.t*13.7+f.phase*2);
    const k=v>1.15?0.12:(v>0.4?0.55:1);
    if(k!==f.lastK){
      f.lastK=k;
      G.tubeMesh.setColorAt(f.i,G.tmpC.copy(f.base).multiplyScalar(k));
      dirty=true;
    }
  });
  if(dirty&&G.tubeMesh.instanceColor)G.tubeMesh.instanceColor.needsUpdate=true;
}
let winT=0,winAlt=0;
function updateWindows(dt){
  winT+=dt;
  if(winT>0.85){
    winT=0;
    if(!LOW){winAlt=1-winAlt;toggleWindows(G.winAnims[winAlt],6);}
  }
}
function updateHUD(){
  const p=S.pSm;
  $('progressDot').style.top=(p*100).toFixed(1)+'%';
  $('hero').style.opacity=String(clamp(1-p*16,0,1));
  $('streetEnd').classList.toggle('show',p>0.93);
}

/* ============================================================
   15. 主循环（单 rAF / 页签暂停 / DPR 钳制 / FPS 自适应）
   ============================================================ */
let rafId=0;
const clock={last:0};
function loop(now){
  if(!G.three)return;
  rafId=requestAnimationFrame(loop);
  const dt=clamp((now-clock.last)/1000||0.016,0.001,0.05);
  clock.last=now;
  S.t+=dt;
  stepTweens(dt);
  G.rainUniforms.uTime.value=S.t;
  G.glowUniforms.uTime.value=S.t;
  G.bbMat.uniforms.uTime.value=S.t;
  G.hsMat.uniforms.uTime.value=S.t;
  if(S.mode==='intro'){
    introTick(dt);
  }else if(S.mode==='walk'||S.mode==='return'){
    S.pSm+=(currentP()-S.pSm)*Math.min(1,dt*4.5);
    placeCamera(S.pSm);
    updateDistricts();
    updateLazy();
    doRaycast(dt);
  }
  updateShutters(dt);
  updateFlickers(dt);
  updateWindows(dt);
  if(S.mode!=='boot')updateHUD();
  /* 前 110 帧均速 <30fps → 运行时降档 */
  if(!S.fps.done&&S.mode==='walk'){
    S.fps.acc+=dt;S.fps.n++;
    if(S.fps.n>=110){
      S.fps.done=true;
      if(S.fps.acc/S.fps.n>1/30){
        G.renderer.setPixelRatio(1);
        if(G.rain){
          const c=G.rain.geometry.getAttribute('position').count;
          G.rain.geometry.setDrawRange(0,Math.floor(c/2));
        }
      }
    }
  }
  G.renderer.render(G.scene,G.camera);
}
let rzT=0;
addEventListener('resize',()=>{
  clearTimeout(rzT);
  rzT=setTimeout(()=>{
    if(!G.three)return;
    G.camera.aspect=innerWidth/innerHeight;
    G.camera.updateProjectionMatrix();
    G.renderer.setSize(innerWidth,innerHeight,false);
  },150);
});
document.addEventListener('visibilitychange',()=>{
  if(!G.three||RM)return;
  if(document.hidden)cancelAnimationFrame(rafId);
  else{clock.last=performance.now();rafId=requestAnimationFrame(loop);}
});
$('stage').addEventListener('webglcontextlost',(e)=>{
  e.preventDefault();
  degrade();
  toast('显卡开小差了，已切换到霓虹备用街',3000);
},false);

/* ============================================================
   16. 降级与引导（CDN 三级兜底 → CSS 霓虹街）
   ============================================================ */
function loadScript(src){
  return new Promise((ok,no)=>{
    const s=document.createElement('script');
    s.src=src;s.onload=ok;s.onerror=no;
    document.head.appendChild(s);
  });
}
async function loadThree(){
  const cdns=[
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js',
    'https://unpkg.com/three@0.149.0/build/three.min.js'
  ];
  for(const u of cdns){
    try{await loadScript(u);if(window.THREE)return true;}catch(e){}
  }
  return !!window.THREE;
}
function degrade(){
  G.three=false;
  cancelAnimationFrame(rafId);
  onDetailClosed=null;
  document.body.classList.remove('intro-lock','intro-on');
  document.body.classList.add('no3d');
  buildStaticStreet();
}
function staticFallback(){
  document.body.classList.add('rms');
  document.body.classList.remove('intro-lock');
  try{
    G.scene.background.copy(G.colNight);
    G.scene.fog.color.copy(G.colNight);
    G.hemi.intensity=0.55;
    G.glowUniforms.uReveal.value=1;
    G.tubeMeta.forEach((d,i)=>{G.tubeLit[i]=true;G.tubeMesh.setColorAt(i,G.tmpC.copy(d.c));});
    if(G.tubeMesh.instanceColor)G.tubeMesh.instanceColor.needsUpdate=true;
    placeCamera(0.055);
    G.renderer.render(G.scene,G.camera);
  }catch(e){}
  buildStaticStreet();
}
async function boot(){
  buildTicker();
  initContact();
  initBlog();
  initFooter();
  $('dBack').addEventListener('click',()=>closeDetail(true));
  let ok=false;
  try{ok=await loadThree();}catch(e){ok=false;}
  if(ok&&window.THREE){
    try{
      initScene();
      onDetailClosed=returnToStreet;
      if(RM)staticFallback();
      else{
        startIntro();
        clock.last=performance.now();
        rafId=requestAnimationFrame(loop);
      }
    }catch(err){
      try{console.warn('场景初始化失败，降级：',err);}catch(e2){}
      degrade();
    }
  }else degrade();
  $('loader').classList.add('done');
}
addEventListener('pointermove',onPointerMove,{passive:true});
addEventListener('click',onCanvasClick,true);
$('skipBtn').addEventListener('click',(e)=>{e.stopPropagation();skipIntro();});
addEventListener('keydown',(e)=>{
  if(S.mode==='intro'&&(e.key===' '||e.key==='Enter'||e.key==='Escape'))skipIntro();
});
boot();

