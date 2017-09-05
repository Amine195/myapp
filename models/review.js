var mongoose = require('mongoose');
var integerValidator = require('mongoose-integer');
var relationship = require("mongoose-relationship");
var Schema = mongoose.Schema;

var reviewSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User'},
    product: { type: Schema.Types.ObjectId, ref: 'Product', childPath:"review"},
    title: String,
    description: String,
    starRating: {type: Number, integer: true},
    created: { type:Date, default: Date.now() }
});

productSchema.plugin(integerValidator);
productSchema.plugin(relationship, { relationshipPathName:'product' });

module.exports = mongoose.model('Review', productSchema);