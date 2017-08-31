var mongoose = require('mongoose');
var integerValidator = require('mongoose-integer');
var Schema = mongoose.Schema;

var productSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User'},
    name: String,
    category: String,
    subcategory: String,
    wilaya: String,
    presentation: String,
    description: String,
    created: Date,
    modified: Date,
    tel: Number,
    price: Number,
    viewcount: {type: Number, integer: true},
    thumbNailImg: String
});

productSchema.plugin(integerValidator);

module.exports = mongoose.model('Product', productSchema);