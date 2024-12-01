/*------------------------------------------------------------------------------------------------------------------------------------------------------


Copyright (C) 2023 Loki - Xer.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Jarvis - Loki-Xer 


------------------------------------------------------------------------------------------------------------------------------------------------------*/


const {
    Vote,
    isUrl,
    sleep,
    System,
    config,
    getData,
    setData,
    isPrivate,
    warnMessage,
    extractUrlsFromText
} = require("../lib/");
const { parsedJid, isAdmin, isBotAdmins, getAllGroups } = require("./client/");

System({
    pattern: 'add ?(.*)',
    type: 'group',
    fromMe: true,
    onlyGroup: true,
    desc: "add a person to group"
}, async (message, match) => {
    match = message.reply_message?.sender || match;
    let isadmin = await isAdmin(message, message.user.jid);
    if (!isadmin) return await message.reply("_I'm not admin_");
    if (!match) return await message.reply("_Reply to user or need number_\n*Example:* .add 919876543210_");
    match = match.replaceAll(' ', '');
    if (match) {
        let users = match.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        let info = await message.client.onWhatsApp(users);
        let ex = info.map((jid) => jid.jid);
        if (!ex.includes(users)) return await message.reply('h');
        const su = await message.client.groupParticipantsUpdate(message.jid, [users], "add");
        if (su[0].status == 403) {
            await message.reply("_Couldn't add. Invite sent!_");
            return await message.sendGroupInviteMessage(users);
        } else if (su[0].status == 408) {
            await message.send(`Couldn't add @${users.split("@")[0]} because they left the group recently. Group invitation sent!`, {
                mentions: [users]
            });
            const code = await message.client.groupInviteCode(message.jid);
            return await message.client.sendMessage(users, { text: `https://chat.whatsapp.com/${code}` });
        } else if (su[0].status == 401) {
            return await message.send(`Couldn't add @${users.split("@")[0]} because they blocked the bot number.`, {
                mentions: [users]
            });
        } else if (su[0].status == 200) {
            return await message.send(`@${users.split("@")[0]}, Added to the group.`, {
                mentions: [users]
            });
        } else if (su[0].status == 409) {
            return await message.send(`@${users.split("@")[0]}, Already in the group.`, {
                mentions: [users]
            });
        } else {
            return await message.reply(JSON.stringify(su));
        }
    }
});


System({
    pattern: "kick$",
    fromMe: true,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "Kicks a person from the group"
}, async (message, match) => {
    match = message.mention?.jid?.[0] || message.reply_message?.sender || match;
    if (!match) return await message.reply("_Reply to someone/mention_\n*Example:* .kick @user");    
    if (!await isAdmin(message, message.user.jid)) return await message.send("_I'm not an admin_");
    if (match === "all") {
        let { participants } = await message.client.groupMetadata(message.jid);
        participants = participants.filter(p => p.id !== message.user.jid);       
        await message.reply("_To stop this process, use the restart command_");
        for (let key of participants) {
            const jid = parsedJid(key.id);
            await message.client.groupParticipantsUpdate(message.jid, jid, "remove");
	    if(config.KICK_BLOCK) await message.client.updateBlockStatus(jid[0], "block");
            await message.send(`_@${jid[0].split("@")[0]} kicked successfully_`, { mentions: jid });
        }
    } else {
        const jid = parsedJid(match);
        await message.client.groupParticipantsUpdate(message.jid, jid, "remove");
	if(config.KICK_BLOCK) await message.client.updateBlockStatus(jid[0], "block");
        await message.send(`_@${jid[0].split("@")[0]} kicked successfully_`, { mentions: jid, });
    }
});

System({
	pattern: "promote$",
	fromMe: true,
	type: "group",
	onlyGroup: true,
	adminAccess: true,
	desc: "promote a member",
}, async (message, match) => {
	match = message.mention.jid?.[0] || message.reply_message.sender || match
	if (!match) return await message.reply("_Reply to someone/mention_\n*Example:* . promote @user");
	let isadmin = await isAdmin(message, message.user.jid);
	if (!isadmin) return await message.reply("_I'm not admin_");
	let jid = parsedJid(match);
	await await message.client.groupParticipantsUpdate(message.jid, jid, "promote");
	return await message.send(`_@${jid[0].split("@")[0]} promoted as admin successfully_`, { mentions: jid, });
});


