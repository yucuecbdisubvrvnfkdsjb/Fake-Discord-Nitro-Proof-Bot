const { Builder, Browser, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require("./config.json");
const Discord = require("discord.js");
const express = require("express");
const fs = require("fs");

function formatAMPM(e) {
    var hours = e.getHours();
    var minutes = e.getMinutes();
    var period = hours >= 12 ? "PM" : "AM";
    hours = (hours %= 12) || 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return hours + ":" + minutes + " " + period;
}

const client = new Discord.Client({intents: Object.keys(Discord.GatewayIntentBits)});

client.on("ready", () => console.log(`${client.user.username} est connecté`));

client.on("messageCreate", async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (message.content.indexOf(config.prefix) !== 0) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    
    switch(message.content.split(config.prefix)[1].split(' ')[0]){

        case "classic":
            let user = message.mentions.users.first() || client.users.cache.get(args[1]) || await client.users.fetch(args[1] ?? 0).catch(() => false)
            if (!user) user = message.author

            await nitro("classic", message, user, args)
            break

        case "boost":
            let user2 = message.mentions.users.first() || client.users.cache.get(args[1]) || await client.users.fetch(args[1] ?? 0).catch(() => false)
            if (!user2) user2 = message.author
    
            await nitro("boost", message, user2, args)
            break
    }
});


async function nitro(path, message, user, args){
    const app = express();
    const port = Math.floor(Math.random() * 9000) + 1000;

    let a = formatAMPM(new Date());
    let n = formatAMPM(new Date(Date.now() - 60000));
    let o = fs.readFileSync(`${__dirname}/sites/${path}.html`, "utf8");
    let datatosend = o;

    datatosend = datatosend.replace("FIRSTAUTHORURL", message.author.displayAvatarURL())
    datatosend = datatosend.replace("THEFIRSTAUTHOR", message.author.displayName ?? message.author.username)
    datatosend = datatosend.replace("SECONDAUTHORURL", user.displayAvatarURL())
    datatosend = datatosend.replace("THESECONDAUTHOR", user.displayName ?? user.username)
    datatosend = datatosend.replace("RESPONSETONITRO", args.slice(2)?.join(" "))
    datatosend = datatosend.replace("FIRSTAUTHORDATE", "Today at " + n)
    datatosend = datatosend.replace("SECONDAUTHORDATE", "Today at " + a);

    app.get("/font", (req, res) => res.sendFile(`${__dirname}/sites/Whitneyfont.woff`));
    app.get("/", (req, res) => res.send(datatosend));

    let server = app.listen(port)
    let driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(new chrome.Options().addArguments('--headless').addArguments('--disable-gpu')).build();

    await driver.get(`http://localhost:${port}`);
    await driver.wait(until.elementLocated(By.xpath('/html/body/div[1]/div[1]/div[1]/div[2]/div[2]')), 10000);
    
    const screenshot = await driver.takeScreenshot();
    fs.writeFileSync('screenshot.png', screenshot, "base64");

    driver.quit().catch(() => false);

    await message.channel.send({files: [new Discord.AttachmentBuilder("screenshot.png", "NitroProof.png")]});
    server.close()
    fs.unlinkSync('screenshot.png')
}


client.login(config.token);