const express = require('express')
const app = express()
app.set("view engine", "ejs")
const passport = require('passport')

const session = require('express-session')

const facebookStratejy = require('passport-facebook').Strategy

const User = require('./models/User')

app.use(session({
    secret: "secretkey",
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());


//make fb

passport.use(new facebookStratejy({
    clientID: "1768376430027101",
    clientSecret: '2c0e3a083fea9a762f3722966b70720a',
    callbackURL: 'http://localhost:5000/facebook/callback',
    profileFields: ['id', 'displayName', 'name', 'gender', 'picture.type(large)', 'email']
},
    function (token, refreshToken, profile, done) {

        process.nextTick(function () {

            User.findOne({ 'uid': profile.id }, function (err, user) {

                if (err)
                    return done(err);

                if (user) {
                    console.log("user found")
                    console.log(user)
                    return done(null, user); // user found, return that user
                } else {
                    console.log('new user')
                    var newUser = new User();

                    newUser.uid = profile.id; // set the users facebook id                   
                    newUser.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                    newUser.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                    newUser.pic = profile.photos[0].value
                    newUser.save(function (err) {
                        if (err)
                            throw err;

                        return done(null, newUser);
                    });
                }

            });

        })

    }));

app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.get('/login', passport.authenticate('facebook', { scope: 'email' }))

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/failed'
}))


app.get('/profile', isLoggedIn,(req, res) => {
console.log(req.user)
res.render('profile',{user:req.user})
})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next()
    }res.redirect('/') 
}

app.get('./failed', () => {
    res.send('you are not a valid user')
})
passport.serializeUser(function (user, done) {
    done(null, user.id)
})
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user)
    })
})

app.listen(5000, () => console.log("server started"))