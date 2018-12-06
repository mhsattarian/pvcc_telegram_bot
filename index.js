
const Telegraf = require('telegraf'), // Telegram API wrapper
  Extra = require('telegraf/extra'),
  Markup = require('telegraf/markup'),
  session = require('telegraf/session'),
  http = require('http'),
  https = require('https'),
  fs = require('fs');

const bot = new Telegraf('685970026:AAG5KS6SYLo4K9pi-LXuqdAHWK4FBQMeB-E'); // connects to Bot using the Token
const commands = [ // Persian Commands to Be spoken!
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

session.commandCounter = 0; // Number of the command to get its voice
session.commandStatuses = {} // Status of each command (whether its spoken and how many times)
for (var i=0; i<commands.length; i++) { // Creating the commandStatuses object using commands array
  session.commandStatuses[commands[i]] = {
    done: false,
    voiceCount : 0
  };
}


bot.telegram.deleteWebhook(); // for making sure no webhook is running
bot.startPolling(); // Start listening for updates from the bot

/** On START */
bot.start((ctx) => ctx.reply(`
با سلام.
ممنونیم که وقت خودتون رو در اختیار ما گذاشته و به جمع‌آوری دیتاستی از دستورات فارسی کمک می‌کنید. در ادامه پس از انتخاب گزینه شروع، در هر مرتبه یک دستور به شما نمایش داده می‌شود و از شما خواسته می‌شود که آن را سه بار ضبط کرده و ارسال کنید.
برای شروع گزینه زیر را نتخاب کنید:
`,
    Markup.inlineKeyboard([
      Markup.callbackButton('شروع', 'start_confirmed')
    ]).extra()));

bot.action('start_confirmed', (ctx, next) => {
  return showMessage(ctx);
});

bot.action('next_command', (ctx, next) => {
  return showNextMessage(ctx);
});


function showMessage(ctx) {
  ctx.reply(commands[session.commandCounter],
    Markup.inlineKeyboard([
      Markup.callbackButton('more', 'next_command')
    ]).extra());
}

function showNextMessage(ctx){
  session.commandCounter = session.commandCounter + 1;
  showMessage(ctx)
}

bot.on('voice', (ctx) => {
  console.log(ctx.message.voice.file_id)
  url = bot.telegram.getFileLink(ctx.message.voice.file_id).then(url=>{
    console.log(url)
    getFile(url);
    ctx.reply(url)
  })
})
bot.command('caption', (ctx) => ctx.replyWithPhoto('https://picsum.photos/200/300/?random', {
  caption: 'Caption *text*',
  parse_mode: 'Markdown'
}))
bot.use((ctx) => {
  console.log("Welcom!!!!")
})



function getFile(url){
  console.log(url);
  var file = fs.createWriteStream("file.oga");
  var request = https.get(url, function(response) {
    response.pipe(file);
  });
}

// bot.use(Telegraf.log())

// bot.command('onetime', ({ reply }) =>
//   reply('One time keyboard', Markup
//     .keyboard(['/simple', '/inline', '/pyramid'])
//     .oneTime()
//     .resize()
//     .extra()
//   )
// )

// bot.command('custom', ({ reply }) => {
//   return reply('Custom buttons keyboard', Markup
//     .keyboard([
//       ['🔍 Search', '😎 Popular'], // Row1 with 2 buttons
//       ['☸ Setting', '📞 Feedback'], // Row2 with 2 buttons
//       ['📢 Ads', '⭐️ Rate us', '👥 Share'] // Row3 with 3 buttons
//     ])
//     .oneTime()
//     .resize()
//     .extra()
//   )
// })

// bot.hears('🔍 Search', ctx => ctx.reply('Yay!'))
// bot.hears('📢 Ads', ctx => ctx.reply('Free hugs. Call now!'))

// bot.command('special', (ctx) => {
//   return ctx.reply('Special buttons keyboard', Extra.markup((markup) => {
//     return markup.resize()
//       .keyboard([
//         markup.contactRequestButton('Send contact'),
//         markup.locationRequestButton('Send location')
//       ])
//   }))
// })

// bot.command('pyramid', (ctx) => {
//   return ctx.reply('Keyboard wrap', Extra.markup(
//     Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
//       wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
//     })
//   ))
// })

// bot.command('simple', (ctx) => {
//   return ctx.replyWithHTML('<b>Coke</b> or <i>Pepsi?</i>', Extra.markup(
//     Markup.keyboard(['Coke', 'Pepsi'])
//   ))
// })

// bot.command('inline', (ctx) => {
//   return ctx.reply('<b>Coke</b> or <i>Pepsi?</i>', Extra.HTML().markup((m) =>
//     m.inlineKeyboard([
//       m.callbackButton('Coke', 'Coke'),
//       m.callbackButton('Pepsi', 'Pepsi')
//     ])))
// })

// bot.command('random', (ctx) => {
//   return ctx.reply('random example',
//     Markup.inlineKeyboard([
//       Markup.callbackButton('Coke', 'Coke'),
//       Markup.callbackButton('Dr Pepper', 'Dr Pepper', Math.random() > 0.5),
//       Markup.callbackButton('Pepsi', 'Pepsi')
//     ]).extra()
//   )
// })

// bot.command('caption', (ctx) => {
//   return ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' },
//     Extra.load({ caption: 'Caption' })
//       .markdown()
//       .markup((m) =>
//         m.inlineKeyboard([
//           m.callbackButton('Plain', 'plain'),
//           m.callbackButton('Italic', 'italic')
//         ])
//       )
//   )
// })

// bot.hears(/\/wrap (\d+)/, (ctx) => {
//   return ctx.reply('Keyboard wrap', Extra.markup(
//     Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
//       columns: parseInt(ctx.match[1])
//     })
//   ))
// })

// bot.action('Dr Pepper', (ctx, next) => {
//   return ctx.reply('👍').then(() => next())
// })

// bot.action('plain', async (ctx) => {
//   ctx.editMessageCaption('Caption', Markup.inlineKeyboard([
//     Markup.callbackButton('Plain', 'plain'),
//     Markup.callbackButton('Italic', 'italic')
//   ]))
// })

// bot.action('italic', (ctx) => {
//   ctx.editMessageCaption('_Caption_', Extra.markdown().markup(Markup.inlineKeyboard([
//     Markup.callbackButton('Plain', 'plain'),
//     Markup.callbackButton('* Italic *', 'italic')
//   ])))
// })

// bot.action(/.+/, (ctx) => {
//   return ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`)
// })

// bot.startPolling()