/*
 *
 * PVCC Telegram Bot (@pvcc_bot)[https://telegram.me/pvcc_bot]
 * Persian Voice Command Collector 
 * 
 * Written by:
 * Mohammad Hassan Sattarian   @MH_Sattarian
 * Amir Mohammad Ghoreyshi     @AM_Ghoreyshi
 * 
 * Using:
 * Nodejs + Telegraf (Telegram Bot API Wrapper)
 * 
 * SRU University
 * fall 2018
 * 
 * 
*/


// Reads the .env file and add each line in environment variables
// uses for telegram bot api token
require('dotenv').config();

const Telegraf = require('telegraf'), // Telegram Bot API wrapper
  Extra = require('telegraf/extra'),
  Markup = require('telegraf/markup'),
  Composer = require('telegraf/composer'),
  Stage = require('telegraf/stage'),
  session = require('telegraf/session'),
  WizardScene = require('telegraf/scenes/wizard'),
  Scene = require('telegraf/scenes/base'),
  LocalSession = require('telegraf-session-local'),
  shell = require('shelljs'),
  { fork } = require('child_process'),
  { enter } = Stage,
  persianJS = require('persianjs'),
  rimraf = require('rimraf'),
  f2f = require('f2f');

const http = require('http'),
  https = require('https'),
  fs = require('fs');



/** -------------------- Initilizations --------------- **/

// Adding the Logger
const winston = require('winston');
const { combine, timestamp, label, prettyPrint } = winston.format;
var logger;
handleLogger();

// Start voice files indexing script
const expressUserFiles = fork('./expressUserFiles.js');

// Initilizes and connects to Bot using the Token
const bot = new Telegraf(process.env.BOT_TOKEN);

// Persian Commands to Be spoken!
const commands = [
  'روشن',
  'خاموش',
  'روشن شو',
  'خاموش شو',
  'ضبط کن',
  'ماشین حساب',
  'گرامافون',
  'شروع کن',
  'برخیز',
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
  'کی ساختت؟',
  'متفرقه',
];

// Initilize the Finglish to Farsi Class
const F2F = new f2f();

// Assign an id to commands (id is command in finglish)
commandIds = {}
commands.forEach(command => commandIds[command] = F2F.simplef2f(command))



/** -------------------- on Using --------------- **/

// [*not using now*] A helper function to clear all messages from the bot in this scene
const sceneCleaner = () => async (ctx) => {
  // Should store messages in message property of scene's state
  ctx.scene.state.messages.forEach(({ message_id: id }) => {
    try {
      ctx.deleteMessage(id)
    } catch (error) {
      console.log(error)
    }
  })
}

// Show a Keyboard of Commands and their voice count
const chooseCommandKeyboard = (userSession) => Markup.keyboard(commands.map(
  (item)=> `${item}${
      ((userSession.commandStatuses[item].voiceCount || 0) >= 3) ? ' ✅' : ''
    }`))
  .oneTime().resize().extra()

