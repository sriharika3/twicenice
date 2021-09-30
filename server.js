const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./model/user')
const bcrypt = require('bcryptjs')
const moment = require('moment')
const jwt = require('jsonwebtoken')
const fs = require('fs')
var multer = require('multer')
const _ = require('lodash');
// const circularJSON = require('flatted')
const bookModel = require('./model/book');
const wishlistModel = require('./model/wishlist')

const JWT_SECRET = 'sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk'
const ADMIN_P = "admin123"
var token;
var userLogged = false;

mongoose.connect('mongodb://localhost:27017/login-app-db', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	// useCreateIndex: true
})

const app = express()
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/', express.static(path.join(__dirname, 'public')))
app.use(express.static(__dirname + '/views'));
//app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json())


app.get("/",function(req,res){
	if(userLogged == false){
	//if(typeof token === 'undefined' && token) {
   // do something with token
   // this will only work if the token is set in the localStorage
	 res.sendFile(__dirname+"/index.html");
 }else{
	res.sendFile(__dirname+"/logged_home.html");
}
});

app.get("/sellpage", async(req,res)=> {
	if(userLogged == false){
	 //if(typeof token === 'undefined' && token) {
   // do something with token
   // this will only work if the token is set in the localStorage
	 res.sendFile(__dirname+"/index.html");
 }else{
	 res.sendFile(__dirname+"/sellpage.html");
}
});



var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

var upload = multer({ storage: storage });

app.get('/uploadBook', (req, res) => {
	bookModel.find({}, (err, items) => {
			if (err) {
					console.log(err);
					res.status(500).send('An error occurred', err);
			}
			else {
					res.render('imagesPage', { items: items });
			}
	});
});


app.get('/admin', function(req, res){

	bookModel.find({status:"false"}, (err, items) => {
			if (err) {
					console.log(err);
					res.status(500).send('An error occurred', err);
			}
			else {
					res.render('admin', { items: items });
			}
	});
	//res.render("admin");
});

app.post('/api/admin-login', async (req, res) => {
	const { username, password } = req.body
	//const user = await User.findOne({ username }).lean()

	if (username === "admin" && password === ADMIN_P) {
		return res.json({ status: 'ok', data: token })
	}else{
		return res.json({ status: 'error', error: 'Invalid username/password' })
	}
	//res.json({ status: 'error', error: 'Invalid username/password' })
});

app.get('/upload-status', function(req, res){
	const user = jwt.verify(token, JWT_SECRET)
	const _id = user.id
	const username = user.username

	bookModel.find({sellerId:username}, (err, items) => {
			if (err) {
					console.log(err);
					res.status(500).send('An error occurred', err);
			}
			else {
					res.render('sellerStatus', { items: items, user:username });
			}
	});
	//res.render("admin");
});

app.post('/adminconfirm', function(req,res){
	console.log(req.body);
	const len = Number(req.body.button);
	const options = req.body;
	for(var i=0;i<len;i++){
		var op = "ans"+(i);
		var isbn = "isbn"+(i);
		var seller = "seller"+(i);
		console.log(options[isbn]+"  "+options[op]);
		if(options[op] == 1){
			var update = { $set: {status: "true"} };
			bookModel.updateOne({isbn:options[isbn], sellerId: options[seller]}, update, (err,items)=>{
				if(err){
					console.log(err);
					res.status(500).send("An error occurred",err);
				}else{
					if(items){
						console.log("Updated");
					}
					}
				});
		}else{
			var update = { $set: {status: "reject"} };
			bookModel.updateOne({isbn:options[isbn]}, update, (err,items)=>{
				if(err){
					console.log(err);
					res.status(500).send("An error occurred",err);
				}else{
					if(items){
						console.log("Rejected");
					}

					}
				});
		}
	}
	bookModel.find({status:"true", sold:"false"}, (err, items) => {
			if (err) {
					console.log(err);
					res.status(500).send('An error occurred', err);
			}
			else {
					res.render('admin', { items: items });
			}
	});
	res.redirect("/");
});

app.post('/sold', async(req,res) =>{
	const user = jwt.verify(token, JWT_SECRET)
	const _id = user.id
	const username = user.username
	// console.log(req.body.isbn);
	var update = { $set: {sold: "true"} };
	bookModel.updateOne({isbn:req.body.isbn, sellerId:username}, update, (err,items)=>{
		if(err){
			console.log(err);
			res.status(500).send("An error occurred",err);
		}else{
			if(items){
				return res.json({ status: 'ok', data: 'Marked Sold' })
			}else{
				return res.json({ status: 'error', error: 'Item not found' })
			}
			}
		});
});

app.post('/uploadBook', upload.single('image'), (req, res, next) => {
	const user = jwt.verify(token, JWT_SECRET)
	const _id = user.id
	const username = user.username
	console.log("username loggedin = "+ username);
	console.log(req.body);
	const date = moment().format("MMM Do YY")
	//res.send(date)
    var obj = {
			isbn: req.body.isbn,
			title: req.body.title,
			author: req.body.author,
			mrp: req.body.mrp,
			category: req.body.category,
			phone: req.body.phone,
			email: req.body.email,
			description: req.body.desc,
			status: "false",
			sold: false,
			city: req.body.city,
			sellerId: username,
			date:date,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
        }
    }
    bookModel.create(obj, (err, item) => {
        if (err) {
            console.log(err);
        }
        else {
            item.save();
            res.redirect('/sellpage');
        }
    });
});

