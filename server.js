const express = require('express');
const { engine } = require('express-handlebars')

const { Server: HttpServer } = require('http')
const { Server: IOServer } = require('socket.io')
const app = express()
const httpServer=new HttpServer(app)
const io = new IOServer(httpServer)

const ContenedorSQL = require('./container/contenedor_mysql');
const clienteSql = require('./sql/options_mysql')
const contenedor_products = new ContenedorSQL(clienteSql, 'products')
const router_products = require('./routes/router')
const router_messages = require('./routes/router_messages')
const Product =  require('./container/contenedor_mysql');
const product = new Product('data/productos.txt');
const Message =  require('./container/contenedor_messages');
const UserRouter = require('./test/router_test');
const { randomUUID } = require('crypto');
const message = new Message('data/messages.txt');
//const UserRouter = require('./test/router_test')
//const router_productstest = UserRouter();

app.use( express.static('/public'))
app.use(express.urlencoded({ extended: true }))
app.set('views', './public/views')
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.use(express.json());

app.use('/api/products', router_products);
app.use('/api/messages', router_messages);
//app.use('/api/products_test', router_productstest);

var valor =1;
var products;
app.get('/', async (req, res) => {
    const Allproducts= await product.recuperar();
    const Allmessages=await message.getAll();
    if(valor){
        res.render('products',{Allproducts, existproducts: Allproducts.length > 0,Allmessages});
    }
    else{
        res.render('login')
    }
})

io.on('connection', socket => {
    console.log('Nuevo cliente conectado!');

    socket.on('listproduct-in' , products => {
        const productsOut={
            id: randomUUID(),
            title : products.title,
            price : products.price,
            thumbnail : products.thumbnail
        }
        contenedor_products.guardar(productsOut);
        console.log(productsOut)
        io.sockets.emit('listproduct-in', productsOut)
    })


    socket.on('messagess-in' , messages => {
        const day   = new Date().getDate();
        const month = new Date().getMonth() + 1;
        const year  = new Date().getFullYear();
        const time  = new Date().toLocaleTimeString()
    const date = `${day}/${month}/${year} ${time}`
        const messagesOut={
            email : messages.email,
            message : messages.message,
            date : date
        }
        message.save(messagesOut);
        console.log(messagesOut)
        io.sockets.emit('messagess-in', messagesOut)
    })


})


const PORT = 8080;

const connectedServer = httpServer.listen(PORT, function () {
    console.log(`Servidor Http con Websockets escuchando en el puerto ${connectedServer.address().port}`)
})
connectedServer.on('error', error => console.log(`Error en servidor ${error}`))