System({
	pattern: "demote$",
	fromMe: true,
	type: "group",
	onlyGroup: true,
	adminAccess: true,
	desc: "demote a member",
}, async (message, match) => {
	match = message.mention.jid?.[0] || message.reply_message.sender || match
	if (!match) return await message.reply("_Reply to someone/mention_\n*Example:* . demote @user");
	let isadmin = await isAdmin(message, message.user.jid);
	if (!isadmin) return await message.reply("_I'm not admin_");
	let jid = parsedJid(match);
	await await message.client.groupParticipantsUpdate(message.jid, jid, "demote");
	return await message.send(`_@${jid[0].split("@")[0]} demoted from admin successfully_`, { mentions: jid });
});


System({
    pattern: 'invite ?(.*)',
    fromMe: true,
    type: 'group',
    onlyGroup: true,
    adminAccess: true,
    desc: "Provides the group's invitation link."
}, async (message) => {
    let isadmin = await isAdmin(message, message.user.jid);
    if (!isadmin) return await message.reply("_I'm not admin_");
    const data = await message.client.groupInviteCode(message.jid);
    return await message.reply(`https://chat.whatsapp.com/${data}`);
});


System({
	pattern: "mute",
	fromMe: true,
	type: "group",
	onlyGroup: true,
	adminAccess: true,
	desc: "nute group",
}, async (message) => {
	let isadmin = await isAdmin(message, message.user.jid);
	if (!isadmin) return await message.reply("_I'm not admin_");
	const mute = await message.reply("_Muting Group_");
	await sleep(500);
	await message.client.groupSettingUpdate(message.jid, "announcement");
	return await mute.edit("_Group Muted successfully_");
});

System({
	pattern: "unmute",
	fromMe: true,
	type: "group",
	onlyGroup: true,
	adminAccess: true,
	desc: "unmute group"
}, async (message) => {
	let isadmin = await isAdmin(message, message.user.jid);
	if (!isadmin) return await message.reply("_I'm not admin_");
	const mute = await message.reply("_Unmuting Group_");
	await sleep(500);
	await message.client.groupSettingUpdate(message.jid, "not_announcement");
	return await mute.edit("_Group Unmuted successfully_");
});

System({
    pattern: "tag",
    fromMe: true,
    type: "group",
    adminAccess: true,
    desc: "mention all users in the group"
}, async (message, match) => {
    if (!message.isGroup) return await message.reply(`@${message.sender.split("@")[0]}`, { mentions: [message.sender] });   
    const { participants } = await message.client.groupMetadata(message.from).catch(e => {});
    let admins = await participants.filter(v => v.admin !== null).map(v => v.id);
    let msg = "";
    if (match === "all" || match === "everyone") {
        for (let i = 0; i < participants.length; i++) {
            msg += `${i + 1}. @${participants[i].id.split('@')[0]}\n`;
        }
        await message.send(msg, { mentions: participants.map(a => a.id) });
    } 
    else if (match === "admin" || match === "admins") {
        for (let i = 0; i < admins.length; i++) {
            msg += `${i + 1}. @${admins[i].split('@')[0]}\n`;
        }
        return await message.send(msg, { mentions: participants.map(a => a.id) });
    } 
    else if (match === "me" || match === "mee") {
        await message.send(`@${message.sender.split("@")[0]}`, { mentions: [message.sender] });
    } 
    else if (match || message.reply_message.text) {
        match = match || message.reply_message.text;
        if (!match) return await message.reply('*Example :* \n_*tag all*_\n_*tag admin*_\n_*tag text*_\n_*Reply to a message*_');
        await message.send(match, { mentions: participants.map(a => a.id) });
    } 
    else if (message.reply_message.i) {
        return await message.client.forwardMessage(message.jid, message.reply_message.message, { contextInfo: { mentionedJid: participants.map(a => a.id) } });
    } 
    else {
        return await message.reply("*Example :* \n_*tag all*_\n_*tag admin*_\n_*tag me*_\n_*tag text*_\n_*Reply to a message to tag that message*_");
    }
});

