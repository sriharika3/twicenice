const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./model/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs');
const bookModel = require('./model/book');

const JWT_SECRET = 'sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk'
var token;
var userLogged = false;
mongoose.connect('mongodb://localhost:27017/login-app-db', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	// useCreateIndex: true
})

const app = express()
app.set('view engine', 'ejs');
// app.use(bodyParser.urlencoded({ extended: true }))
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

app.get("/sellpage",function(req,res){
	if(userLogged == false){
	//if(typeof token === 'undefined' && token) {
   // do something with token
   // this will only work if the token is set in the localStorage
	 res.sendFile(__dirname+"/index.html");
 }else{
	res.sendFile(__dirname+"/sellpage.html");
}
});

var multer = require('multer');

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

app.post('/uploadBook', upload.single('image'), (req, res, next) => {

    var obj = {
			isbn: req.body.isbn,
			title: req.body.title,
			author: req.body.author,
			mrp: req.body.mrp,
			category: req.body.category,
			phone: req.body.phone,
			email: req.body.email,
			status: false,
			//sellerId: String,
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
            res.redirect('/');
        }
    });
});

app.get("/logout",function(req,res){
	userLogged=false;
	console.log("Logged out!!");
	res.redirect("/");
});

app.get("/categories/:topic", function(req,res){
  let cat = req.params.topic;

  res.render("categories", {catSelected: cat});

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







app.listen(3000,function(){
  console.log("Server is running on port 3000");
});
