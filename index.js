const Database = require('easy-json-database')
const db = new Database('./database.json')

const Discord = require('discord.js')
const client = new Discord.Client()

const tiktok = require('tiktok-scraper')
const config = require('./config.json')

client.login(config.token)

const resolveID = async () => (await tiktok.getUserProfileInfo(config.tiktokAccount)).user.id

const sync = async (userID) => {
    const cache = db.get('cache')
    const { collector: newPosts } = await tiktok.user(userID)
    if (newPosts.length === 0) return
    const newPostsSorted = newPosts.sort((a, b) => b.createTime - a.createTime).slice(0, 10)
    const post = newPostsSorted.filter((post) => !cache.includes(post.id))[0]
    if (cache && post && (post.createTime > ((Date.now() - 60 * 24 * 60 * 60 * 1000) / 1000))) {
        const author = post.authorMeta.nickName
        const link = post.webVideoUrl
        const embed = new Discord.MessageEmbed()
            .setAuthor(author, client.user.displayAvatarURL())
            .setTitle(post.text)
            .setThumbnail(config.embed_icon_url)
            .setImage(post.covers.default)
            .setColor('#00FF00')
            .setTimestamp()
            .setFooter(author, client.user.displayAvatarURL())
        client.channels.cache.get(config.notifChannel).send(`[@everyone]\n\n**${author} vient de poster un nouveau Tiktok !\n\nVa vite le voir ici : ${link} !**`, embed)
    }
    db.set('cache', newPostsSorted.map((post) => post.id))
}

client.on('ready', async () => {
    client.user.setActivity(config.activity, {
        type: 'WATCHING'
    })
    const userID = await resolveID()
    sync(userID)
    setInterval(() => sync(userID), 120 * 1000)
})
