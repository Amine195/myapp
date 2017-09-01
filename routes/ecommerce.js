// Import Require
var User = require('../models/user');
var Product = require('../models/product');

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
        res.render('ecommerce/ecommerce', {
            title: 'Ecommerce',
            products: products,
            pages: count / perPage
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

// Add-product POST
app.post('/add-product', function(req, res, next) {

    var product = new Product()
    product.user = req.user._id;
    product.name = req.body.name;
    product.category = req.body.category;
    product.subcategory = req.body.subcategory;
    product.wilaya = req.body.wilaya;
    product.presentation = req.body.presentation;
    product.description = req.body.description;
    product.created = Date.now();
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
        .populate('user')
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
                    res.render('ecommerce/product-details', {
                        title: 'Details',
                        product: product
                    }); 
                });
            }
            else {
                res.render('ecommerce/product-details', {
                    title: 'Details',
                    product: product
                }); 
            }
        }
    });
});


}