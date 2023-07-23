const http = require('http'); // модуль для создания http сервера
const fs = require('fs'); // модуль для работы с файлами
const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require("jsonwebtoken");
const secretKey = "P0PR0BU1BRUTF0RCE!!!"

function isFileExists(filename){
    if(!fs.existsSync(filename)) return false
    data = fs.readFileSync(filename, 'utf-8');
    return !data.length == 0;
}

function readJson(filename){
  var data = fs.readFileSync(filename, 'utf-8');
  data = data.toString().replace(/\n/g, '');
  return JSON.parse(data)
}


class Server {
  constructor() { 
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));


    const options = {
      definition: {
        openapi: '3.0.0',
        components:{
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        },
        info: {
          title: 'User API',
          version: '1.0.0',
        },
      },
      apis: ['./main.js'], 
    };

    this.specs = swaggerJsdoc(options);
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(this.specs));
    
  }
  auth(req, res, next){
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403).send("Ошибка авторизации");
            }

            req.user = user;
            next();
        });
    } else {
        return res.sendStatus(401)
    }

  next();
  }

  start(port) {
    this.app.get('/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(this.specs);
    });
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(this.specs));

    // Запускаем сервер на указанном порту
    this.app.listen(port, () => {
      console.log(`Сервер запущен на порту ${port}`);
    });
  }
}


class Books {
  constructor(){
    this.filename = "books.json"
    this.maxId = 0
    if(isFileExists(this.filename)) {
        data = readJson(this.filename)
        for(var i = 0; i < data.length; i++){
            if ((data[i].id + 1) > this.maxId) this.maxId = data[i].id + 1;
        }
    }
  }
  find(books, id){
    for(var i = 0; i < books.length; i++){
      if (books[i].id == id) return i
    }
    return -1
  }
  add(book){
    var books_data = undefined
    var data = undefined
    var unique = true
    if (!isFileExists(this.filename)){
      book.id = this.maxId
      this.maxId++;
      data = '[' + JSON.stringify(book) + ']'
      fs.writeFileSync(this.filename, data, 'utf-8')
      return true
    }
    var books_data = readJson(this.filename)
    books_data.forEach(iter_book => {
      if (iter_book.title == book.title && iter_book.author == book.author){
        unique = false
        return
      }
    });
    if(!unique){
        return false;
    }
    book.id = this.maxId
    this.maxId++;
    books_data.push(book)
    fs.writeFileSync(this.filename, JSON.stringify(books_data), 'utf-8')
    return true
  }
  get_all(){
    if(!isFileExists(this.filename)) return null;
    var books_data = readJson(this.filename);
    return books_data
  }
  get(id){
    if(!isFileExists(this.filename)) return null;
    var books_data = readJson(this.filename);
    var idx = this.find(books_data, id);
    if (idx == -1) return null
    return books_data[idx]
  }
  put(id, book){
    if(!isFileExists(this.filename)) return false;
    var books_data = readJson(this.filename);
    var idx = this.find(books_data, id);
    if (idx == -1) return false
    id = books_data[idx].id
    book.id = id
    books_data[idx] = book
    fs.writeFileSync(this.filename, JSON.stringify(books_data), 'utf-8') 
  }
  delete(id){
    if(!isFileExists(this.filename)) return false;
    var books_data = readJson(this.filename);
    var idx = this.find(books_data, id);
    if (idx == -1) return false
    if (idx == 0){
      books_data = []
    } else {
      books_data.splice(idx, -1)
    }
    fs.writeFileSync(this.filename, JSON.stringify(books_data), 'utf-8') 
  }
}

class Users {
  constructor(){
    this.filename = "users.json"
    this.maxId = 0
    if(isFileExists(this.filename)) {
        data = readJson(this.filename)
        for(var i = 0; i < data.length; i++){
            if ((data[i].id + 1) > this.maxId) this.maxId = data[i].id + 1;
        }
    }
  }
  signUp(user){
    var users_data = []
    if(isFileExists(this.filename)){
      var finded = false;
      users_data = readJson(this.filename)
      users_data.forEach(curr_user => {
        if(curr_user.login == user.login) {
          finded = true;
          return;
        }
      });
      if(finded) return false;
    }
    user.id = this.maxId
    this.maxId++
    users_data.push(user)
    fs.writeFileSync(this.filename, JSON.stringify(users_data), 'utf-8')
    return true
  }
  signIn(user){
    if(!isFileExists(this.filename)) return false;
    var users_data = readJson(this.filename);
    var finded = true;
    users_data.forEach(curr_user => {
      if(curr_user.login == user.login && curr_user.password == user.password) {
        finded = true;
        return;
      }
    });
    if(finded) return true
    return false
  }
}


var user = {
  login: 'sanya__sdftgh',
  password: 'sanya2007'
}

var book = {
  author: 'Sanya',
  title: 'Способы продать гараж',
  date: '22.07.2023',
  text: 'Через газету, через авито, через звонки'
}


// Создаем экземпляр класса Server
const server = new Server();
const books = new Books();
const users = new Users();