app.post('/api/wishlist', upload.single('image'), async (req, res) => {
  console.log(req.body);
	const {isbn, sellerId } = req.body
	const user = jwt.verify(token, JWT_SECRET)
	const _id = user.id
	const username = user.username
	const items= await bookModel.findOne({isbn:isbn}).lean()

				if(items){
					console.log(items);
					const isbn = items.isbn
					const title = items.title
					const author =  items.author
					const mrp =  items.mrp
					const category =  items.category
					const phone =  items.phone
					const email =  items.email
					const description =  items.desc
					const status =  "true"
					const sold = false
					const city = items.city
					const seller = sellerId
					const userL = username
					const	img = items.img
					console.log("isbn="+isbn);
					console.log("title="+title);
					var obj = {
						isbn: isbn,
						title: title,
						author: author,
						mrp: mrp,
						category: category,
						phone: phone,
						email: email,
						description: description,
						status: status,
						sold: sold,
						city: city,
						sellerId: seller,
						username: userL,
							img: {
								data: img.data,
								contentType: img.contentType
							}
					}
					wishlistModel.create(obj, (error, book) => {
							if (error) {
									console.log(error);
									return res.json({ status: 'error', error: 'Some error occured at create.' })

							}
							else {
									book.save();
									return res.json({ status: 'ok', data: 'Success' })
							}
					});
					//res.json({ status: 'ok' })
				}else{
					return res.json({ status: 'error', error: 'Some error occured due to no Items.' })

				}
			 //res.render("categories", {catSelected: cat, items:items});
	// });

	// try {
	// 	const response = await wishlistModel.create({
	// 		isdn,
	// 		sellerId
	// 	})
	// 	console.log('User created successfully: ', response)
	// 	//res.sendFile(__dirname+"/index.html");
	// } catch (error) {
	// 	if (error.code === 11000) {
	// 		// duplicate key
	// 		return res.json({ status: 'error', error: 'Username already in use' })
	// 	}
	// 	throw error
	// }
	 //res.json({ status: 'ok' })
});



app.get("/logout",function(req,res){
	userLogged=false;
	//global.window.localStorage.clear();
	console.log("Logged out!!");
	res.redirect("/");
});

app.get("/categories/:topic", async (req,res)=> {
	var logged
	if(userLogged === false){
		 logged = "no"
		//return res.json({ status: 'error', error: 'notlogged' })
	}else{
		logged = "yes"
	}
		let cat = req.params.topic;
		bookModel.find({status:"true", category:cat, sold: false}, (err, items) => {
				if (err) {
						console.log(err);
						res.status(500).send('An error occurred', err);
				}
				else {
					// res.send(items);
						res.render("categories", {catSelected: cat, items:items, logged: logged});
				}
		});

});


app.post('/api/login', async (req, res) => {
	const { username, password } = req.body
	const user = await User.findOne({ username }).lean()

	if (!user) {
		return res.json({ status: 'error', error: 'Invalid username/password' })
	}

	if (await bcrypt.compare(password, user.password)) {
		// the username, password combination is successful

		token = jwt.sign(
			{
				id: user._id,
				username: user.username
			},
			JWT_SECRET
		)
		userLogged = true;

		return res.json({ status: 'ok', data: token })
	}
	res.json({ status: 'error', error: 'Invalid username/password' })
});


app.post('/api/register', async (req, res) => {
  console.log(req.body);
	const {name, username, password: plainTextPassword } = req.body

	if (!username || typeof username !== 'string') {
		return res.json({ status: 'error', error: 'Invalid username' })
	}

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	const password = await bcrypt.hash(plainTextPassword, 10)

	try {
		const response = await User.create({
			name,
			username,
			password
		})
		console.log('User created successfully: ', response)
		//res.sendFile(__dirname+"/index.html");
	} catch (error) {
		if (error.code === 11000) {
			// duplicate key
			return res.json({ status: 'error', error: 'Username already in use' })
		}
		throw error
	}

	res.json({ status: 'ok' })
});


app.get('/wishlist', function(req,res){
	const user = jwt.verify(token, JWT_SECRET)
	const _id = user.id
	const username = user.username
	wishlistModel.find({status:"true", sold: false}, (err, items) => {
			if (err) {
					console.log(err);
					res.status(500).send('An error occurred', err);
			}
			else {
					// res.send(items);
					res.render("categories", {catSelected: "ALL", items:items});

			}
	});
})

app.post('/search', function(req,res){
	var logged
	if(userLogged === false){
		logged = "no"
	}else{
		logged = "yes"
	}
	const ip = req.body.isbn
	bookModel.find({$or: [{isbn: ip}, {title: ip}, {author: ip}, {category: ip}], status:"true", sold:"false"}, (err, items) => {
			if (err) {
					console.log(err);
					res.status(500).send('An error occurred', err);
			}
			else {
					res.render("categories", {catSelected: "ALL", items:items, logged:logged});
			}
	});
})



app.listen(3000,function(){
  console.log("Server is running on port 3000");
});
