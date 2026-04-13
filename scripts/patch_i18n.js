const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../messages');
const enPath = path.join(messagesDir, 'en.json');
const jaPath = path.join(messagesDir, 'ja.json');
const zhCNPath = path.join(messagesDir, 'zh-CN.json');
const zhTWPath = path.join(messagesDir, 'zh-TW.json');

// Read JSONs
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));
const zhCN = JSON.parse(fs.readFileSync(zhCNPath, 'utf8'));
const zhTW = JSON.parse(fs.readFileSync(zhTWPath, 'utf8'));

// Fix en.json
if (!en.home.viewAll) en.home.viewAll = "View All";
if (!en.filter.allLanguages) en.filter.allLanguages = "All Languages";
if (!en.listing) en.listing = {};
if (!en.listing.applicationSent) en.listing.applicationSent = "Application sent, please wait for host reply";

if (en.home.findCompanion) delete en.home.findCompanion;
if (ja.home && ja.home.findCompanion) delete ja.home.findCompanion;

// Fix ja.json
if (!ja.listing) ja.listing = {};
if (!ja.listing.applicationSent) ja.listing.applicationSent = "申し込みが送信されました。主催者の返信をお待ちください";

// Fix zh-CN.json
if (!zhCN.listing) zhCN.listing = {};
if (!zhCN.listing.applicationSent) zhCN.listing.applicationSent = "已发送申请，请等待主办人回覆";

zhCN.Options = {
  taiwanese: "台湾人",
  japanese: "日本人",
  other: "其他"
};

if (!zhCN.subscription) zhCN.subscription = {};
if (typeof zhCN.subscription.ticketTypes === 'string') {
  zhCN.subscription.ticketTypeLabel = zhCN.subscription.ticketTypes;
}
zhCN.subscription.ticketTypes = {
  find_companion: "寻找同行（持有连号票）",
  sub_ticket_transfer: "子票转让",
  ticket_exchange: "票券交换"
};
zhCN.subscription.acceptedTypes = {
  find_companion: "可接受同行",
  sub_ticket_transfer: "可接受转让子票",
  any: "皆可"
};

// Copy the missing 'request' object from zh-TW to zh-CN, but simplified Chinese translated
zhCN.request = {
  "title": "求票",
  "limitReached": "已达上限",
  "alreadyMaxRequests": "您已在此活动提交 {current} 张求票（上限 {max} 张）",
  "verificationRequired": "需要验证",
  "needEmailForRequest": "请先验证 Email 才能提交求票请求",
  "goVerifyEmail": "前往验证 Email",
  "requestSuccess": "求票已发布！",
  "requestSuccessDesc": "您的求票已成功发布，有票的人将会看到您的请求并与您联系！",
  "backToHome": "返回首页",
  "requestInfo": "求票说明",
  "requestInfoDesc": "发表您的求票请求，有票的人看到后可以主动联系您。不需要设定价格，避免成为票券买卖。",
  "selectEvent": "选择活动",
  "eventName": "活动名称",
  "pleaseSelectEvent": "请选择活动",
  "requestLimitReached": "已达此活动的求票上限",
  "acceptedTypes": "可接受的方式",
  "acceptedTypesDesc": "选择您可以接受的票券取得方式（可复选）",
  "wantedSeatGrades": "想要的座位等级",
  "wantedSeatGradesDesc": "选择您可以接受的座位等级（可复选）",
  "noSeatGrades": "此活动尚未设定座位等级",
  "quantityAndNotes": "张数与备注",
  "quantity": "需要张数",
  "tickets": "张",
  "notes": "备注说明（选填）",
  "notesPlaceholder": "例如：希望可以一起排队聊天、只需要子票不需要同行...",
  "confirmSummary": "确认求票内容",
  "eventLabel": "活动",
  "acceptedLabel": "接受方式",
  "seatGradeLabel": "座位等级",
  "quantityLabel": "张数",
  "notesLabel": "备注",
  "submitRequest": "发布求票",
  "ratingStars": "{rating} 颗星",
  "needs": "需求 {count} 张",
  "viewDetails": "查看详情",
  "view": "查看",
  "requester": "求票者",
  "yourRequest": "您的求票",
  "contacted": "已联络求票人",
  "iCanHelp": "我可以帮忙 (联络对方)",
  "contactRequester": "联络求票人",
  "contactConfirmDesc": "即将私讯给 {username} 关于「{eventName}」的求票。",
  "deleteRequest": "删除求票",
  "deleteConfirm": "确定要删除这笔求票活动吗？这个动作无法复原喔！"
};

// Write files
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(jaPath, JSON.stringify(ja, null, 2));
fs.writeFileSync(zhCNPath, JSON.stringify(zhCN, null, 2));

console.log('JSON files successfully patched.');