System({
    pattern: "gpp$",
    fromMe: true,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "Set full-screen profile picture",
}, async (message, match) => {
    let isadmin = await isAdmin(message, message.user.jid);
    if (!isadmin) return await message.reply("_I'm not an admin_");
    if(match && match === "remove") {
        await message.client.removeProfilePicture(message.jid);
        return await message.reply("_Group Profile Picture Removed_");
    }
    if (!message.reply_message?.image) return await message.reply("_Reply to a photo_");
    const media = await message.reply_message.download();
    await message.client.updateProfile(media, message.jid);
    return await message.send("_Group Profile Picture Updated_");
});

System({
    pattern: 'revoke ?(.*)',
    fromMe: true,
    type: 'group',
    onlyGroup: true,
    adminAccess: true,
    desc: "Revoke Group invite link.",
}, async (message) => {
    let isadmin = await isAdmin(message, message.user.jid);
    if (!isadmin) return await message.reply("_I'm not admin_");
    await message.client.groupRevokeInvite(message.jid)
    await message.send('_Revoked_');
});

System({
    pattern: 'join ?(.*)',
    fromMe: true,
    desc: "to join a group",
    type: 'group'
}, async (message, match) => {
   match = (await extractUrlsFromText(match || message.reply_message.text))[0];
   if(!match) return await message.reply('_Enter a valid group link!_');
   if(!isUrl(match)) return await message.send('_Enter a valid group link!_');
   if(!match) return await message.send('_Enter a valid group link!_');
   if (match && match.includes('chat.whatsapp.com')) {
       const groupCode = match.split('https://chat.whatsapp.com/')[1];
       const joinResult = await message.client.groupAcceptInvite(groupCode);
       if (joinResult) return await message.reply('_Joined!_'); 
           await message.reply('_Invalid Group Link!_'); 
   } else {
       await message.reply('_Invalid Group Link!_'); 
   }
});

System({
    pattern: 'left ?(.*)',
    fromMe: true,
    type: 'group',
    onlyGroup: true,
    desc: 'Left from group'
}, async (message) => {
    await message.client.groupLeave(message.jid);
});

System({
    pattern: 'lock ?(.*)',
    fromMe: true,
    type: 'group',
    onlyGroup: true,
    adminAccess: true,
    desc: "only allow admins to modify the group's settings",
}, async (message, match) => {
    let isadmin = await isAdmin(message, message.user.jid);
    if (!isadmin) return await message.reply("_I'm not admin_");
    const meta = await message.client.groupMetadata(message.chat)
    if (meta.restrict) return await message.send("_Already only admin can modify group settings_")
    await message.client.groupSettingUpdate(message.jid, 'locked')
    return await message.send("*Only admin can modify group settings*")
});

System({
    pattern: 'unlock ?(.*)',
    fromMe: true,
    type: 'group',	
    onlyGroup: true,
    desc: "allow everyone to modify the group's settings -- like display picture etc.",
}, async (message, match) => {
    let isadmin = await isAdmin(message, message.user.jid);
    if (!isadmin) return await message.reply("_bot not admin_");
    const meta = await message.client.groupMetadata(message.jid);
    if (!meta.restrict) return await message.send("_Already everyone can modify group settings_")
    await messages.client.groupSettingUpdate(message.jid, 'unlocked')
    return await message.send("*Everyone can modify group settings*")
});


System({
	pattern: 'gname ?(.*)',
	fromMe: true,
	type: 'group',
	onlyGroup: true,
	adminAccess: true,
	desc: "To change the group's subject",
}, async (message, match, m, client) => {
	match = match || message.reply_message.text
	if (!match) return await message.reply('*Need Subject!*\n*Example: gname New Subject!*.')
	const meta = await message.client.groupMetadata(message.chat);
	if (!meta.restrict) {
		await client.groupUpdateSubject(message.chat, match)
		return await message.send("*Subject updated*")
	}
	const isbotAdmin = await isBotAdmins(message);
	if (!isbotAdmin) return await message.reply("I'm not an admin")
	await client.groupUpdateSubject(message.chat, match)
	return await message.send("*Subject updated*")
});

