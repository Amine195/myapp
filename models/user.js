var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var relationship = require("mongoose-relationship");
var Schema = mongoose.Schema;

var userSchema = new Schema({
    username: String,
    email: String ,
    password: String,
    secretToken: String,
    secretTokenExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    facebook: { type: String, default: '' },
    google: { type: String, default: '' },
    tokens: Array,
    active: { type: Boolean, default: false },
    product: [{ type: Schema.Types.ObjectId, ref: 'Product'}]
});

userSchema.methods.encryptPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
