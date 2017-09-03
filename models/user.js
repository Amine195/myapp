var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: String,
    secretToken: String,
    secretTokenExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    facebook: { type: String, default: '' },
    tokens: Array,
    active: { type: Boolean, default: false }
});

userSchema.methods.encryptPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
