const download = require('download-file'),
    fs = require('fs');



// receive message from master process
process.on('message', async (message) => {
    var addr = `./voices/${message.userId}/${message.voiceId}/urls.txt`;
    var urls = fs.readFileSync(addr, { encoding: 'utf-8'}).split('\n');
    
    urls.forEach(url => {
        if (url.length < 10) return;

        var downloadOptions = {
            directory: addr.slice(0, addr.lastIndexOf('/')),
            filename: url.slice(url.lastIndexOf('/'))
        }
         
        download(url, downloadOptions, function(err){
            if (err) console.log(err)
            console.log(`${url} Downloaded in ${ addr.slice(0, addr.lastIndexOf('/'))}`)
            urls.splice(urls.indexOf(url), 1);
            if (urls.length == 0) {
                fs.unlink(addr, (err) => {
                    if (err) throw err;
                });
            }
            // console.log('\n', urls);

            // send response to master process
            // process.send({ downloadedFile: url.slice(url.lastIndexOf('/')) });
        });
    });



    
});
  