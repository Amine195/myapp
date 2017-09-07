var mongoose = require('mongoose');
var integerValidator = require('mongoose-integer');
var relationship = require("mongoose-relationship");
var Schema = mongoose.Schema;

var productSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', childPath:"product"},
    name: String,
    category: String,
    subcategory: String,
    wilaya: String,
    presentation: String,
    description: String,
    created: { type:Date, default: Date.now() },
    modified: Date,
    tel: Number,
    price: Number,
    viewcount: {type: Number, integer: true},
    thumbNailImg: String,
    ratingNumber: [{ type: Number, integer: true }],
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review'}]
});

productSchema.plugin(integerValidator);
productSchema.plugin(relationship, { relationshipPathName:'user' });

module.exports = mongoose.model('Product', productSchema);