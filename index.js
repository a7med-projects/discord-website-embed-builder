const { Discord , MessageEmbed , Client , Intents } = require("discord.js");
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

var express = require('express');
var app = express();
const session = require('express-session');
var path = require('path');
var bodyParser = require('body-parser');
const ejs = require('ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");
app.use(express.static("public"));
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy
    , refresh = require('passport-oauth2-refresh');
const scopes = ['identify', 'email', 'guilds', 'guilds.join'];
const config = require("./config.json");

passport.use(new DiscordStrategy({
    clientID: config.clientid,
    clientSecret: config.clientsecret,
    callbackURL: config.callbackURL,
    scope: scopes
}, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
            return done(null, profile);
    });
}));

app.use(session({
    secret: 'some random secret' ,
    cookie: {
        maxAge: 60000 * 60 * 24
    },
    saveUninitialized:false,
    resave: false
}));

app.get('/login', passport.authenticate('discord', { failureRedirect: '/' }), function(req, res) {
    res.redirect('/servers');
});

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});
app.use(passport.initialize());
app.use(passport.session());

app.get('/logout', function(req, res) {
    if (req.isAuthenticated()) {
        req.logout();
        res.redirect('/');
    }
});

app.get('/', function(req, res) {
    res.render('index', {
        client: client,
        user: req.user
    });
});

app.get('/servers', function(req, res) {
    if (!req.user) return res.redirect('/');
    let myGuilds= req.user.guilds.filter(u => (u.permissions & 8) === 8);
    if(req.user) {
        res.render('servers', {
            bot: client,
            user: req.user,
            guilds: myGuilds
        });
    }
});

app.get('/server/:id/manage', function(req, res) {
    let guild = client.guilds.cache.get(req.params.id);
    if (!req.user) return res.redirect('/');
    if(req.user) {
        res.render('dashboard', {
            client: client,
            user: req.user,
            guild: guild
        });
    }
});

app.post('/server/:id/post/embed', function(req, res) {
    let guild = client.guilds.cache.get(req.params.id);
    let embed = new MessageEmbed()
        .setTitle(req.body.title)
        .setDescription(req.body.description)
        .setThumbnail(req.body.thumbnail)
        .setImage(req.body.image)
        .setURL(req.body.url)
        .setAuthor(req.body.author)
        .setColor(req.body.color)
        .setFooter({
            text: `this project is made by A7MED#6994`,
        })
        client.guilds.cache.get(req.params.id).channels.cache.find(c => c.name === req.body.channel).send({ embeds: [embed] });
        res.redirect('/server/' + req.params.id + '/manage');
});

app.get('*', function(req, res) {
    res.redirect('/');
});

app.get('/discord', function(req, res) {
    res.redirect(config.discordserver);
});

app.get('/invite', function(req, res) {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.clientid}&permissions=8&scope=bot`);
});

var listeners = app.listen(config.port, function() {
    console.log(`Listening on port ${config.port} , http://localhost:${config.port}/`);
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(config.token);