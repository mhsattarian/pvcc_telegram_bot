
// Reads the .env file and add each line in environment variables
require('dotenv').config();

// TODO: Use persianJs to correct the numbers

const Telegraf = require('telegraf'), // Telegram API wrapper
  Extra = require('telegraf/extra'),
  Markup = require('telegraf/markup'),
  Composer = require('telegraf/composer'),
  Stage = require('telegraf/stage'),
  session = require('telegraf/session'),
  WizardScene = require('telegraf/scenes/wizard'),
  Scene = require('telegraf/scenes/base'),
  LocalSession = require('telegraf-session-local'),
  shell = require('shelljs'),
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
  'کی ساختت؟',
];

/** -------------------- on Using --------------- **/

// [*not using now*] A helper function to clear all messages from this scene (not from user)
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
  (item)=> `${item} (${userSession.commandStatuses[item].voiceCount} از 3)`))
  .oneTime().resize().extra()

// FIRST SCENE : CHOSE YOUR COMMAND
const firstScene = new Scene('choose_command')
  .enter(async (ctx) => {
    // [*not used now*] for storing messages to be cleared using `sceneCleaner`
    const messages = []

    // show a keyboard to user to choose between commands
    messages.push(await ctx.reply('یکی از دستورات را انتخاب کنید:', chooseCommandKeyboard(ctx.userSession)))
    
    // ctx.scene.state.messages = messages
  })
  .on('text', async (ctx)=>{
    // cuase command had become (روشن (0 از 3))
    command = ctx.message.text.split(' ')[0];
    
    // Error if input text not in commands
    if (!commands.includes(command)) 
      ctx.reply('لطفا یکی از دستورات لیست را انتخاب کنید.');
    // Stores the command choosen to be pronounced
    // (fills in first scene and uses in seconds)
    else ctx.session.choosenCommand = command;
    
    // If a command is spoken *less than* 3 times, go to second scene (pronouncing commands)
    if (ctx.userSession.commandStatuses[command].voiceCount < 3)
      ctx.scene.enter('get_voices');
    // otherwise Error to choose another command
    else ctx.reply('یکی دیگر از دستورات را انتخاب کنید:')
  })
  // if user tryed to send a recoreded voice in this scene Error
  .on('voice', (ctx)=>ctx.reply("لطفا اول یک دستور را انتخاب کنید"))
  // What to happen when leaving this scene (including switching between scenes)
  .leave(async (ctx)=> {
    // ctx.reply("hey",
    //   {ReplyKeyboardRemove: { remove_keyboard : true }},
    // );
  });


// SECOND SCENE : PRONOUNCE THE COMMAND
const secondScene = new Scene('get_voices')
  .enter((ctx) => {
    // [*not used now*] for storing messages to be cleared using `sceneCleaner`
    const messages = []
    
    // If the command is pronounced 3 times go back to scene one (choosing commands)
    var voiceCount = ++ctx.userSession.commandStatuses[ctx.session.choosenCommand].voiceCount;
    if (voiceCount > 3) {
      // Cause we added once on line above
      --ctx.userSession.commandStatuses[ctx.session.choosenCommand].voiceCount;
      ctx.scene.enter('choose_command')
    }
    else{
      // Ask user to pronounce the command
      ctx.reply(`
      مرتبه ${voiceCount == 1 ? '1️⃣' : voiceCount == 2 ? '2️⃣' : '3️⃣'}
      صدای خود را ضبط کرده و ارسال کنید:
      `)
    }

    // We want to store the urls to a file called urls.txt 
    // on a directory named based on user ids
    userId = getSessionKey(ctx).replace(':', '-');
    addr = `./voices/${userId}/${commands.indexOf(ctx.session.choosenCommand)}`;
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
    // Thank the user
    ctx.reply("👌");
    
    // Take voice file url to be download
    userId = getSessionKey(ctx).replace(':', '-');
    fileAddr = `./voices/${userId}/${commands.indexOf(ctx.session.choosenCommand)}/urls.txt`;
    url = bot.telegram.getFileLink(ctx.message.voice.file_id).then(url=>{
      // ctx.userSession.commandStatuses[ctx.session.choosenCommand].urls.push(url);
      console.log("Writing in file: ", fileAddr);
      console.log(url);
      fs.appendFile(fileAddr, '\n' + url, function (err) {
        if (err) throw err;
        console.log("Write succesfully");
      }); 
    });
    
    // ReEnter in current scene to ask for pronounciation again if needed
    ctx.scene.reenter();
  })
  // if user tryed to type something in this scene Error
  .on('text', (ctx)=>ctx.reply("لطفا دستور مورد نظر را با صدای خود ضبط کرده و ارسال کنید."))
  // What to happen when leaving this scene (including switching between scenes)
  .leave(async (ctx) => {
  })


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

// TODO : chack if user has aleardy done some commands, dont clear it's history

// 1. Initializations and greetings
bot.start((ctx) => {
  // choose active user's session from the session object
  var userSession = ctx.userSession;
  // Number of the command to get its voice
  userSession.commandCounter = 0;
  // Status of each command (whether its spoken and how many times)
  userSession.commandStatuses = {}
  // Creating the commandStatuses object using commands array
  commands.map(command=>{
    userSession.commandStatuses[command] = {
      done: false,
      voiceCount : 0,
      urls : []
    }
  })
  // Save user's username , name
  userSession.userName = ctx.from.username;
  userSession.fullName = ctx.from.first_name + ctx.from.last_name;
  // Add a random number to chack the userSession working (TODO: remove this)
  userSession.random = Math.random();

  // Greetings
  ctx.reply(`
    با سلام ${userSession.userName || userSession.fullName}.
    ممنونیم که وقت خودتون رو در اختیار ما گذاشته و به جمع‌آوری دیتاستی از دستورات فارسی کمک می‌کنید 🙏. در ادامه پس از انتخاب گزینه شروع، در هر مرتبه یک دستور به شما نمایش داده می‌شود و از شما خواسته می‌شود که آن را سه بار ضبط کرده و ارسال کنید.
    برای شروع گزینه زیر را نتخاب کنید:
    `,
    Markup.inlineKeyboard([
      Markup.callbackButton('شروع', 'start_confirmed') // Adds a glassy button to start the process
    ]).extra());
  }
);

// 2. When the شروع glassy button is pressed
bot.action('start_confirmed', (ctx, next) => {
  ctx.scene.enter('choose_command')
});

// When the شروع glassy button is pressed
bot.command('session', ctx => {
  ctx.reply('session: \n' + JSON.stringify(ctx.session));
  ctx.reply('UserSession: \n' + JSON.stringify(ctx.userSession));
});

// TODO: make cancel button work

// 2. When the شروع glassy button is pressed
bot.hears('[لغو]', ctx => {
  // Remove the keyboard if exist!
  ctx.reply(undefined,
    Extra.markup(Markup.removeKeyboard()),
  );
});