// 3. FIRST SCENE : CHOSE YOUR COMMAND
const firstScene = new Scene('choose_command')
  .enter(async (ctx) => {
    ctx.userSession.lastStage = 'choose_command';
    // [*not used now*] for storing messages to be cleared using `sceneCleaner`
    // const messages = []

    // Finnished commands. Say thanks and so
    if (ctx.userSession.commandCounter == 3) {
      return messages.push(await ctx.reply(`
        از شما واقعا ممنونیم که تمامی دستورات را انجام دادید.
        می‌توانید دستورات مربوط به خودتون رو در آدرس زیر مشاهده کنید:
        http://dataset.class.vision/voices/${getSessionKey(ctx).replace(':', '-')}
      `));  
    }

    // show a keyboard to user to choose between commands
    // messages.push()
    await ctx.reply('یکی از دستورات را انتخاب کنید:', chooseCommandKeyboard(ctx.userSession))
    // ctx.scene.state.messages = messages
  })
  .command('help', ctx => {
    ctx.reply(`
    نحوه کار ربات بدین صورت است که در هر مرتبه یک دستور به شما نمایش داده می‌شود و از شما خواسته می‌شود که صدای خود در حین خواندن آن دستور را سه مرتبه ضبط کرده و ارسال کنید.
    در حین ضبط یک دستور، یعنی زمانی که هنوز برای بار سوم دستور را نخوانده و ارسال نکرده‌اید از ارسال متن و یا کامند به بات خودداری کنید.
    پس از اتمام دستورات و یا با استفاده از کامند /myvoices می‌توانید آدرسی که فایل صوتی دستورات مربوط به شما در آن ذخیره می‌شود را مشاهده کنید.
    `);
  })
  .command('info', ctx => {
    ctx.reply(`
    هدف این ربات جمع‌آوری داده‌های صوتی مورد نیاز برای آموزش یک مدل یادگیری عمیق است که قادر به تشخیص دستورات فارسی باشد.
  
    این ربات برای پروژه درس کارشناسی در دانشگاه شهید رجایی توسعه داده‌شده و مورد استفاده قرار خواهد گرفت. البته دیتاست جمع‌آوری شده نیز به صورت عمومی در دسترس خواهد بود که می‌توانید پس از اتمام دستورات و یا با استفاده از کامند /myvoices آدرسی که فایل صوتی دستورات مربوط به شما در آن ذخیره می‌شود را مشاهده کنید.
    `);
  })
  .command('credit', ctx => {
    ctx.reply(`
    لطفا انتقادات، بازخورد‌ها و پیشنهادهای خود را به @MH_Sattarian و @AM_Ghoreyshi ارسال کنید.
    `);
  })
  .command('myvoices', ctx => {
    ctx.reply(`
      شما می‌توانید ویس‌های مربوطه خود را در آدرس زیر مشاهده کنید:
      http://dataset.class.vision/voices/${getSessionKey(ctx).replace(':', '-')}
    `);
  })
  // Calling /start on first scene (Do exactly as Bot.start)
  .start((ctx) => {
    // Chack if User has already initilized the bot and has account in sessions
    if ('userName' in ctx.userSession) {
      // Check if user wants to delete voices and restart
      ctx.reply(`شما پیش از این ربات را فعال کرده‌اید.
      اگر مایلید تا دستورات ثبت‌شده را پاک کرده و از ابتدا شروع کنید گزینه زیر را انتخاب کنید:`,
        Markup.inlineKeyboard([
          Markup.callbackButton('شروع مجدد', 'reStart') // Adds a glassy button to start the process
        ]).extra());
    }
    else {
      // Initializes and Greetings
      botInitilizer(ctx); 
    }
  })
  .on('text', async (ctx)=>{
    // cuase command had become like:  روشن شو ✅
    command = ctx.message.text.split(' ').filter(word => word != '✅').join(' ');
    console.log("Entered: ", command)

    if (command === 'متفرقه') {
      ctx.reply(`
      برای این دستور هر کلمه دلخواهی را به غیر از کلمات لیست بالا می‌توانید ضبط و ارسال کنید.
      از این دستورات برای شناسایی کلمات بی اهمیت و یا نویزی استفاده می‌شوند.
      `);
    }
    
    // Ask for another command if input text not in commands
    if (!commands.includes(command)) {
      return ctx.scene.reenter()
    }
    // Stores the command choosen to be pronounced
    // (fills in first scene and uses in seconds)
    else ctx.userSession.choosenCommand = command;
  
    // If a command is spoken *less than* 3 times, go to second scene (pronouncing commands)
    try{
      console.log(ctx.userSession.commandStatuses[command]);
      if (ctx.userSession.commandStatuses[command].voiceCount < 3) {
        ctx.userSession.lastStage = 'get_voices';
        ctx.scene.enter('get_voices');
      }
      // otherwise Error to choose another command
      else {
        ctx.reply(`
        شما این دستور را به تعداد کافی ارسال کرده اید.
        اگر می‌خواهید بازهم آن را ضبط کنید روی دکمه زیر کلیک کنید،
        مگرنه یک دستور دیگر انتخاب کنید.
        `,
        Markup.inlineKeyboard([
          Markup.callbackButton('ارسال بیشتر', 'add_more_voice')
        ]).extra());
      }
    }
    catch(err){
      console.log(err);
      // Just to make sure no Error is occurred
      if (! 'voiceCount' in ctx.userSession.commandStatuses[command])
        ctx.userSession.commandStatuses[command].voiceCount = 0;
      ctx.scene.reenter();
    }

  })
  // On add_more_voice action (user wants to spoke the command again)
  .action('add_more_voice', (ctx, next) => {
    ctx.userSession.lastStage = 'get_voices';
    ctx.scene.enter('get_voices');
  })
  // if user tryed to send a recoreded voice in this scene Error
  .on('voice', (ctx)=>ctx.reply("لطفا اول یک دستور را انتخاب کنید"))
  // What to happen when leaving this scene (including switching between scenes)
  .leave(async (ctx)=> {
    // ctx.reply("hey",
    //   {ReplyKeyboardRemove: { remove_keyboard : true }},
    // );
    console.log("Leaving 1st scene");
  });


