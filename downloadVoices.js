const download = require('download-file'),
    fs = require('fs'),
    { fork } = require('child_process');



// receive message from master process
process.on('message', async (message) => {
    var addr = `./voices/${message.userId}/${message.voiceId}`;
    if (!fs.existsSync(addr + '/urls.txt')) {
        return
    }
    var urls = fs.readFileSync(addr + '/urls.txt', { encoding: 'utf-8'}).split('\n');
    
    urls.forEach(url => {
        if (url.length < 10) return;

        var downloadOptions = {
            directory: addr,
            filename: url.slice(url.lastIndexOf('/'))
        }
         
        download(url, downloadOptions, function(err){
            if (err) console.log(err)
            console.log(`${url} Downloaded in ${addr}`)
            urls.splice(urls.indexOf(url), 1);
            
            if (urls.length <= 1) {
                fs.unlink(addr + '/urls.txt', (err) => {
                    if (err) throw err;
                });

                const process = fork('./convertVoiceFiles.js');
                process.send({ dir: addr});
            }
            
            // send response to master process
            // process.send({ downloadedFile: url.slice(url.lastIndexOf('/')) });
        });
    });
});
  