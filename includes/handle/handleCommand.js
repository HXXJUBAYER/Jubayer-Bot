let activeCmd = false;

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const stringSimilarity = require("string-similarity");
  const moment = require("moment-timezone");
  const logger = require("../../utils/log");

  return async function ({ event, ...rest2 }) {
    if (activeCmd) return;
    activeCmd = true;

    const dateNow = Date.now();
    const time = moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY");
    const { allowInbox, PREFIX, ADMINBOT, DeveloperMode, adminOnly } = global.config;
    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const { commands, aliases, cooldowns } = global.client;

    const { body, senderID, threadID, messageID } = event;
    if (!body) return activeCmd = false;

    const threadSetting = Threads.get(threadID) || {};
    const prefix = threadSetting.prefix || PREFIX;
    const isPrefix = body.startsWith(prefix);
    const args = isPrefix ? body.slice(prefix.length).trim().split(/\s+/) : body.trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    const command = commands.get(commandName) || aliases.get(commandName);

    const replyAD = "[ MODE ] - Only bot admin can use bot";

    if (command && !ADMINBOT.includes(senderID) && adminOnly && senderID !== api.getCurrentUserID()) {
      return api.sendMessage(replyAD, threadID, messageID), activeCmd = false;
    }

    if (typeof body === "string" && body.startsWith(PREFIX) && !ADMINBOT.includes(senderID) && adminOnly && senderID !== api.getCurrentUserID()) {
      return api.sendMessage(replyAD, threadID, messageID), activeCmd = false;
    }

    if (userBanned.has(senderID) || threadBanned.has(threadID) || (!allowInbox && senderID === threadID)) {
      if (!ADMINBOT.includes(senderID)) {
        const banData = userBanned.get(senderID) || threadBanned.get(threadID);
        const isUser = userBanned.has(senderID);
        const key = isUser ? "userBanned" : "threadBanned";
        const { reason, dateAdded } = banData || {};

        return api.sendMessage(
          global.getText("handleCommand", key, reason, dateAdded),
          threadID,
          async (err, info) => {
            await new Promise(r => setTimeout(r, 5000));
            return api.unsendMessage(info.messageID);
          },
          messageID
        ), activeCmd = false;
      }
    }

    if (body.startsWith(PREFIX) && !command) {
      const allCommandName = Array.from(commands.keys());
      const checker = stringSimilarity.findBestMatch(commandName, allCommandName);
      return api.sendMessage(
        commandName
          ? global.getText("handleCommand", "commandNotExist", checker.bestMatch.target)
          : `The command you are using does not exist in System, type ${PREFIX}help to see all available commands`,
        threadID,
        messageID
      ), activeCmd = false;
    }

    if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
      if (!ADMINBOT.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [];
        const banUsers = commandBanned.get(senderID) || [];
        if (banThreads.includes(command.config.name)) {
          return api.sendMessage(
            global.getText("handleCommand", "commandThreadBanned", command.config.name),
            threadID,
            async (err, info) => {
              await new Promise(r => setTimeout(r, 5000));
              return api.unsendMessage(info.messageID);
            },
            messageID
          ), activeCmd = false;
        }
        if (banUsers.includes(command.config.name)) {
          return api.sendMessage(
            global.getText("handleCommand", "commandUserBanned", command.config.name),
            threadID,
            async (err, info) => {
              await new Promise(r => setTimeout(r, 5000));
              return api.unsendMessage(info.messageID);
            },
            messageID
          ), activeCmd = false;
        }
      }
    }

    if (command?.config?.commandCategory?.toLowerCase() === "nsfw" &&
      !global.data.threadAllowNSFW.includes(threadID) &&
      !ADMINBOT.includes(senderID)) {
      return api.sendMessage(
        global.getText("handleCommand", "threadNotAllowNSFW"),
        threadID,
        async (err, info) => {
          await new Promise(r => setTimeout(r, 5000));
          return api.unsendMessage(info.messageID);
        },
        messageID
      ), activeCmd = false;
    }

    let permssion = 0;
    try {
      const threadInfoData = await Threads.get(threadID);
      const isAdmin = threadInfoData?.adminIDs?.some(e => e.id === senderID);
      if (ADMINBOT.includes(senderID)) permssion = 2;
      else if (isAdmin) permssion = 1;
    } catch (e) {
      logger.log(global.getText("handleCommand", "cantGetInfoThread", "error"));
    }

    if (command?.config?.hasPermssion > permssion) {
      return api.sendMessage(
        global.getText("handleCommand", "permissionNotEnough", command.config.name),
        threadID,
        messageID
      ), activeCmd = false;
    }

    if (!cooldowns.has(command.config.name)) {
      cooldowns.set(command.config.name, new Map());
    }

    const timestamps = cooldowns.get(command.config.name);
    const expirationTime = (command.config.cooldowns || 1) * 1000;

    if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
      return api.setMessageReaction("⏳", messageID, () => {}, true), activeCmd = false;
    }

    let getText2 = () => {};
    if (command.languages?.[global.config.language]) {
      getText2 = (...values) => {
        let lang = command.languages[global.config.language][values[0]] || "";
        for (let i = values.length - 1; i >= 1; i--) {
          lang = lang.replace(new RegExp("%" + i, "g"), values[i]);
        }
        return lang;
      };
    }

    try {
      const obj = {
        ...rest,
        ...rest2,
        api,
        event,
        args,
        models,
        Users,
        usersData: Users,
        threadsData: Threads,
        Threads,
        Currencies,
        permssion,
        getText: getText2
      };

      if (typeof command.run === "function") {
        await command.run(obj);
        timestamps.set(senderID, dateNow);

        if (DeveloperMode === true) {
          logger.log(
            global.getText(
              "handleCommand",
              "executeCommand",
              time,
              commandName,
              senderID,
              threadID,
              args.join(" "),
              Date.now() - dateNow
            ),
            "DEV MODE"
          );
        }
      }
    } catch (e) {
      api.sendMessage(
        global.getText("handleCommand", "commandError", commandName, e),
        threadID
      );
    }

    activeCmd = false;
  };
};