// SECOND SCENE : PRONOUNCE THE COMMAND
const secondScene = new Scene('get_voices')
  .enter((ctx) => {
    // Set last stage on user Session
    ctx.userSession.lastStage = 'get_voices';

    // [*not used now*] for storing messages to be cleared using `sceneCleaner`
    // const messages = []
    
    // If the command is pronounced 3 times go back to scene one (choosing commands)
    var voiceCount = ctx.userSession.commandStatuses[ctx.userSession.choosenCommand].voiceCount;
    // if command's voiceCount is 0 make it 1. cause the counter wont start at 0
    if (voiceCount == 0) {
      ++ctx.userSession.commandStatuses[ctx.userSession.choosenCommand].voiceCount;
      voiceCount++;
    }
    if (voiceCount > 3) {
      // User has spoken the command at least 3 times so setting .done to true
      ctx.userSession.commandStatuses[ctx.userSession.choosenCommand].done = true;

      ctx.reply(`
      مرتبه ${persianJs((voiceCount).toString()).digitsToWords().toString()}
      صدای خود را ضبط کرده و ارسال کنید:
      `,
      Markup.inlineKeyboard([
        Markup.callbackButton('انتخاب دستور دیگر', 'change_command') // Adds a glassy button to start the bot
      ]).extra());
    }
    else{
      // Ask user to pronounce the command
      ctx.reply(`
      مرتبه ${persianJs((voiceCount).toString()).digitsToWords().toString()}
      صدای خود را ضبط کرده و ارسال کنید:
      `)
    }

    // We want to store the urls to a file called urls.txt 
    // on a directory named based on user ids
    userId = getSessionKey(ctx).replace(':', '-');
    addr = `./voices/${userId}/${F2F.simplef2f(ctx.userSession.choosenCommand)}`;
    shell.mkdir('-p', addr);

    // If urls.txt file not exist create it
    if (!fs.existsSync(addr)) {
      fs.writeFile(`${addr}/urls.txt`, '', function(err) {
        if(err) {
            return console.log(err);
        }
      }); 
    }
    
    // ctx.scene.state.messages = messages
  })
  .on('voice', (ctx)=>{
    // Add command's voiceCount
    ++ctx.userSession.commandStatuses[ctx.userSession.choosenCommand].voiceCount;
    // Thank the user
    ctx.reply("👌");
    // Take voice file url to be download
    userId = getSessionKey(ctx).replace(':', '-');
    fileAddr = `./voices/${userId}/${F2F.simplef2f(ctx.userSession.choosenCommand)}/urls.txt`;
    url = bot.telegram.getFileLink(ctx.message.voice.file_id).then(url=>{
      fs.appendFile(fileAddr, url + '\n', function (err) {
        if (err) throw err;
      }); 
    });
    
    // ReEnter in current scene to ask for pronounciation again if needed
    ctx.scene.reenter();
  })
  // if user tryed to type something in this scene Error
  .on('text', (ctx)=>ctx.reply(`
  شما در حال ارسال دستور ${ctx.userSession.choosenCommand} هستید،\
  اگر می‌خواهید دستور دیگری را انتخاب کنید، ابتدا\
  لطفا ${persianJs((3 + 1 - ctx.userSession.commandStatuses[ctx.userSession.choosenCommand].voiceCount).toString()).digitsToWords().toString()} مرتبه دیگر همین دستور را ارسال کنید و سپس «انتخاب دستور دیگر» را انتخاب کنید.
  `))
  // On change_command action (user spoke the command at least 3 times and wants to choose another command)
  .action('change_command', (ctx, next) => {
      // Downlaodin voice files 
      const process = fork('./downloadVoices.js');
      process.send({ userId: getSessionKey(ctx).replace(':', '-'),
                    voiceId: F2F.simplef2f(ctx.userSession.choosenCommand)
              });
      
      //Cause we added once on line above on enter
      --ctx.userSession.commandStatuses[ctx.userSession.choosenCommand].voiceCount;
      ctx.userSession.remainCommands--;
      ctx.reply(`دستور ${ctx.userSession.choosenCommand}، ${persianJs((ctx.userSession.commandStatuses[ctx.userSession.choosenCommand].voiceCount).toString()).digitsToWords().toString()} مرتبه ارسال شد.`);
      ctx.userSession.lastStage = 'choose_command';
      ctx.scene.enter('choose_command');
  })
  // What to happen when leaving this scene (including switching between scenes)
  .leave(async (ctx) => { // TODO: Add the voice counter here!
    console.log("Leaving 2nd scene");
  });


