const ffmpeg = require('fluent-ffmpeg'),
        fs = require('fs');


// receive message from master process
process.on('message', async (message) => {
    
    dir = message.dir;
    var files = fs.readdirSync(dir);

    // Cause wav files may exist
    wavFileName = await files.filter(file => nameExt(file)[1] == 'wav').map(file => nameExt(file)[0]);
    filesToConvert = files.filter(file => !wavFileName.includes(nameExt(file)[0]))
    
    
    filesToConvert.forEach(file => {
        name = nameExt(file)[0];
        
        ffmpeg(`${dir}/${file}`).save(`${dir}/${name}.wav`).on('error', function(err, stdout, stderr) {
            console.log('Cannot process audio: ' + err.message);
          });;
    });
});


function nameExt (fileName) {
    var temp = fileName.split('.');
    var name = temp.slice(0, -1).join('-');
    var extension = temp.slice(-1)[0];

    return [name, extension]
}