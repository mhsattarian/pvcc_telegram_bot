
require('dotenv').config(); // Reads the .env file and add each line in environment variables

const Telegraf = require('telegraf'), // Telegram API wrapper
  Extra = require('telegraf/extra'),
  Markup = require('telegraf/markup'),
  session = require('telegraf/session'),
  Composer = require('telegraf/composer'),
  Stage = require('telegraf/stage'),
  WizardScene = require('telegraf/scenes/wizard'),
  Scene = require('telegraf/scenes/base'),
  { enter } = Stage;

const http = require('http'),
  https = require('https'),
  fs = require('fs');


// connects to Bot using the Token
const bot = new Telegraf(process.env.TG_TOKEN);

// Persian Commands to Be spoken!
const commands = [
  'روشن',
  'خاموش',
  'دوربین',
  'سلفی',
  'ساعت',
  'قفل',
  'دیتا',
  'وای‌فای',
  'تماس',
  'گالری',
  'تنظیمات',
  'موزیک',
  'تلگرام',
  'بالا',
  'پایین',
  'چپ',
  'راست',
  'کی ساختت؟'
];

// Number of the command to get its voice
session.commandCounter = 0;
// Status of each command (whether its spoken and how many times)
session.commandStatuses = {}
// Creating the commandStatuses object using commands array
for (var i=0; i<commands.length; i++) { 
  session.commandStatuses[commands[i]] = {
    done: false,
    voiceCount : 0
  };
}


bot.telegram.deleteWebhook(); // for making sure no webhook is running
bot.startPolling(); // Start listening for updates from the bot


const sceneCleaner = () => async (ctx) => {
  ctx.scene.state.messages.forEach(({ message_id: id }) => {
    try {
      ctx.deleteMessage(id)
    } catch (error) {
      console.log(error)
    }
  })
}

// Show a Keyboard of Commands and their voice count
const chooseCommandKeyboard = () => Markup.keyboard(commands.map(
  (item)=> `${item} (${session.commandStatuses[item].voiceCount} از 3)`))
  .oneTime().resize().extra()

// Stores the command choosen to be pronounced (fill in first scene and uses in seconds)
var choosenCommand = '';

// The choose your command scene
const firstScene = new Scene('choose_command')
  .enter(async (ctx) => {
    const messages = []
    messages.push(await ctx.reply('یکی از دستورات را انتخاب کنید:', chooseCommandKeyboard()))
    // ctx.scene.state.messages = messages
  })
  .on('text', (ctx)=>{
    text = ctx.message.text.split(' ')[0]; // Input text not in commands
    if (!commands.includes(text)) ctx.reply('لطفا یکی از دستورات لیست را انتخاب کنید.');
    else choosenCommand = text;
    if (session.commandStatuses[choosenCommand].voiceCount < 3) ctx.scene.enter('get_voices');
    else ctx.reply('یکی دیگر از دستورات را انتخاب کنید:')
  })
  .on('voice', (ctx)=>ctx.reply("لطفا اول یک دستور را انتخاب کنید"))
  .leave(async (ctx)=> {})

const secondScene = new Scene('get_voices')
  .enter((ctx) => {
    const messages = []
    var voiceCount = ++session.commandStatuses[choosenCommand].voiceCount;
    if (voiceCount > 3) {
      --session.commandStatuses[choosenCommand].voiceCount;
      ctx.scene.enter('choose_command')
    }
    else{
      console.log(voiceCount)
      ctx.reply(`
      مرتبه ${voiceCount == 1 ? '1️⃣' : voiceCount == 2 ? '2️⃣' : '3️⃣'}
      صدای خود را ضبط کرده و ارسال کنید:
      `)
    }
    // ctx.scene.state.messages = messages
  })
  .on('voice', (ctx)=>{
    ctx.reply("👌");
    console.log(session.commandStatuses[choosenCommand].voiceCount);
    ctx.scene.reenter();
  })
  .leave(async (ctx) => {
  })



const stage = new Stage([firstScene, secondScene], { ttl: 10 })
bot.use(session())
bot.use(stage.middleware())

/** -------------------- on START --------------- **/

var username = '';

bot.start((ctx) => {
  // Get user's username
  username = ctx.from.username;
  // Greetings
  ctx.reply(`
    با سلام ${username}.
    ممنونیم که وقت خودتون رو در اختیار ما گذاشته و به جمع‌آوری دیتاستی از دستورات فارسی کمک می‌کنید 🙏. در ادامه پس از انتخاب گزینه شروع، در هر مرتبه یک دستور به شما نمایش داده می‌شود و از شما خواسته می‌شود که آن را سه بار ضبط کرده و ارسال کنید.
    برای شروع گزینه زیر را نتخاب کنید:
    `,
    Markup.inlineKeyboard([
      Markup.callbackButton('شروع', 'start_confirmed') // Adds a glassy button to start the process
    ]).extra());
  }
);

// When the شروع glassy button is pressed
bot.action('start_confirmed', (ctx, next) => {
  ctx.scene.enter('choose_command')
});

// url = bot.telegram.getFileLink(ctx.message.voice.file_id).then(url=>{
//       console.log(url)
//       getFile(url);
//       ctx.reply(url)
//     })


// function getFile(url){
//   console.log(url);
//   var file = fs.createWriteStream("file.oga");
//   var request = https.get(url, function(response) {
//     response.pipe(file);
//   });
// }
