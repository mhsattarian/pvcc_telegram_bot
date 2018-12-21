
const fs = require('fs'),
    archiver = require('archiver'),
    rimraf = require('rimraf');

// Last time the zip is created is stored at updateTime.txt
// Check for updateTime.txt
if (!fs.existsSync('./archived/updateTime.txt')) {
  fs.mkdirSync('./archived');    
  fs.mkdirSync('./archived/voices');    
  // If not existing, create with time of Dec 21th 2018 (the day this coide is written!)
  fs.writeFileSync(`./archived/updateTime.txt`, '1545341365468');
}

process.on('message', async (message) => {
  if (message.force) {
    // Write an old time to updateTime so make it zip again
    fs.writeFileSync(`./archived/updateTime.txt`, '1545341365468');
  }

  // Then is the last time the zip file created. read from updateTime.txt
  then = parseInt(fs.readFileSync('./archived/updateTime.txt', { encoding: 'utf-8'}));
  var now = new Date();
  var hourseSpent = (now - then) / (1000 * 60 * 60)
  if (hourseSpent < 6) {
    console.log("Not a lot of time spent");
    return process.send({status: 'ok'});
  }
  else {
    console.log("Zipping again");

    // FIXME: BUG. remove voices folder before donint anything
    rimraf(`./voices/${getSessionKey(ctx).replace(':', '-')}`, function () {
      
      // Directory to store voice files
    const dstDirectory = './archived/voices/';
    

    // Called to create Voice Directories if not exist
    function creatVoiceDirectories (commands) {
      commands.forEach(command => {
        if (!fs.existsSync(dstDirectory + command)) {
          fs.mkdirSync(dstDirectory + command);
        }
      });
    }

    // Copy all voices from each commands to it's directory
    addr = './voices'
    // *Users*
    var users = fs.readdirSync(addr);
    users.forEach(user => {
      // Create user directory address
      var _addr = addr + '/' + user;
      // Check if user is a directory
      if (fs.lstatSync(_addr).isFile()) return;
      // *Commands*
      commands = fs.readdirSync(_addr);
      // Create command directories on ./archived folder if not exist
      creatVoiceDirectories(commands);
      commands.forEach(command => {
        // Create command directory address
        var __addr = _addr + '/' + command;
        // *Voice files*
        voiceFiles = fs.readdirSync(__addr);
        // Select only .wav files
        wavvoiceFiles = voiceFiles.filter(file => nameExt(file)[1] == 'wav');
        wavvoiceFiles.forEach(voiceFile => {
          // Create voicefile address
          var ___addr = __addr + '/' + voiceFile;
          fs.copyFileSync(___addr, dstDirectory + command + '/' + voiceFile);
        });
      });
    });
    
    // create a file to stream archive data to.
    var output = fs.createWriteStream(__dirname + '/archived/voices.zip');
    var archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });
    
    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    
    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function() {
      console.log('Data has been drained');
    });
    
    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        // log warning
        console.log("Warning!");
        
      } else {
        // throw error
        throw err;
      }
    });
    
    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      throw err;
    });
    
    // pipe archive data to the file
    archive.pipe(output);
    

    // append a file
    // archive.file('file1.txt', { name: 'file4.txt' });



    // append files from a sub-directory and naming it `new-subdir` within the archive
    archive.directory(dstDirectory, 'Voices');
    
    // append files from a sub-directory, putting its contents at the root of archive
    // archive.directory('subdir/', false);
    
    // append files from a glob pattern
    // archive.glob('subdir/*.txt');
    
    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();

    fs.writeFileSync(`./archived/updateTime.txt`, Date.now());
    process.send({status: 'ok'});

    function nameExt (fileName) {
      var temp = fileName.split('.');
      var name = temp.slice(0, -1).join('-');
      var extension = temp.slice(-1)[0];

      return [name, extension]
    }



    }); 
  }
});