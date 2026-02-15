const selfsigned = require('selfsigned');

const attrs = [{ name: 'commonName', value: 'localhost' }];

selfsigned.generate(attrs, { days: 365 }, function (err, pems) {
    if (err) {
        throw err;
    }

    require('fs').writeFileSync('key.pem', pems.private);
    require('fs').writeFileSync('cert.pem', pems.cert);

    console.log('Self-signed certificates generated: key.pem and cert.pem');
});
