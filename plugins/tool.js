/*------------------------------------------------------------------------------------------------------------------------------------------------------


Copyright (C) 2023 Loki - Xer.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Jarvis - Loki-Xer 


------------------------------------------------------------------------------------------------------------------------------------------------------*/

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Message } = require("../lib/Base/");  
const { System, sendAlive, setData, getData, isPrivate, config, IronMan, database, removeData, } = require("../lib/");  
const { getUptime, Runtime } = require("./client/"); 

System({
	pattern: "ping",
	fromMe: isPrivate,
	type: "tool",
	alias: ['pong','speed'],
	desc: "To check ping",
	adminAccess: true,
}, async (message) => {
	const start = new Date().getTime();
	const ping = await message.send("*𝆺𝅥 running 𝆺𝅥*");
	const end = new Date().getTime();
	return await ping.edit("*☇ ꜱᴩᷨᴇͦᴇͭᴅ ☁ :* " + (end - start) + " *ᴍꜱ* ");
});

System({
    pattern: "vv",
    fromMe: true,
    type: "tool",
    alias: ['view'],
    desc: "get view ones message"
}, async (message) => {
   if (!message.reply_message.viewones) return await message.reply("_*Reply to a view once*_");
   return await message.client.forwardMessage(message.chat, message.reply_message.message, { readViewOnce: true });
});

System({
   pattern: "uptime",
   fromMe: true,
   type: "tool",
   desc: "get the running time of the bot"
}, async (message) => {
    const uptime = getUptime();
    return await message.reply(uptime);
});

System({
   pattern: "runtime",
   fromMe: true,
   desc: "get the delpoyed running time of the bot",
   type: "tool",
}, async (m) => {
    const { loginData } = await getData(m.user.number);
    const runtime = await Runtime(loginData.message);
    await m.reply(runtime);
});

System({
   pattern: "reboot",
   fromMe: true,
   desc: "to reboot your bot",
   type: "tool",
}, async (message, match, m) => {
    await message.reply('_Rebooting..._')
    require('pm2').restart('index.js');
});

System({
    pattern: 'alive ?(.*)',
    fromMe: isPrivate,
    desc: 'Check if the bot is alive',
    type: 'tool'
}, async (message, match) => {
    const { alive } = await getData(message.user.id);
    const data = alive ? alive.message : config.ALIVE_DATA;
    if (match === "get" && message.sudo.includes(message.sender))
        return await message.send(data);
    if (match && message.sudo.includes(message.sender)) {
        if (await setData(message.user.id, match, "true", "alive"))
            return await message.send('_Alive Message Updated_');
        else
            return await message.send('_Error in updating_');
    }
    return await sendAlive(message, data);
});

System({pattern:"pdf ?(.*)",fromMe:isPrivate,desc:"Converts image to PDF or text to PDF",type:"tool"},(async(e,t)=>{if(t&&!t.startsWith("send")){let i=t,a="./text.pdf",n=new PDFDocument;return n.pipe(fs.createWriteStream(a)),n.font("Helvetica",12).text(i,50,50,{align:"justify"}),n.end(),void setTimeout((async()=>{await e.reply({url:"./text.pdf"},{mimetype:"application/pdf",fileName:"text.pdf"},"document"),fs.unlinkSync(a)}),4e3)}let i,a="./pdf";if(fs.existsSync(a)||fs.mkdirSync(a),"send"===t)i=!0;else{if(i=!1,!e.reply_message.image)return await e.reply("*Reply to an image or give text*\n_Example: `.pdf hello world`_\nTo get pdf of image use `.pdf send`");{let t=await e.reply_message.downloadAndSaveMedia();if(!fs.existsSync(t))return await e.reply("Error: Downloaded file does not exist.");let i,n=0;do{i=path.join(a,`ironman${0===n?"":n}.jpg`),n++}while(fs.existsSync(i));fs.renameSync(t,i),await e.send(`${fs.readdirSync(a).length} images saved successfully_`)}}if(i){let t=new PDFDocument({autoFirstPage:!1}),i=fs.createWriteStream("./image.pdf");t.pipe(i);let n=fs.readdirSync(a).filter((e=>".jpg"===path.extname(e).toLowerCase()));if(0===n.length)return await e.reply("_No images found to convert to PDF._");n.forEach((e=>{let i=path.join(a,e),n=t.openImage(i);t.addPage({size:[n.width,n.height],margin:0}),t.image(i,0,0,{width:n.width,height:n.height})})),t.end(),setTimeout((async()=>{await e.reply({url:"./image.pdf"},{mimetype:"application/pdf",fileName:"image.pdf"},"document"),fs.rmSync(a,{recursive:!0,force:!0}),setTimeout((()=>fs.unlinkSync("./image.pdf")),4e3)}),4e3)}}));

