module.exports = {
    auth: {
        user: 'gmadhgs@gmail.com',
        pass: 'sqllus841999'
    },

    facebook: {
        clientID: '1308595459226998', //Facebook login app id
        clientSecret: '38efa2c828bd3c79f8d4ede2c64709a9', //Facebook login secret key
        profileFields: ['email', 'displayName'],
        callbackURL: 'http://localhost:3000/auth/facebook/callback',
        passReqToCallback: true
    }
}