// Initialize the session (from now on the session object of ctx can be accessed)
bot.use((new LocalSession({ database: 'sessions.json',  property: 'userSession'})).middleware());
// Tell the bot to use these stages
bot.use(session())

// Define Bot stages (scenes)
const stage = new Stage([firstScene, secondScene], { ttl: 100 })
bot.use(stage.middleware())


// for making sure no webhook is running
bot.telegram.deleteWebhook(); 
// Start listening for updates from the bot
bot.startPolling();


getSessionKey = (ctx) => {
  if (ctx.from && ctx.chat) {
    return `${ctx.from.id}:${ctx.chat.id}`
  } 
  return null
}

/** -------------------- on START --------------- **/

// help command - shows usage instructions
bot.command('help', ctx => {
  ctx.reply(`
  نحوه کار ربات بدین صورت است که در هر مرتبه یک دستور به شما نمایش داده می‌شود و از شما خواسته می‌شود که صدای خود در حین خواندن آن دستور را سه مرتبه ضبط کرده و ارسال کنید.
  در حین ضبط یک دستور، یعنی زمانی که هنوز برای بار سوم دستور را نخوانده و ارسال نکرده‌اید از ارسال متن و یا کامند به بات خودداری کنید.
  پس از اتمام دستورات و یا با استفاده از کامند /myvoices می‌توانید آدرسی که فایل صوتی دستورات مربوط به شما در آن ذخیره می‌شود را مشاهده کنید.
  `);
});

function botInitilizer (ctx) {
  // choose active user's session from the session object
  var userSession = ctx.userSession;
  // Number of the command to get its voice
  userSession.commandCounter = 0;
  // Users last stage (for controling stages and when they expire)
  userSession.lastStage = '';
  // Status of each command (whether its spoken and how many times)
  userSession.commandStatuses = {};
  commands.map(command=>{
    userSession.commandStatuses[command] = {
      done: false, // each command should be sponek at least 3 times
      voiceCount : 0, // how many times this command is spoken
    }
  })
  // Save user's username , name
  userSession.userName = ctx.from.username;
  userSession.fullName = ctx.from.first_name || '' + ctx.from.last_name || '';

  // Greetings
  ctx.reply(`
  سلام ${userSession.userName || + userSession.fullName}.
  ممنونیم که وقت خودتون رو در اختیار ما گذاشته و به جمع‌آوری دیتاستی از دستورات فارسی کمک می‌کنید.
  در ادامه پس از انتخاب گزینه شروع، در هر مرتبه یک دستور به شما نمایش داده می‌شود و از شما خواسته می‌شود که صدای خود در حین خواندن آن دستور را سه مرتبه ضبط کرده و ارسال کنید.
  توجه کنید که اطلاعات نامعتبر پس از بررسی حذف خواهند شد.
  برای شروع گزینه زیر را انتخاب کنید:
  `,
  Markup.inlineKeyboard([
    Markup.callbackButton('شروع', 'start_confirmed') // Adds a glassy button to start the bot
  ]).extra());
}

// 1. Initializations and greetings
bot.start((ctx) => {
  // Chack if User has already initilized the bot and has account in sessions
  if ('userName' in ctx.userSession) {
    // Check if user wants to delete voices and restart
    ctx.reply(`شما پیش از این ربات را فعال کرده‌اید.
    اگر مایلید تا دستورات ثبت‌شده را پاک کرده و از ابتدا شروع کنید گزینه زیر را انتخاب کنید:`,
      Markup.inlineKeyboard([
        Markup.callbackButton('شروع مجدد', 'reStart') // Adds a glassy button to start the process
      ]).extra());
  }
  else {
    // Initializes and Greetings
    botInitilizer(ctx); 
  }
});