System({
    pattern: 'time ?(.*)',
    fromMe: isPrivate,
    desc: 'Find Time',
    type: 'tool',
}, async (message, match) => {
    if (!match) return await message.reply("*Need a place name to know time*\n_Example: .time japan_");
    var p = match.toLowerCase();
    const res = await fetch(IronMan(`ironman/search/time?loc=${p}`));
    const data = await res.json();
    if (data.error === 'no place') return await message.send("_*No place found*_");
    const { name, state, tz, capital, currCode, currName, phone } = data;
    const now = new Date();
    const format12hrs = { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const format24hrs = { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const time12 = new Intl.DateTimeFormat('en-US', format12hrs).formatToParts(now);
    const time24 = new Intl.DateTimeFormat('en-US', format24hrs).formatToParts(now);
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    let time12WithMs = '';
    time12.forEach(({ type, value }) => {
        if (type === 'dayPeriod') {
            time12WithMs += `:${milliseconds} ${value}`;
        } else {
            time12WithMs += value;
        }
    });
    const time24WithMs = time24.map(({ value }) => value).join('') + `:${milliseconds}`;
    let msg = `*ᴄᴜʀʀᴇɴᴛ ᴛɪᴍᴇ*\n(12-hour format): ${time12WithMs}\n(24-hour format): ${time24WithMs}\n`;
    msg += `*ʟᴏᴄᴀᴛɪᴏɴ:* ${name}\n`;
    if (state) {
        msg += `*ꜱᴛᴀᴛᴇ:* ${state}\n`;
    }
    msg += `*ᴄᴀᴘɪᴛᴀʟ:* ${capital}\n`;
    msg += `*ᴄᴜʀʀᴇɴᴄʏ:* ${currName} (${currCode})\n`;
    msg += `*ᴘʜᴏɴᴇ ᴄᴏᴅᴇ:* +${phone}`;
    await message.reply(msg);
});


System({
        pattern: "quoted", 
        fromMe: true,
        desc: "To get old quoted", 
        type: "tool",
}, async (m) => {
       if(!m.quoted) return m.reply("_reply to a message_");
      const msg = await m.store.loadMessage(m.jid, m.reply_message.id);
      if(!msg) return m.reply("_message not found from store_");
      const message = new Message(m.client, JSON.parse(JSON.stringify(msg)), m.store, m.prefix);
      if(!message.quoted) return m.client.forwardMessage(m.jid, message, { quoted: m.data });
      return m.client.forwardMessage(m.jid, message.reply_message, { quoted: m.data });
});


System({
    pattern: 'calc ?(.*)',
    fromMe: isPrivate,
    desc: 'Sends the result of a mathematical expression',
    type: 'tool',
}, async (message, match, m) => {
    if (!match) return await message.reply("*EXAMPLE* *:* _.calc 2+2_");
    const [a, op, b] = match.trim().match(/(\d+)\s*([-+*\/])\s*(\d+)/).slice(1);
    const result = ((x, y) => op === '/' && y == 0 ? "Error: Division by zero" : eval(`${x}${op}${y}`))(parseFloat(a), parseFloat(b));
    await message.reply(`Q: ${a} ${op} ${b}\n\nResult: *${result}*`);
});



System({
    pattern: "setcmd",
    fromMe: true,
    desc: "set a sticker as a cmd",
    type: "tool",
}, async (message, match) => { 
    if (!message.reply_message || !message.reply_message.i || !message.reply_message.msg || !message.reply_message.msg.fileSha256) 
    return await message.reply('_Reply to an image/video/audio/sticker_'); 
    if (!match) return await message.reply('_Example: setcmd ping_'); 
    const hash = message.reply_message.msg.fileSha256.join("");
    const setcmd = await setData(hash, match, "true", "setCmd");
    if (!setcmd) return await message.reply('_Failed_');
    await message.reply('_Success_');
});

System({
    pattern: 'delcmd ?(.*)',
    fromMe: true,
    desc: 'to delete audio/image/video cmd',
    type: 'tool'
}, async (message, match) => {
    if (!message.reply_message || !message.reply_message.i) 
    return await message.reply('_Reply to an image/video/audio/sticker_');
    let hash = message.reply_message.msg.fileSha256.join("")
    if (!hash) return await message.reply('_Failed_');
    const delcmd = await removeData(hash, "setCmd");
    if (!delcmd) return await message.reply('_Failed_');
    await message.reply('_Success_');
});

System({
    pattern: 'listcmd ?(.*)',
    fromMe: true,
    desc: 'to list all commands',
    type: 'tool'
}, async (message, match) => {
    const result = await database.findAll({ where: { name: "setCmd" } });
    if (!result || result.length === 0) return await message.reply("_*No commands set*_");
    const messages = result.map((entry, index) => `_${index + 1}. ${entry.dataValues.message}_`);
    const formattedList = messages.join('\n');
    return await message.reply("*List Cmd*\n\n" + formattedList);
});

System({
    pattern: 'mention ?(.*)',
    fromMe: true,
    desc: 'mention',
    type: 'tool'
}, async (message, match) => {
   let msg;
   const { mention } = await getData(message.user.id);    
    if (match === 'get' && message.sudo.includes(message.sender)) {
        return await message.send(mention.message);
    } else if (match && message.sudo.includes(message.sender)) {
        if (match === "off") {
            msg = await setData(message.user.id, mention.message, "false", "mention");
        } else if (match === "on") {
            msg = await setData(message.user.id, mention.message, "true", "mention");
        } else {
            msg = await setData(message.user.id, match, "true", "mention");       
        }
        if (msg) {
            return await message.reply('_Mention Updated_');
        } else {
            return await message.reply('_Error in updating__');
        }
    }
    return await message.reply("_You can check the format of mention https://github.com/Loki-Xer/Jarvis-md/wiki_");
});

System({
    pattern: 'autoreaction ?(.*)',
    fromMe: true,
    type: 'tool',
    alias: ['reaction'],
    desc: 'auto reaction'
}, async (message, match) => {
    if (match === "off") {
        await setData(message.user.id, "disactie", "false", "autoreaction");
        await message.reply("_*autoreaction disabled*__");
    } else if (match === "on") {
        await setData(message.user.id, "actie", "true", "autoreaction");
        await message.reply("_*autoreaction enabled*__");
    } else {
        await message.reply("_*->example use on/off*_");
    }
});
