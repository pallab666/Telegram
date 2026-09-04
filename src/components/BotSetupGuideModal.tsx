import { motion } from 'motion/react';
import React, { useState } from 'react';
import { X, Copy, Check, Terminal, ExternalLink, Bot, Globe, ShieldCheck, Sparkles, Code2 } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
interface BotSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}
export const BotSetupGuideModal: React.FC<BotSetupGuideModalProps> = ({
  isOpen,
  onClose,
  appUrl,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [activeTab, setActiveTab] = useState<'steps' | 'node' | 'python' | 'telegram'>('steps');
  if (!isOpen) return null;
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic('success');
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };
  const nodeJsBotCode = `// bot.js - Node.js Telegram Mini App Bot
import { Telegraf } from 'telegraf';
const BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN_HERE';
const WEB_APP_URL = '${appUrl || 'https://your-domain.com'}';
const bot = new Telegraf(BOT_TOKEN);
// /start command - sends the Mini App button
bot.start((ctx) => {
  const firstName = ctx.from.first_name || 'User';
  return ctx.reply(\`স্বাগতম \${firstName}! 🎉\\n\\nSmart Earning মিনি অ্যাপে কাজ করে প্রতিদিন আয় করুন। নিচের বাটনে ক্লিক করে অ্যাপটি ওপেন করুন:\`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎁 Open Smart Earning App',
            web_app: { url: WEB_APP_URL }
          }
        ],
        [
          { text: '📢 জয়েন চ্যানেল', url: 'https://t.me/your_channel' },
          { text: '💬 হেল্পলাইন', url: 'https://t.me/your_support' }
        ]
      ]
    }
  });
});
bot.launch().then(() => {
  console.log('🤖 Telegram Mini App Bot is running...');
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));`;
  const pythonBotCode = `# bot.py - Python Telegram Mini App Bot
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN_HERE"
WEB_APP_URL = "${appUrl || 'https://your-domain.com'}"
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_name = update.effective_user.first_name
    keyboard = [
        [
            InlineKeyboardButton(
                text="🎁 Open Smart Earning App",
                web_app=WebAppInfo(url=WEB_APP_URL)
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        f"হ্যালো {user_name}! 🚀\\nSmart Earning এ আপনাকে স্বাগতম। এখনই শুরু করতে নিচের বাটনে চাপ দিন:",
        reply_markup=reply_markup
    )
if __name__ == '__main__':
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    print("Bot is started...")
    app.run_polling()`;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                {lang === 'bn' ? 'টেলিগ্রাম আর্নিং বট তৈরির নির্দেশিকা' : 'Telegram Mini App Bot Guide'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'কীভাবে এই বট ও মিনি অ্যাপ তৈরি করবেন' : 'Step-by-step guide to build and deploy'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Language toggle */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setLang(lang === 'bn' ? 'en' : 'bn');
              }}
              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-200 font-semibold transition-colors"
            >
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Tab Selector */}
        <div className="flex items-center px-4 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto gap-1.5">
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'steps' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            📋 {lang === 'bn' ? 'ধাপসমূহ (Steps)' : 'Setup Steps'}
          </button>
          <button
            onClick={() => setActiveTab('node')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'node' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            🟢 Node.js Code
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'python' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            🐍 Python Code
          </button>
          <button
            onClick={() => setActiveTab('telegram')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'telegram' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            ⚡ BotFather
          </button>
        </div>
        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm text-slate-700 bg-slate-50">
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl">
                <h4 className="font-bold text-indigo-900 text-sm mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  {lang === 'bn' ? 'টেলিগ্রাম মিনি অ্যাপ কীভাবে কাজ করে?' : 'How does a Telegram Mini App work?'}
                </h4>
                <p className="text-slate-600 leading-relaxed text-xs">
                  {lang === 'bn'
                    ? 'আপনার স্ক্রিনশটের অ্যাপটি কোনো সাধারণ টেক্সট বট নয়, এটি হলো একটি Telegram Mini App (TMA)। এটি মূলত একটি React/HTML5 ওয়েব অ্যাপ্লিকেশন যা টেলিগ্রামের ভেতর ফুলস্ক্রিন ব্রাউজার হিসেবে রান করে।'
                    : 'This is not just a text bot; it is a Telegram Mini App (TMA). It is a web app loaded inside Telegram with access to user credentials and haptics.'}
                </p>
              </div>
              {/* Step 1 */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                  <span>{lang === 'bn' ? 'বট তৈরি করুন (@BotFather দিয়ে)' : 'Create Bot via @BotFather'}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {lang === 'bn'
                    ? 'টেলিগ্রামে @BotFather ওপেন করে /newbot কমান্ড দিন। তারপর একটি নাম ও ইউজারনেম দিন (যেমন: SmartEarning_bot)। আপনি একটি BOT_TOKEN পাবেন।'
                    : 'Open @BotFather on Telegram, send /newbot, choose a name and username. Keep your BOT_TOKEN safe.'}
                </p>
                <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl font-mono text-xs text-indigo-300 border border-slate-800">
                  <span>/newbot</span>
                  <button
                    onClick={() => handleCopy('/newbot', 'step1')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedSection === 'step1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Step 2 */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
                  <span>{lang === 'bn' ? 'মিনি অ্যাপ লিংক করুন (@BotFather)' : 'Configure Web App in @BotFather'}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {lang === 'bn'
                    ? '@BotFather এ /newapp কমান্ড দিন। আপনার বট সিলেক্ট করে অ্যাপের নাম, ফটো দিন এবং Web App URL হিসেবে আপনার হোস্ট করা লাইভ লিংকটি দিন:'
                    : 'Send /newapp in @BotFather, select your bot, provide the title, logo, and set the Web App URL:'}
                </p>
                <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl font-mono text-xs text-indigo-300 border border-slate-800">
                  <span className="truncate mr-2">{appUrl || window.location.origin}</span>
                  <button
                    onClick={() => handleCopy(appUrl || window.location.origin, 'step2')}
                    className="text-slate-400 hover:text-white flex-shrink-0"
                  >
                    {copiedSection === 'step2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {/* Step 3 */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">3</span>
                  <span>{lang === 'bn' ? 'মেব্যু বাটন সেট করুন (/setmenubutton)' : 'Set Menu Button'}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {lang === 'bn'
                    ? '@BotFather এ /setmenubutton দিয়ে আপনার বট সিলেক্ট করুন এবং Web App URL সেট করুন, যাতে চ্যাটের নিচে সরাসরি "🎁 Open App" বাটন শো করে!'
                    : 'Use /setmenubutton in BotFather to place a persistent "Open App" button in the bottom-left chat corner.'}
                </p>
              </div>
              {/* Step 4 */}
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">4</span>
                  <span>{lang === 'bn' ? 'পেমেন্ট ও ব্যাকএন্ড (bKash/Nagad)' : 'Payments & Backend (bKash/Nagad)'}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {lang === 'bn'
                    ? 'ইউজার যখন ৳1000 বিডিটি উইথড্র রিকোয়েস্ট করবে, তা ডাটাবেজে (যেমন MongoDB / Firebase) জমা হবে। অ্যাডমিন প্যানেল থেকে বিকাশ/নগদে ম্যানুয়ালি বা bKash Merchant API দিয়ে টাকা পাঠিয়ে স্ট্যাটাস "Approved" করে দেওয়া হয়।'
                    : 'When users request a withdrawal, their bKash/Nagad account and amount are saved. The admin reviews and approves payments.'}
                </p>
              </div>
            </div>
          )}
          {activeTab === 'node' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-mono font-bold">bot.js (Telegraf Library)</span>
                <button
                  onClick={() => handleCopy(nodeJsBotCode, 'node-code')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold shadow-sm"
                >
                  {copiedSection === 'node-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Code</span>
                </button>
              </div>
              <pre className="p-3.5 bg-slate-900 rounded-2xl overflow-x-auto text-[11px] font-mono text-emerald-400 border border-slate-800 shadow-sm">
                {nodeJsBotCode}
              </pre>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium">
                <strong>Install command:</strong> <code className="text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono">npm install telegraf</code>
              </div>
            </div>
          )}
          {activeTab === 'python' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-mono font-bold">bot.py (python-telegram-bot)</span>
                <button
                  onClick={() => handleCopy(pythonBotCode, 'python-code')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold shadow-sm"
                >
                  {copiedSection === 'python-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Code</span>
                </button>
              </div>
              <pre className="p-3.5 bg-slate-900 rounded-2xl overflow-x-auto text-[11px] font-mono text-amber-300 border border-slate-800 shadow-sm">
                {pythonBotCode}
              </pre>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium">
                <strong>Install command:</strong> <code className="text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono">pip install python-telegram-bot</code>
              </div>
            </div>
          )}
          {activeTab === 'telegram' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">BotFather Commands Checklist:</h4>
              <div className="space-y-2">
                {[
                  { cmd: '/newbot', desc: 'নতুন বট তৈরি করতে (নাম ও ইউজারনেম দিন)' },
                  { cmd: '/newapp', desc: 'নতুন মিনি অ্যাপ লিংক তৈরি করতে (ওয়েব অ্যাপ URL দিন)' },
                  { cmd: '/setmenubutton', desc: 'টেলিগ্রাম চ্যাটের কোনায় পার্মানেন্ট ওয়েব অ্যাপ বাটন বসাতে' },
                  { cmd: '/setdescription', desc: 'বটের পরিচিতি টেক্সট সেট করতে' },
                  { cmd: '/setuserpic', desc: 'বটের প্রোফাইল ফটো দিতে' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div>
                      <span className="font-mono text-indigo-600 font-bold text-xs">{item.cmd}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(item.cmd, `bf-${idx}`)}
                      className="text-slate-400 hover:text-indigo-600 p-1 bg-slate-50 border border-slate-200 rounded-lg shadow-sm"
                    >
                      {copiedSection === `bf-${idx}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shadow-sm">
          <span className="text-[11px] text-slate-500 font-medium">
            Smart Earning Telegram Mini App
          </span>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98"
          >
            {lang === 'bn' ? 'বুঝেছি / ঠিক আছে' : 'Got it!'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};