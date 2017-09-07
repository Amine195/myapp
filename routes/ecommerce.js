// Module Require
var formidable = require('formidable');
var path = require('path');
var fs = require('fs');
var jsesc = require('jsesc');
var async = require('async');

// Import Require
var User = require('../models/user');
var Product = require('../models/product');
var Review = require('../models/review');

// Average
var {arrayAverage} = require('../average');


module.exports = (app) => {

// Paginate function
function paginate(req, res, next) {
    
    var perPage = 9;
    var page = req.params.page;

    Product
    .find()
    .skip( perPage * page)
    .limit( perPage )
    .sort('-created')
    .populate('user')
    .exec(function(err, products) {
        if (err) return next(err);
        Product.count().exec(function(err, count) {
        if (err) return next(err);
        //var avg = arrayAverage(products.ratingNumber);
        res.render('ecommerce/ecommerce', {
            title: 'Ecommerce',
            products: products,
            pages: count / perPage,
            //average: avg
        });
        });
    });

}

// Ecommerce Page
app.get('/ecommerce', function (req, res, next) {
    if (req.user) {
        paginate(req, res, next);
    } else {
        //res.render('home', {title: 'Home'});
        paginate(req, res, next);
    }
});

// Ecommerce Pagination
app.get('/page/:page', function(req, res, next) {
    paginate(req,res,next);
});

// Add-product Page
app.get('/add-product', function (req, res, next) {
    res.render('ecommerce/add-product', {title: 'Add-product'});
});

// Upload Img for Product Page
app.post('/upload', (req, res) => {
    var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../public/uploads');
    form.on('file', (field, file) => {
       fs.rename(file.path, path.join(form.uploadDir, file.name), (err) => {
           if(err){
               throw err
           }
           console.log('File has been renamed');
       }); 
    });
    form.on('error', (err) => {
        console.log('An error occured', err);
    });
    form.on('end', () => {
        console.log('File upload was successful');
    });
    form.parse(req);
});

// Add-product POST
app.post('/add-product', function(req, res, next) {

    var product = new Product();
    
    product.user = req.user._id;
    product.name = req.body.name;
    product.category = req.body.category;
    product.subcategory = req.body.subcategory;
    product.wilaya = req.body.wilaya;
    product.presentation = req.body.presentation;
    product.description = req.body.description;
    product.tel = req.body.tel;
    product.price = req.body.price;
    product.viewcount = 0;
    product.thumbNailImg = req.body.thumbNailImg;

    product.save(function(err) {
        if (err) return next(err);
        // req.flash('success', 'Successfully added a category');
        return res.redirect('/add-product');
    });
});

// details product Page
app.get('/product/:id', function(req, res, next) {
    Product
        .findById({ _id: req.params.id })
        .populate({ path:'user', select:'username' })
        .populate({
            path: 'reviews',
            populate : {
                path:'user',
                select: 'username'
            }
        })
        .exec(function(err, product) {
        if (err) {
            return next(err);
        }
        if (!product) {
            res.send('product not found!');
        } else {
            if(!req.session.viewedProducts) {
                req.session.viewedProducts = [];
            }
            if(!req.session.viewedProducts.includes(product.id)) {
                req.session.viewedProducts.push(product.id);
                product.viewcount++;
                product.save(function (err) {
                    if (err) return next(err);
                    var avg = arrayAverage(product.ratingNumber);
                    res.render('ecommerce/product-details', {
                        title: 'Details',
                        product: product,
                        average: avg
                    }); 
                });
            }
            else {
                var avg = arrayAverage(product.ratingNumber);
                res.render('ecommerce/product-details', {
                    title: 'Details',
                    product: product,
                    average: avg
                }); 
            }
        }
    });
});

// Search fonctionalité
app.get('/search', function(req, res, next) {
    var q = jsesc(req.param('q'));

    Product.find({ name:q }).exec(function (err, products) {
        if (err) {
            return next (err);
        }
        var noResults = false;
        if (products.length < 1) {
            noResults = true
        }
        return res.render('ecommerce/search-result', {
            title: 'Search',
            products: products,
            noResults:noResults,
            searchText:req.param('q')
        });
    });
});

// Advanced Search
app.get('/advanced', function (req, res, next) {
    res.render('ecommerce/advanced-search', {title: 'Advanced-search'});
});

app.get('/search-advanced', function(req, res, next) {

    var name = jsesc(req.param('name'));
    var price = jsesc(req.param('price'));
    var category = jsesc(req.param('category'));

    var searchOptions = {};

    name != "" ? searchOptions.name = name :null;
    
    if (price !== "*") {
        var prices = [price.split(' - ')[0],price.split(' - ')[1]];
        searchOptions.price = {'$gte':prices[0],'$lte':prices[1]};
    }

    category !== "*" ? searchOptions.category = category :null;
 /*    allParams.onSale === "on" ? searchOptions.onSale = true :null; */
    console.log(searchOptions); 


    Product.find(searchOptions).exec(function (err, products) {
        if (err) {
            return next (err);
        }
        var noResults = false;
        if (products.length < 1) {
            noResults = true
        }
        return res.render('ecommerce/search-result', {
            title: 'Search',
            products: products,
            noResults:noResults,
            searchText:req.param('q')
        });
    });
});

// Review Page
app.get('/product/:id/review', function (req, res, next) {

    Product
        .findById({_id: req.params.id})
        .exec(function (err, product) {
            if (err) {
                return next (err);
            }

            console.log(req.params.id);
            return res.render('ecommerce/review', {
                title: 'Review',
                product: product
            });
        });
});

// Register POST
app.post('/product/:id/review', function (req, res, next) {
    
        async.waterfall([
    
            // Create reviews
            function(callback){
                var review = new Review();
                
                    review.user = req.user._id;
                    review.title = req.body.title;
                    review.description = req.body.description;
                    review.starRating = req.body.starRating; 
                    review.product = req.params.id;
                
                    review.save(function(err) {
                        callback(err, review);
                    });
                },          
    
            // find product
            function(review, callback) {
                Product
                    .findById({ _id: req.params.id })
                    .exec(function(err, product) {
                    callback(err, review, product)
                });
            },

            // push RatingNumber
            function(review, product, callback) {
                Product.update({ _id : req.params.id },
                { $push: { ratingNumber : req.body.starRating }},
                (err) => {
                    req.flash('success', 'Your review has been added.');
                    res.redirect('/product/'+req.params.id);
                });
            }
        ]);
    });
}