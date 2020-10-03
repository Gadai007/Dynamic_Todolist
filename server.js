const express = require('express')
const app = express()
const https = require('https')
const mongoose = require('mongoose')
const _ = require('lodash')

const PORT = process.env.PORT || 3000

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

mongoose.connect('mongodb+srv://gadai123:gadai123@cluster0.cndjo.mongodb.net/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }).then(() => {
    console.log('Connected to database');
}).catch(err => {
    console.log('failed to connect ', err);
})

const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

const Item = mongoose.model('item', itemsSchema)

const busyDay = new Item({ name: 'busy day' })
const niceDay = new Item({ name: 'Nice day' })
const goodDay = new Item({ name: 'good day' })

const defaultList = [busyDay, goodDay, niceDay]

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const List = mongoose.model('list', listSchema)

app.get('/', (req, res) => {

    Item.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }
        else if (result.length === 0) {
            Item.insertMany(defaultList, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('successfully saved the default items');
                }
            })
            res.redirect('/')
        }
        else {
            res.render('list', {
                listTitle: 'Today',
                newListItem: result
            })
        }
    })

})

app.get('/:dynamic', (req, res) => {
    const dynamic = _.capitalize(req.params.dynamic)

    List.findOne({ name: dynamic }, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: dynamic,
                    items: defaultList
                })
                list.save()
                res.redirect('/' + dynamic)
            } else {
                res.render('list', {
                    listTitle: foundList.name,
                    newListItem: foundList.items
                })
            }
        }
    })

})

app.post('/', (req, res) => {
    let text = req.body.newItem
    let listName = req.body.list

    const item = new Item({ name: text })

    if (listName === 'Today') {
        item.save()
        res.redirect('/')
    } else {
        List.findOne({ name: listName }, (err, found) => {
            found.items.push(item)
            found.save()
            res.redirect('/' + listName)
        })
    }
})

app.post('/delete', (req, res) => {
    const checkboxId = req.body.checkbox
    const listName = req.body.listName

    if (listName === 'Today') {
        Item.findByIdAndRemove(checkboxId, (err) => {
            if (!err) {
                console.log('Item deleted')
                res.redirect('/')
            }
        })
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkboxId } } }, (err, result) => {
            if(!err){
                res.redirect('/' + listName)
            }
        })
    }
})



app.listen(PORT, () => {
    console.log('Server started on port 3000')
})