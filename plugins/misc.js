/*------------------------------------------------------------------------------------------------------------------------------------------------------


Copyright (C) 2023 Loki - Xer.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Jarvis - Loki-Xer 


------------------------------------------------------------------------------------------------------------------------------------------------------*/

const {
    isUrl,
    System,
    config,
    getJson,
    postJson,
    isPrivate,
    extractUrlsFromText 
} = require("../lib/");
  
  
  System({
      pattern: "wm",
      fromMe: isPrivate,
      desc: "wame generator",
      type: "misc",
  },async (message, match) => {
      if (!message.quoted) return message.reply("_*Reply to a user*_");
      let sender = 'https://wa.me/' + (message.reply_message.sender || message.mention[0] || message.text).split('@')[0];
      await message.reply(sender);
  });

  System({
  pattern: 'ss ?(.*)',
  fromMe: true,
  desc: 'Takes a screenshot of a website',
  type: 'misc',
}, async (message, match, m) => {
  let url = (await extractUrlsFromText(match || message.reply_message.text))[0];
  if (!url) return await message.reply(`*Please provide a URL*`);
  if (!isUrl(url)) return await message.reply(`*Please provide a valid URL*`);
  await message.sendFromUrl(api + "tools/ssweb?q=" + url, { caption: `*Screenshot of ${url}*` });
});

  System({
      pattern: "save", 
      fromMe: true,
      desc: "used to save messages", 
      type: "misc",
  }, async (message) => {
     if (!message.quoted) return;
     await message.client.forwardMessage(message.user.jid, message.reply_message.message);
  });


  System({
      pattern: 'whois ?(.*)',
      fromMe: isPrivate,
      desc: 'to find how is',
      type: "info",
  }, async (message, match) => {
     let status;
     let user = message.quoted ? message.reply_message.sender : match.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
     if (!user) return message.reply('_Reply to someone/mention_\n*Example:* . whois @user');
     try { status = await message.client.fetchStatus(user); } catch { status = 'private'; }
      let pp = await message.getPP(user);
      const date = new Date(status.setAt);
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }; 
      let wm = 'https://wa.me/' + user.split('@')[0];
      const setAt = date.toLocaleString('en-US', options);
      const NaMe = await message.store.getName(user);
      await message.send({ url: pp }, { caption: `*Name :* ${NaMe}\n*About :* ${status.status}\n*About Set Date :* ${setAt}\n*whatsapp :* ${wm}`, quoted: message }, 'image');
  });
  
  System({
      pattern: 'tts ?(.*)',
      fromMe: isPrivate,
      desc: 'It converts text to sound.',
      type: 'converter'
  }, async (message, match) => {
      if (!(match || message.reply_message.text)) return await message.reply('_Need Text!_\n_Example: tts Hello_\n_tts Hello {en}_');
      let LANG = config.LANG.toLowerCase();
      const lang = match.match("\\{([a-z]+)\\}");
      if (lang) {
        match = match.replace(lang[0], '');
        LANG = lang[1];
        if (message.reply_message.text) match = message.reply_message.text;
      }
      const response = await fetch(api + 'tools/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: match, lang: LANG }) });
      if (response.ok) {
          const data = await response.arrayBuffer();
          await message.reply(Buffer.from(data), { mimetype: 'audio/ogg; codecs=opus', ptt: true }, "audio");
      } else {
          await message.reply("Error:", response.status, response.statusText);
      }
  });
  
  
  System({
      on: 'text',
      fromMe: isPrivate,
      dontAddCommandList: true,
  },async (message) => {
      if (message.isBot || !message.reply_message.fromMe || !message.reply_message.text) return;
      if (!message.body.includes('@') || !message.body.includes('‣')) return;
      if (message.body.includes("1")) {
          const text = message.body.split(" ");
          const { result: tempmail } = await postJson(api + "tools/tempmail", { q: text[2] });
      if (tempmail.length === 0) return message.reply("_*Mail box is empty*_");
          const formattedResponse = `\n  *Temp Mail ✉️*\n\n${tempmail.map((mail, index) => `\n  • *From :* ${mail.from}\n  • *Subject :* ${mail.subject}\n  • *Date :* ${mail.date}\n  • *Id :* ${mail.id}\n  • *Mail Number:* ${index + 1}`).join("\n\n")}`;
          await message.send(formattedResponse);
      } else if (message.body.includes("2")) {
         const { result: data } = await getJson(api + "tools/tempmail");
         const user = await message.store.getName(message.sender);
         const { result: tempmail } = await postJson(api + "tools/tempmail", { q: data });
         await message.send(`*_${data}_*\n\n*Dear user, this is your temp mail*\n\n*User: ${user}*\n*Mail received: ${tempmail.length}*\n\n\`\`\`1 ‣\`\`\` *Check mail*\n\`\`\`2 ‣\`\`\` *Next mail*\n\n*_Send a Number as reply_*`);
      }
  });
