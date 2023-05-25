const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://ntdevine:HrRx5xLUMtOsuiPm@cluster0.cjf1cek.mongodb.net/todolistDB", { useNewUrlParser: true });

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema] //this tells it to use the item Schema defined above
};

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to do list!"
});

const item2 = new Item({
  name: "add your items below!"
});

const item3 = new Item({
  name: "get to work!"
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(result => {
            console.log("Added default items to list");
            res.redirect("/");  // this needs to be in the loop in order to make sure it gets pulled in correctly
          })
          .catch(err => {
            console.log(err);
          });

      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }

    })

    .catch(function (err) {
      console.log(err);
    });
});

//this section is catching when a new option is created in the homebar
app.get("/:customListName", function (req, res) {
  const customListName = _.lowerCase(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {

      if (!foundList) {

        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        console.log("Saved new list");
        res.redirect("/" + customListName)
      } else {
        res.render("list", { listTitle: _.capitalize(foundList.name), newListItems: foundList.items });
      }
    })
    .catch(function (err) {
      console.log(err);
    })
});


app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: _.lowerCase(listName) })
      .then(function (foundList) {
        foundList.items.push(item)
        foundList.save()
        res.redirect("/" + listName)
      })
  }


});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const checkedListName = _.lowerCase(req.body.listName);

  if (checkedListName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(result => {
        console.log('This was removed');
      })
      .catch(err => {
        console.log(err);
      });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: checkedListName, $pull: {items: {_id: checkedItemId } } } )
      .then(result => {
        console.log("Removed Successfully");
        res.redirect("/"+checkedListName);
      })
      .catch(err => {
        console.log(err);
      })
  }
});



app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