System({
    pattern: 'gdesc ?(.*)',
    fromMe: true,
    type: 'group',
    onlyGroup: true,
    adminAccess: true,
    desc: "To change the group's description",
}, async (message, match, client) => {
    match = match || message.reply_message.text
    if (!match) return await message.reply('*Need Description!*\n*Example: gdesc New Description!*.')
    const meta = await message.client.groupMetadata(message.jid);
    if (!meta.restrict) {
      await message.client.groupUpdateDescription(message.jid, match)
      return await message.send("_*Description updated*_")
    }
    const isbotAdmin = await isBotAdmins(message);
    if (!isbotAdmin) return await message.send("_I'm not an admin_")
    await message.client.groupUpdateDescription(message.jid, match)
    return await message.send("_*Description updated*_")
})

System({
    pattern: 'gjid ?(.*)',
    fromMe: true,
    type: 'group',
    desc: "To get group jid"
}, async (message, match) => {
    match = match || message.reply_message.text;
    if (!message.isGroup || match === "info") return message.send(`*All Group Jid*\n${await getAllGroups(message.client)}`);    
    if (match === "participants jid") {
        const { participants, subject } = await message.client.groupMetadata(message.jid);
        const participantJids = participants.map(u => u.id).join("\n\n")
        return message.reply(`*Group Participants Jid*\n\n*Group Name:* ${subject}\n*All Participants Jid*\n\n${participantJids}`);
    }
    await message.client.sendButton(message.jid, { buttons: [{ name: "quick_reply", display_text: "All Group Info", id: "gjid info" }, { name: "quick_reply", display_text: "Group Participants Jid", id: "gjid participants jid" }], body: "", footer: "*JARVIS-MD*", title: "*Group Jid Info 🎏*\n" });
});


