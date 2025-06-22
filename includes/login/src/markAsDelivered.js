// ========= markAsDelivered.js was created by Jubayer =========
"use strict";

const utils = require("../utils");
const log = require("npmlog");
const gradient = require("gradient-string");
const chalk = require("chalk");
const config = require("../../../Jubayer.json");

// ======= markAsDelivered function (unchanged) =================
module.exports = function (defaultFuncs, api, ctx) {
    return function markAsDelivered(threadID, messageID, callback) {
        const returnPromise = new Promise((resolve, reject) => {
            if (!callback) {
                callback = (err) => err ? reject(err) : resolve();
            }

            if (!threadID || !messageID) {
                return callback("Error: messageID or threadID is not defined");
            }

            const form = {
                [`message_ids[0]`]: messageID,
                [`thread_ids[${threadID}][0]`]: messageID
            };

            defaultFuncs
                .post("https://www.facebook.com/ajax/mercury/delivery_receipts.php", ctx.jar, form)
                .then(utils.saveCookies(ctx.jar))
                .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
                .then((resData) => {
                    if (resData.error) {
                        throw resData;
                    }
                    callback();
                })
                .catch((err) => {
                    log.error("markAsDelivered", err);
                    if (err.error === "Not logged in.") {
                        ctx.loggedIn = false;
                    }
                    callback(err);
                });

            return returnPromise;
        });
    };
};

// =========== logs function with custom ASCII art =============
module.exports.logs = function () {
    const customAsciiArt = `
 ──╔╦╗─╔╦══╗╔═══╦╗──╔╦═══╦═══╗
──║║║─║║╔╗║║╔═╗║╚╗╔╝║╔══╣╔═╗║
──║║║─║║╚╝╚╣║─║╠╗╚╝╔╣╚══╣╚═╝║
╔╗║║║─║║╔═╗║╚═╝║╚╗╔╝║╔══╣╔╗╔╝
║╚╝║╚═╝║╚═╝║╔═╗║─║║─║╚══╣║║╚╗
╚══╩═══╩═══╩╝─╚╝─╚╝─╚═══╩╝╚═╝`;

    const theme = (config.DESIGN?.Theme || "").toLowerCase();
    let gradientColor, chalkColor;

    switch (theme) {
        case "fiery":
            gradientColor = gradient.fruit;
            chalkColor = chalk.hex("#88c2f7");
            break;
        case "aqua":
            gradientColor = gradient("#2e5fff", "#466deb");
            chalkColor = chalk.hex("#88c2f7");
            break;
        case "hacker":
            gradientColor = gradient("#47a127", "#0eed19", "#27f231");
            chalkColor = chalk.hex("#4be813");
            break;
        case "pink":
            gradientColor = gradient("#ab68ed", "#ea3ef0", "#c93ef0");
            chalkColor = chalk.hex("#8c00ff");
            break;
        case "blue":
            gradientColor = gradient("#243aff", "#4687f0", "#5800d4");
            chalkColor = chalk.blueBright;
            break;
        case "sunlight":
            gradientColor = gradient("#ffae00", "#ffbf00", "#ffdd00");
            chalkColor = chalk.hex("#f6ff00");
            break;
        case "red":
            gradientColor = gradient("#ff0000", "#ff0026");
            chalkColor = chalk.hex("#ff4747");
            break;
        case "retro":
            gradientColor = gradient.retro;
            chalkColor = chalk.hex("#7d02bf");
            break;
        case "teen":
            gradientColor = gradient.teen;
            chalkColor = chalk.hex("#fa7f7f");
            break;
        case "summer":
            gradientColor = gradient.summer;
            chalkColor = chalk.hex("#f7f565");
            break;
        case "flower":
            gradientColor = gradient.pastel;
            chalkColor = chalk.hex("#6ded85");
            break;
        case "ghost":
            gradientColor = gradient.mind;
            chalkColor = chalk.hex("#95d0de");
            break;
        case "purple":
            gradientColor = gradient("#380478", "#5800d4", "#4687f0");
            chalkColor = chalk.hex("#7a039e");
            break;
        case "rainbow":
            gradientColor = gradient.rainbow;
            chalkColor = chalk.hex("#0cb3eb");
            break;
        case "orange":
            gradientColor = gradient("#ff8c08", "#ffad08", "#f5bb47");
            chalkColor = chalk.hex("#ff8400");
            break;
        default:
            gradientColor = gradient("#243aff", "#4687f0", "#5800d4");
            chalkColor = chalk.blueBright;
            setTimeout(() => {
                console.log(`The ${chalk.bgYellow.bold(config.DESIGN?.Theme || "")} theme you provided does not exist!`);
            }, 1000);
    }

    setTimeout(() => {
        const admin = config.DESIGN?.Admin || "Unknown";
        console.log(
            gradientColor.multiline(customAsciiArt),
            "\n",
            gradientColor(" ❱ ") + "Credits to",
            chalkColor("Jubayer Ahmed"),
            "\n",
            gradientColor(" ❱ ") + `Admin: ${chalkColor(admin)}\n`
        );
    }, 1000);
};