// 2. When the شروع glassy button is pressed
bot.action('start_confirmed', (ctx, next) => {
  // Tell user about the bot's commands
  ctx.reply(`
  - کامندهای ربات
  /help - مشاهده روش استفاده از ربات
  /info - مشاهده اطلاعات مربوط به ربات
  /credit - مشاهده اطلاعات سازندگان ربات
  /myvoices - مشاهده آدرسی که توسط آن به فایل‌های صوتی خود دسترسی دارید
  `);
  // enter first scene (Choose command)
  ctx.scene.enter('choose_command')
  // store the last stage
  ctx.userSession.lastStage = 'choose_command';
});

// When user chosed to restart the bot
bot.action('reStart', (ctx, next) => {
  // Clear all User data
  ctx.userSession = {}
  // Remove user voices
  rimraf(`./voices/${getSessionKey(ctx).replace(':', '-')}`, function () {
    console.log('User data deleted.');
  });
  // Initilize the bot again
  botInitilizer(ctx);
});

// Session command for debugging
bot.command('session', ctx => {
  ctx.reply('session: \n' + JSON.stringify(ctx.session));
  ctx.reply('UserSession: \n' + JSON.stringify(ctx.userSession));
});

// info command - shows information about the bot
bot.command('info', ctx => {
  ctx.reply(`
  هدف این ربات جمع‌آوری داده‌های صوتی مورد نیاز برای آموزش یک مدل یادگیری عمیق است که قادر به تشخیص دستورات فارسی باشد.

  این ربات برای پروژه درس کارشناسی در دانشگاه شهید رجایی توسعه داده‌شده و مورد استفاده قرار خواهد گرفت. البته دیتاست جمع‌آوری شده نیز به صورت عمومی در دسترس خواهد بود که می‌توانید پس از اتمام دستورات و یا با استفاده از کامند /myvoices آدرسی که فایل صوتی دستورات مربوط به شما در آن ذخیره می‌شود را مشاهده کنید.
  `);
});

// credit command - shows developers credit
bot.command('credit', ctx => {
  ctx.reply(`
  لطفا انتقادات، بازخورد‌ها و پیشنهادهای خود را به @MH_Sattarian و @AM_Ghoreyshi ارسال کنید.
  `);
});

// myvoices command - shows myvoices address
bot.command('myvoices', ctx => {
  ctx.reply(`
    شما می‌توانید ویس‌های مربوطه خود را در آدرس زیر مشاهده کنید:
    http://dataset.class.vision/voices/${getSessionKey(ctx).replace(':', '-')}
  `);
});

// Continue, for when user's ttl is expired and the keyboard is not available to choose a comamnd
bot.command('continue', ctx => {
  //FIXME:
});


// Handle out of stage voices and texts
// and enter the last stage that user used
bot.on(['text', 'voice'], (ctx) => {
  console.log("[Bot] voice or text")
  // Return if text is a unrecognized command
  if ('text' in ctx.message && ctx.message.text.startsWith('/')) return
  // prompt a message to let user know that ttl is expired
  ctx.reply(`
  ببخشید فراموش کردم کجا بودیم! دوباره امتحان کنید:
  `);
  // Try to go to last stage
  if ('lastStage' in ctx.userSession) {
    try {
      var LS = ctx.userSession.lastStage;
      var CC = ctx.userSession.choosenCommand;
      console.log(LS, CC);
      // if (LS && CC) ctx.userSession.commandStatuses[CC].voiceCount--;
      ctx.scene.enter(LS)
    }
    catch (err){
      console.log(err);
      botInitilizer(ctx); 
    }
  }
  else {
    // The session file has been removed so user should be initialized
    botInitilizer(ctx); 
  }
})


function handleLogger() {

  // Create log directory if dont exist
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('./logs');    
    fs.writeFileSync(`./logs/combined.log`, '');
    fs.writeFileSync(`./logs/error.log`, '');
  }

  // Initialize logger (Winston)
  logger = winston.createLogger({
    level: 'info',
    format: combine(
      timestamp(),
      prettyPrint()
    ),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: './logs/combined.log' })
    ]
  });
  
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  // 
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }
}