System({
    pattern: 'ginfo ?(.*)',
    fromMe: true,
    type: 'group',
    desc: 'Shows group invite info',
}, async (message, match) => {
    match = (await extractUrlsFromText(match || message.reply_message.text))[0];
    if(!match && message.isGroup) match = `https://chat.whatsapp.com/${await message.client.groupInviteCode(message.jid)}`;
    if (!match) return await message.reply('*Need Group Link*\n_Example : ginfo group link_')
    const [link, invite] = match.match(/chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i) || []
    if (!invite) return await message.reply('*Invalid invite link*')
    try { const response = await message.client.groupGetInviteInfo(invite)
    await message.send("id: " + response.id + "\nsubject: " + response.subject + "\nowner: " + `${response.owner ? response.owner.split('@')[0] : 'unknown'}` + "\nsize: " + response.size + "\nrestrict: " + response.restrict + "\nannounce: " + response.announce + "\ncreation: " + require('moment-timezone')(response.creation * 1000).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm:ss') + "\ndesc" + response.desc)
    } catch (error) {
    await message.reply('*Invalid invite link*') }
})

System({
    pattern: "create",
    fromMe: true,
    desc: "to create a group",
    type: "group",
}, async (m, match) => {
    let gName = match || m.pushName;
    if (!m.reply_message.sender) return m.reply("*To create group with someone*\n_Example : . create @user/reply_");
    const group = await m.client.groupCreate(gName, [m.reply_message.sender, m.sender]);
    await m.send("_Group successfully created_ ");
});

System({
	pattern: "warn",
	fromMe: true,
	type: "group",
	onlyGroup: true,
	adminAccess: true,
	desc: "Warn a user",
}, async (message, match) => {
        let user = message.mention.jid?.[0] || message.reply_message.sender;
	if (!user) return message.reply("_Reply to someone/mention_\n*Example:* . warn @user\n_To reset warn_\n*Example:* .warn reset");
	const jid = parsedJid(user);
	let isBotAdmin = await isAdmin(message, message.user.jid);
	if(!isBotAdmin) return await message.reply("_I'm not admin_");
	let userIsAdmin = await isAdmin(message, user);
	if(userIsAdmin) return await message.send(`_user is admin @${jid[0].split("@")[0]}_`, { mentions: jid });
	const name = await message.store.getName(user);
       await warnMessage(message, match, user, name);
});

System({
    pattern: "inactive", 
    fromMe: isPrivate,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "To check inactive users in group", 
}, async (message, match) => {
    const data = await message.store.groupStatus(message.chat, "disactive");
    let inactiveUsers = Array.isArray(data) ? `*Total Inactive Users ${data.length}*\n\n` + data.map((item, index) => `*${index + 1}. User: @${item.jid.split("@")[0]}*\n*Role: ${item.role}*\n\n`).join("") : "_*No inactive users found.*_";
    return await message.send(inactiveUsers.trim(), { mentions: data.map(a => a.jid) || [] });
});


System({
    pattern: "active", 
    fromMe: isPrivate,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "To check active users in group", 
}, async (message, match) => {
    const data = await message.store.groupStatus(message.jid, "active");
    let activeUsers = Array.isArray(data) ? `*Total Active Users ${data.length}*\n\n` + data.map(item => `*Name: ${item.pushName}*\n*Number: ${item.jid.split("@")[0]}*\n*Total Messages: ${item.messageCount}*\n\n`).join("") : "_*No active users found.*_";
    return await message.client.sendMessage(message.jid, { text: activeUsers.trim() });
});

System({
    pattern: "vote",
    fromMe: isPrivate,
    type: "group",
    onlyGroup: true,
    adminAccess: true,
    desc: "to send a vote message"
}, async (message, match) => {
    let formattedResult;
    if (!match) return message.reply("*Hey, where's the vote text?* Or you can use: _'vote result'_ or _'vote get'_ to get the result of a vote, _'vote delete'_ to delete a vote message, or _'vote What's your favorite color?;😂|Blue,😟|Red'_ to create a vote.");
    if (match === "delete") {
    if (!message.quoted) return message.reply("_*Reply to a vote message*_");
    const deleted = await Vote(message, {}, "delete");
    if (!deleted) return message.reply("*Vote message not found*");
      await message.send({ key: message.reply_message.data.key }, {}, 'delete');
      await message.reply("*Vote message successfully deleted*");
    } else if (match === "result" || match === "get") {
      if (!message.quoted) return message.reply("_*Reply to a vote message*_");
      const data = await Vote(message, {}, "result");
      if (!data) return message.reply("*It's not a vote message or it's patched*");
      if (data.result.length === 0) {
      formattedResult = ['_*No votes yet.*_'];
    } else {
      formattedResult = data.result.map(({ Emoji, Votes, Percentage, VotesBy, VotedOn }) => {
      const votersList = VotesBy.map(voter => `@${voter.split("@")[0]}`).join('\n');
      return `*Emoji*: ${Emoji}\n*Voted On*: ${VotedOn}\n*Total Votes:* ${Votes}\n*Percentage:* ${Percentage}\n*Votes By:* ${votersList}\n\n`;
      });
    } if (data.result.length > 0) formattedResult.unshift('*Vote Result ✨*\n\n');
      await message.send(formattedResult.join('').trim(), { mentions: data.votersJid })
    } else {
      const regex = /^([^;]*;[^;]*\|[^;]*,[^;]*\|[^;]*)$/;
      if (!regex.test(match)) return message.reply("*The text is not in the correct format. Use* ```What's your favorite color?;😂|Blue,😟|Red```");
      await Vote(message, { text: match }, "vote");
    }
});

System({
    pattern: "automute ?(.*)",
    fromMe: true,
    onlyGroup: true,
    type: 'manage',
    adminAccess: true,
    desc: "auto mute groups"
}, async (message, match) => {
   match = match?.toUpperCase();
   const { autoMute } = await getData(message.chat);
   const action = autoMute && autoMute.message ? autoMute.message : 'null';
   if (!match) return await message.send("*Wrong format!*\n *.automute 10:00 PM*\n *.automute 06:00 AM*\n *.automute off*");
   if (match.toLowerCase() === "off") {
      await setData(message.jid, action, "false", "autoMute");
      return await message.send("*Automute has been disabled in this group ❗*");       
   } else if (match.toLowerCase() === "on") {
      await setData(message.jid, action, "true", "autoMute");
      return await message.send("*Automute has been enabled in this group ✅*");       
   };
   var admin = await isAdmin(message, message.user.jid);
   if (!admin) return await message.send("_I'm not an admin_");
   await setData(message.jid, match, "true", "autoMute");
   await message.send(`*_Group will auto mute at ${match}, rebooting.._*`)
   require('pm2').restart('index.js');
});

System({
    pattern: "autounmute ?(.*)",
    fromMe: true,
    type: 'manage',
    onlyGroup: true,
    adminAccess: true,
    desc: "auto mute groups",
}, async (message, match) => {
   match = match?.toUpperCase();
   const { autoUnmute } = await getData(message.chat);
   const action = autoUnmute && autoUnmute.message ? autoUnmute.message : 'null';
   if (!match) return await message.send("*Wrong format!*\n *.autounmute 10:00 PM*\n *.autounmute 06:00 AM*\n *.autounmute off*");
   if (match.toLowerCase() === "off") {
      await setData(message.jid, action, "false", "autoUnmute");
      return await message.send("*Autounmute has been disabled in this group ❗*");       
   } else if (match.toLowerCase() === "on") {
      await setData(message.jid, action, "true", "autoUnmute");
      return await message.send("*Autounmute has been enabled in this group ✅*");       
   };
   var admin = await isAdmin(message, message.user.jid);
   if (!admin) return await message.send("_I'm not an admin_");
   await setData(message.jid, match, "true", "autoUnmute");
   await message.send(`*_Group will auto unmute at ${match}, rebooting.._*`)
   require('pm2').restart('index.js');
});

System({
    pattern: "getmute ?(.*)",
    fromMe: true,
    type: 'manage',
    onlyGroup: true,
    adminAccess: true,
    desc: "mute/unmute group info"
}, async (message, match) => {
   const { autoMute, autoUnmute } = await getData(message.jid);
   if ((!autoMute || autoMute.status === "false") && (!autoUnmute || autoUnmute.status === "false")) return message.reply("*Auto mute and Auto unmute not set yet*");
   let msg = [autoMute?.status === "true" ? `*⬦ Auto Mute Set As:* ${autoMute.message}` : "", autoUnmute?.status === "true" ? `*⬦ Auto Unmute Set As:* ${autoUnmute.message}` : ""].filter(Boolean).join("\n");
   return message.reply("*Scheduled Mutes/Unmutes*\n\n" + msg);
});

System({
  pattern: 'getinfo',
  fromMe: isPrivate,
  type: 'group',
  onlyGroup: true,
  adminAccess: true,
  desc: 'Get group info'
}, async (message, match, m) => {
  const ppUrl = await message.getPP(message.chat);
  const metadata = await message.client.groupMetadata(message.chat);
  const admins = metadata.participants.filter(p => p.admin === 'admin').map(a => a.id.split('@')[0]);
  const { subject, subjectOwner, creation, size, owner, desc, announce, joinApprovalMode } = metadata;
  const caption = `━━━───𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢───━━━\n𝗡𝗔𝗠𝗘: ${subject}\n𝗖𝗥𝗘𝗔𝗧𝗘𝗗 𝗢𝗡: ${new Date(creation * 1000).toLocaleString()}\n𝗦𝗜𝗭𝗘: ${size} MEMBERS\n𝗦𝗨𝗕𝗝𝗘𝗖𝗧 𝗢𝗪𝗡𝗘𝗥: ${subjectOwner ? subjectOwner.split('@')[0] : 'Not defined'}\n𝗢𝗪𝗡𝗘𝗥: ${owner || 'Not defined'}\n𝗗𝗘𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡: ${desc || 'No description'}\n𝗝𝗢𝗜𝗡 𝗔𝗣𝗣𝗥𝗢𝗩𝗔𝗟: ${joinApprovalMode ? 'ENABLED' : 'DISABLED'}\n𝗔𝗡𝗡𝗢𝗨𝗡𝗖𝗘𝗠𝗘𝗡𝗧: ${announce ? 'YES' : 'NO'}\n𝗔𝗗𝗠𝗜𝗡𝗦: ${admins.join(', ')}`;
  await message.reply({ url: ppUrl }, { caption }, 'image');
});
