const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys);

let data = {
  publicKey: 'BCRUbTP4zGhkryDDJFD2eo5mv9_UBeSchMhRVywv6i8XpjPSFLlr3vl26gI_BWMDV0ZKsOqVybvXKSTB76Pjn48',
  privateKey: 'lRcPRIxsyliRGgJ8ShLroKirJC6gF8hvp_hvLP6s03E'
}