/**
 * @openapi
 * /signup:
 *   post:
 *     tags:
 *       - Authorization
 *     summary: Registrates a user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                  type: string 
 *                  example: Glukhovsky
 *               password:
 *                  type: string
 *                  example: 34505
 *     responses:
 *       201:
 *         description: Пользователь зарегистирован
 *       409:
 *         description: Такой пользователь уже существует
 */
server.app.post("/signup", (req, res) => {
  if(!req.body) return res.status(400).send("Пустой запрос");
  var user = req.body
  var status = users.signUp(req.body);
  if (!status){
    return res.status(409).send("Такой пользователь уже существует!")
  }
  let token;
  try {
    token = jwt.sign(
      { userId: user.login},
      secretKey,
      { expiresIn: "6h" }
    );
  } catch (err) {
    const error = new Error("Error! Something went wrong.");
    return next(error);
  }
  res
    .status(201)
    .json({
      success: true,
      data: { userId: req.body.login, token: token },
    });
})


/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Authorization
 *     summary: Aunthenticates a user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                  type: string 
 *                  example: Glukhovsky
 *               password:
 *                  type: string
 *                  example: 34505
 *     responses:
 *       201:
 *         description: Пользователь успешно авторизован
 *       401:
 *         description: Неверный логин или пароль
 */
server.app.post("/login", (req, res) => {
  if(!req.body) return res.status(400).send("Пустой запрос");
  var user = req.body
  var status = users.signIn(req.body);
  if (!status){
    return res.status(401).send("Неверный логин или пароль")
  }
  let token;
  try {
    token = jwt.sign(
      { userId: user.login},
      secretKey,
      { expiresIn: "6h" }
    );
  } catch (err) {
    const error = new Error("Error! Something went wrong.");
    return next(error);
  }
  res
    .status(201)
    .json({
      success: true,
      token: token
    })
  }
)

/**
 * @openapi
 * /book:
 *   post:
 *     summary: Upload a book
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Book
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               author:
 *                  type: string 
 *                  example: Glukhovsky
 *               title:
 *                  type: string
 *                  example: Metro 34505
 *               date:
 *                  type: string
 *                  example: 27.05.2004
 *               text: 
 *                  type: string
 *                  example: Prodam Garazh
 *     responses:
 *       201:
 *         description: Книга успешно добавлена
 *       409:
 *         description: Книга уже в каталоге
 *       401:
 *         description: Не авторизован
 */
server.app.post("/book", server.auth, (req, res) => {
  if(!req.body) return res.status(400).send("Пустой запрос");
  var status = books.add(req.body)
  if (!status){
    return res.status(409).send("Такая книга уже есть в каталоге!")
  }
  return res.status(201).send("Успешно")
})


/**
 * @openapi
 * /book:
 *   get:
 *     summary: Get all books
 *     tags:
 *       - Book
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список книг
 *       404:
 *         description: Книги не найдены
 *       401:
 *         description: Не авторизован
 */
server.app.get("/book", server.auth, (req, res) => {
  var books_data = books.get_all()
  if(!books_data) return res.status(404).send("Каталог пуст")
  res.json(books_data)
})


/**
 * @openapi
 * /book/{id}:
 *   get:
 *     summary: Get book by id
 *     tags:
 *       - Book
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *     - name: id
 *       in: path
 *       description: Идентификатор книги
 *       required: true
 *       schema:
 *         type: integer
 *     responses:
 *       200:
 *         description: Книга
 *       404:
 *         description: Книга не найдена
 *       401:
 *         description: Не авторизован
 */
server.app.get("/book/:id", server.auth, (req, res) => {
  var book = books.get(req.params.id)
  if(!book) return res.status(404).send("Книга не найдена")
  res.json(book)
})


/**
 * @openapi
 * /book/{id}:
 *   put:
 *     summary: Update book
 *     tags:
 *       - Book
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *     - name: id
 *       in: path
 *       description: Идентификатор книги
 *       required: true
 *       schema:
 *         type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               author:
 *                  type: string
 *                  example: Glukhovsky
 *               title:
 *                  type: string
 *                  example: Metro 34505
 *               date:
 *                  type: string
 *                  example: 27.05.2004
 *               text:
 *                  type: string
 *                  example: Prodam Garazh
 *     responses:
 *       200:
 *         description: Книга успешно обновлена
 *       404:
 *         description: Книга не найдена
 *       401:
 *         description: Не авторизован
 */
server.app.put("/book/:id", server.auth, (req, res) => {
  var status = books.put(req.params.id, req.body)
  if(!status) return res.status(404).send("Книга не найдена")
  res.status(200).send("Успешно")
})


/**
 * @openapi
 * /book/{id}:
 *   delete:
 *     summary: Delete book
 *     tags:
 *       - Book
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *     - name: id
 *       in: path
 *       description: Идентификатор книги
 *       required: true
 *       schema:
 *         type: integer
 *     responses:
 *       200:
 *         description: Книга успешно удалена
 *       404:
 *         description: Книга не найдена
 *       401:
 *         description: Не авторизован
 */
server.app.delete("/book/:id", server.auth, (req, res) => {
  var status = books.delete(req.params.id)
  if(!status) return res.status(404).send("Книга не найдена")
  res.status(200).send("Успешно")
})

server.start(3000);

module.exports = Server;