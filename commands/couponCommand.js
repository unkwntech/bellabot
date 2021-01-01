const { Command } = require('discord-akairo');

const coupons =
  {
    "318855105514307587" : "No Coupons for this Group ;(", //#general
    "670711621676433448" : "ABC123 :eggplant:" //#foobar
  }

class CouponCommand extends Command {
  constructor() {
    super('coupon', {
      aliases: ['coupon']
    });
  }

  exec(message) {
    return message.reply(coupons[message.channel.id]);
  }
}

module.exports = CouponCommand;
